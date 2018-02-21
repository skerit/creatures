var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    Base = require('./base.js'),
    enabled_graceful_cleanup,
    CrHistory = require('./cr_history.js'),
    SfcWorld = require('./sfc_world.js'),
    Creature = require('./creature.js'),
    libpath = require('path'),
    Export = require('./export.js'),
    Genome = require('./genome.js'),
    SfcOle = require('./sfc_ole.js'),
    names = require('./names.js'),
    Obj = Blast.Bound.Object,
    Egg = require('./egg.js'),
    S16 = require('./s16.js'),
    tmp = require('tmp'),
    Fn = Blast.Collection.Function,
    os = require('os'),
    fs = require('fs'),
    App;

/**
 * The Creatures Application class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.1
 */
App = Fn.inherits('Develry.Creatures.Base', function CreaturesApplication() {

	// Create a connection object
	this.ole = new SfcOle();

	// Creature objects
	this.creatures = {};

	// Egg objects
	this.eggs = {};

	// For now, only c2 is supported
	this.is_c1 = false;

	// Listen for VBOle error objects
	this.listenForVBErrors();

	// Get the path to the process
	this.getProcessPath();

	// Get the play state
	this.getIsPlaying();

	// Play/pause state
	this.paused = null;
});

/**
 * Export Protoblast for nw.js
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
App.setProperty('__Protoblast', Blast);

/**
 * All available names
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
App.setProperty('names', names);

/**
 * Prepare the path to the user's "My Documents" folder
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App.prepareProperty(function my_documents_path() {

	var personal_folder,
	    release,
	    path;

	// Get the os release version.
	// We always assume it's windows
	release = os.release();

	// Detect XP or 2K
	if (release.indexOf('5.1') == 0 || release.indexOf('5.0') == 0) {
		personal_folder = 'My Documents';
	} else {
		personal_folder = 'Documents';
	}

	// Construct the path
	path = libpath.resolve(process.env.USERPROFILE, personal_folder);

	return path;
});

/**
 * Prepare the path to the directory containing the worlds data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App.prepareProperty(function worlds_data_path() {

	var my_documents = this.my_documents_path,
	    game_name,
	    path;

	if (this.is_c1) {
		game_name = 'Creatures 1';
	} else {
		game_name = 'Creatures 2';
	}

	path = libpath.resolve(my_documents, 'Creatures', game_name);

	return path;
});

/**
 * Prepare the path to the directory containg all worlds history
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App.prepareProperty(function worlds_history_path() {
	return libpath.resolve(this.worlds_data_path, 'History');
});

/**
 * Get the path to the current C2 process
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
App.setCacheMethod(function getProcessPath(callback) {

	var that = this;

	if (!callback) {
		callback = Function.thrower;
	}

	this.ole.sendJSON([
		// Make the c2window the active window
		{type: 'c2window'},

		// And get the process path
		{type: 'getprocesspath'}
	], function gotResponses(err, res) {

		if (err || !res[0] || !res[0].handle) {
			console.error('Could not get C2 Window', err, res);

			setTimeout(function doRetry() {
				getProcessPath.call(that, callback);
			}, 3000);

			return;
		}

		// 0 will be the C2 window handle, 1 is the process
		that.process_path = res[1].process_path;

		// Also store the dir
		that.process_dir = libpath.dirname(that.process_path);

		// Emit the ready event
		that.emitOnce('ready');

		callback(null, res[1]);
	});
});


/**
 * Guess the name of the current open world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 */
App.setCacheMethod(function listenForVBErrors() {
	var that = this,
	    last_error = null;

	// Listen for vbole_error events,
	// these require a response object!
	this.ole.on('vbole_error', function gotError(data, callback) {

		if (data.error == 'DialogBox') {
			// Let the library implementers handle it.
			// Albian Command has a setting that can automatically close it
			that.emit('error_dialogbox', data, callback, last_error, null);

			// A possible way of solving it is to just close it, like:
			// callback({type: 'close'});
		} else {
			that.emit('error_vbole', data, callback, last_error, null);
		}

		last_error = data;
	});
});

/**
 * Get a temporary file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Object}   options
 * @param    {Function} callback
 */
App.setMethod(function getTemporaryFile(options, callback) {

	if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	if (options.mode == null) {
		options.mode = 0644;
	}

	if (options.discardDescriptor == null) {
		// Don't give us a file descriptor, this causes the file to be "open"
		// and then Creatures 2 will refuse to open it
		options.discardDescriptor = true;
	}

	tmp.file(options, function gotFile(err, path) {

		if (err) {
			return callback(err);
		}

		callback(null, path);
	});

	if (!enabled_graceful_cleanup) {
		enabled_graceful_cleanup = true;
		tmp.setGracefulCleanup();
	}
});

/**
 * A copyFile implementation
 * (Because fs.copyFile is only available in node v8.5+)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}   source
 * @param    {String}   target
 * @param    {Function} callback
 */
App.setMethod(function copyFile(source, target, callback) {

	var read_stream,
	    write_stream;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Allow the callback to only be called once
	callback = Fn.regulate(callback);

	read_stream = fs.createReadStream(source);

	read_stream.on('error', function onError(err) {
		callback(err);
	});

	write_stream = fs.createWriteStream(target);

	write_stream.on('error', function onError(err) {
		callback(err);
	});

	write_stream.on('close', function done(ex) {
		callback();
	});

	read_stream.pipe(write_stream);
});

/**
 * Guess the name of the current open world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function getWorldName(callback) {

	var that = this,
	    worlds = {};

	// Get all creatures
	that.getCreatures(function gotCreatures(err, creatures) {

		var tasks = [];

		if (err) {
			return callback(err);
		}

		creatures.forEach(function eachCreature(creature) {
			tasks.push(function getHistory(next) {
				creature.getWorldNames(function gotNames(err, names) {

					var name,
					    i;

					if (err) {
						return next(err);
					}

					for (i = 0; i < names.length; i++) {
						name = names[i];

						if (!worlds[name]) {
							worlds[name] = 0;
						}

						worlds[name]++;
					}

					next();
				});
			});
		});

		Fn.parallel(tasks, function done(err) {

			var count = 0,
			    name,
			    val,
			    key;

			if (err) {
				return callback(err);
			}

			for (key in worlds) {
				val = worlds[key];

				if (val > count) {
					count = val;
					name = key;
				}
			}

			callback(null, name);
		});
	});
});

/**
 * Get all existing world names (worlds that have a History folder)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function getWorlds(callback) {

	var that = this,
	    tasks = [],
	    result = [],
	    result_map = {},
	    history_path = this.worlds_history_path;

	fs.readdir(history_path, function gotContents(err, list) {

		if (err) {
			return callback(err);
		}

		list.forEach(function eachFile(file) {

			tasks.push(function getStat(next) {
				var full_path = libpath.resolve(history_path, file, 'GameLog');

				// Stat the gamelog file
				fs.stat(full_path, function gotStat(err, stat) {

					if (!err && stat.isFile()) {

						// Push the name of the world to the array
						result.push(file);

						// Add it to the map, too
						result_map[file] = libpath.resolve(history_path, file);
					}

					next();
				});
			});
		});

		Fn.parallel(tasks, function done(err) {

			if (err) {
				return callback(err);
			}

			callback(null, result, result_map);
		});
	});
});

/**
 * Get the history files for the given world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   world_name   The name of the world to get for (optional)
 * @param    {Function} callback
 */
App.setMethod(function getWorldHistory(world_name, callback) {

	var that = this,
	    result = [];

	if (typeof world_name == 'function') {
		callback = world_name;
		world_name = null;
	}

	Fn.series(function getWorld(next) {

		if (world_name) {
			return next();
		}

		that.getWorldName(function gotName(err, name) {

			if (name) {
				world_name = name;
				next();
			} else {
				that.getWorlds(function gotWorldNames(err, worlds, world_map) {
					world_name = Object.keys(world_map);
					next();
				});
			}
		});
	}, function getWorlds(next) {

		var tasks = [];

		world_name = Blast.Collection.Array.cast(world_name);

		world_name.forEach(function eachWorld(name) {
			tasks.push(function getWorldHistory(next) {
				var path = libpath.resolve(that.worlds_history_path, name),
				    subtasks = [];

				fs.readdir(path, function gotFiles(err, files) {
					files.forEach(function eachFile(file) {

						// Only load in creatures history files
						if (file.slice(0, 3) != 'cr_') {
							return;
						}

						subtasks.push(function loadFile(next) {

							fs.readFile(libpath.resolve(path, file), function gotFile(err, buffer) {

								var history;

								if (err) {
									// Ignore errors
									return next();
								}

								// Create the new history object
								history = new Blast.Classes.Develry.Creatures.CrHistory(that);

								// Process the buffer
								history.processBuffer(buffer);

								result.push(history);
								next();
							});
						});
					});

					Fn.parallel(subtasks, next);
				});
			});
		});

		Fn.parallel(tasks, next);

	}, function done(err) {

		if (err) {
			return callback(err);
		}

		callback(null, result);
	});
});

/**
 * Get the current world save
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App.setMethod(function getWorld(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	if (!this._sfc_world_cache) {
		this._sfc_world_cache = {};
	}

	this.getWorldName(function gotWorld(err, world_name) {

		var world_path,
		    world_instance;

		if (err) {
			return callback(err);
		}

		if (!that._sfc_world_cache[world_name]) {

			// Resolve the path to the world file
			world_path = libpath.resolve(that.my_documents_path, 'Creatures', 'Creatures 2', world_name + '.sfc');

			// Create the new instance
			that._sfc_world_cache[world_name] = new Blast.Classes.Develry.Creatures.SfcWorld(that, world_path);
		}

		world_instance = that._sfc_world_cache[world_name];

		world_instance.load(function loaded(err) {

			if (err) {
				return callback(err);
			}

			callback(null, world_instance);
		});
	});
});

/**
 * Create a creature instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App.setMethod(function createCreatureInstance() {

	var creature = new Creature(this);

	return creature;
});

/**
 * Get a creature by looking through the loaded creatures first.
 * If they're not there, search through the history files
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.1
 */
App.setMethod(function getCreature(id_or_moniker, callback) {

	var that = this,
	    creature,
	    temp,
	    id;

	this.getCreatures(function gotCreatures(err, creatures) {

		// Try by id first
		creature = that.creatures[id_or_moniker];

		if (!creature) {
			for (id in that.creatures) {
				temp = that.creatures[id];

				if (temp.moniker == id_or_moniker) {
					creature = temp;
					break;
				}
			}
		}

		if (creature) {
			return callback(null, creature);
		}

		// Create a new creature instance if we haven't found anything
		creature = that.createCreatureInstance();

		// Store it under the moniker
		that.creatures[id_or_moniker] = creature;

		creature.loadByMoniker(id_or_moniker, function loaded(err) {

			if (err) {
				return callback(err);
			}

			callback(null, creature);
		});
	});
});

/**
 * Get an egg
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
App.setMethod(function getEgg(id_or_moniker, callback) {

	var that = this,
	    result;

	this.getEggs(function gotEggs(err, eggs) {

		if (err) {
			return callback(err);
		}

		eggs.forEach(function eachEgg(egg) {
			if (egg.id == id_or_moniker || egg.moniker == id_or_moniker) {
				result = egg;
			}
		});

		callback(null, result);
	});
});

/**
 * Send a CAOS command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {String}   str
 * @param    {Function} callback
 */
App.setMethod(function command(str, callback) {
	this.ole.sendCAOS(str, callback);
});

/**
 * Set the speed of the game
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Number}   acceleration
 * @param    {Function} callback
 */
App.setMethod(function setSpeed(acceleration, callback) {
	this.ole.sendJSON({
		type         : 'setspeed',
		acceleration : acceleration,
		sleeptime    : 5
	}, callback);
});

/**
 * Get the coordinates of the hand
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function getHandPosition(callback) {
	this.command('targ pntr,dde: putv post,dde: putv posr,dde: putv posb,dde: putv posl', function gotResponse(err, response) {

		var pieces,
		    result;

		if (err) {
			return callback(err);
		}

		pieces = response.split('|');

		result = {
			top    : Number(pieces[0]),
			right  : Number(pieces[1]),
			bottom : Number(pieces[2]),
			left   : Number(pieces[3])
		};

		callback(null, result);
	});
});

/**
 * Unselect creature
 * This will, unfortunately, set the window title only to "Creatures 2"
 * It won't include the world name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function unselect(callback) {
	this.command('setv norn 0', callback);
});

/**
 * Take a picture of the currently selected creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Integer}  width
 * @param    {Integer}  height
 * @param    {Function} callback
 */
App.setMethod(function createPicture(width, height, callback) {

	var cmd;

	// C1 compatible, will always create "temp.spr" or "temp.s16" file
	cmd = 'dde: pict ' + String.fromCharCode(width) + '|' + String.fromCharCode(height);

	// C2 alternative
	//inst,dde: pic2 50 50 [temp.s16],endm

	// Create a picture and get the filename, which is always temp.s16
	this.command(cmd, function gotResponse(err, filename) {

		if (err) {
			return callback(err);
		}

		if (filename.indexOf('000') == 0) {
			return callback(new Error('No creature seems to be selected'));
		}

		callback(null, filename);
	});
});

/**
 * Format hexadecimal moniker
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   hex_moniker
 */
App.setMethod(function formatMoniker(hex_moniker) {

	var result = '',
	    i;

	if (Buffer.isBuffer(hex_moniker)) {
		hex_moniker = hex_moniker.toString('hex');
	} else if (typeof hex_moniker == 'number') {
		hex_moniker = hex_moniker.toString(16);
	}

	// Normalize the moniker
	for (i = 0; i < 4; i++) {
		result = result + String.fromCharCode(parseInt(hex_moniker.substr(i * 2, 2), 16));
	}

	return result;
});

/**
 * Get all the in-world creature ids
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {String}   str
 * @param    {Function} callback
 */
App.setMethod(function getCreatureIds(callback) {

	var that = this;

	this.ole.sendCAOS('inst,enum 4 0 0,dde: putv targ,next,endm', function gotResponse(err, response) {

		var pieces;

		if (err) {
			return callback(err);
		}

		pieces = response.split('|');

		callback(null, pieces);
	});
});

/**
 * Load an export file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String|Buffer|Export}  filepath
 * @param    {Function}              callback
 */
App.setMethod(function loadExport(filepath, callback) {

	var that = this,
	    creature_exp = new Export(this, filepath);

	// Load the file and callback with the instance
	creature_exp.load(function loaded(err) {

		if (err) {
			return callback(err);
		}

		callback(null, creature_exp);
	});

	return creature_exp;
});

/**
 * Unpause the game if needed and restore state afterwards
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function}  task
 * @param    {Function}  callback
 */
App.setMethod(function doUnpaused(task, callback) {

	var that = this,
	    was_paused = this.paused,
	    task_response;

	Fn.series(function resumeGame(next) {
		that.play(function gotResponse(err) {
			// Ignore errors?
			next();
		});
	}, function doTask(next) {
		task.call(that, function finishedTask(err, response) {

			if (err) {
				return next(err);
			}

			task_response = response;
			next();
		});
	}, function done(err) {
		if (was_paused === true) {
			// Pause the game again
			that.pause(function madePaused(paused_err) {
				// Ignore errors?
				callback(err, task_response);
			});
		} else {
			callback(err, task_response);
		}
	});
});

/**
 * Import a creature, even if it's already in the world
 * (If it is, it gets a new moniker)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String|Buffer|Export}  filepath
 * @param    {Function}              callback
 */
App.setMethod(function importCreature(filepath, callback) {

	var that = this,
	    previous_state = this.paused,
	    copied_path,
	    buffer;

	if (!callback) {
		callback = Function.thrower;
	}

	if (typeof filepath == 'object') {
		if (Buffer.isBuffer(filepath)) {
			buffer = filepath;
		} else {
			buffer = filepath.buffer;
		}

		if (!buffer) {
			return Blast.setImmediate(function noBuffer() {
				callback(new Error('Invalid buffer'));
			});
		}
	}

	Fn.series(function resumeGame(next) {
		that.play(function gotResponse(err) {
			// Ignore errors?
			next();
		});
	}, function doesFileExist(next) {

		if (buffer) {
			return next();
		}

		fs.stat(filepath, function gotStat(err, stat) {

			if (err) {
				return next(err);
			}

			if (!stat.isFile()) {
				return callback(new Error('Given path is not a file'));
			}

			next();
		});
	}, function copyFile(next) {
		// Create a temporary file with a .exp extension
		that.getTemporaryFile({postfix: '.exp'}, function gotTempFile(err, path, fd) {

			if (err) {
				return next(err);
			}

			copied_path = path;

			if (buffer) {
				fs.writeFile(path, buffer, next);
			} else {
				// Actually copy the original file to the temporary one
				that.copyFile(filepath, copied_path, next);
			}
		});
	}, function doImport(next) {

		// Escape special characters in the path
		var escaped_path = that.ole.escapeKeys(copied_path);

		// Send the import commands
		that.ole.sendJSON([
			{type: 'c2window'},
			{type: 'sleep',  command: 50},
			{type: 'keys',   command: '%FI'},
			{type: 'sleep',  command: 100},
			{type: 'window', command: 'Import Creature'},
			{type: 'keys',   command: escaped_path + '{ENTER}'},
			{type: 'sleep',  command: 500}
		], next);

	}, function done(err) {

		if (err) {
			return restoreState(err);
		}

		that.emit('imported_creature', filepath);
		restoreState(null);
	});

	// Function to restate paused state
	function restoreState(top_err) {
		if (previous_state === true) {
			that.pause(function madePaused(err) {
				// Ignore errors?
				callback(top_err);
			});
		} else {
			callback(top_err);
		}
	}
});

/**
 * Get all the creatures in the currently loaded world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Boolean}  update    Update the creatures? [true]
 * @param    {Function} callback
 */
App.setMethod(function getCreatures(update, callback) {

	var that = this,
	    tasks = [];

	if (typeof update == 'function') {
		callback = update;
		update = null;
	}

	if (update == null) {
		update = true;
	}

	this.getCreatureIds(function gotIds(err, ids) {

		if (err) {
			return callback(err);
		}

		// Iterate over all the in-world ids
		ids.forEach(function eachId(id) {

			var creature;

			// Skip if the creature already exists
			if (!that.creatures[id]) {
				that.creatures[id] = new Creature(that);
				that.creatures[id].id = id;
			}

			// Get a reference to the creature object
			creature = that.creatures[id];

			// If update is false we can return early
			if (!update) {
				return;
			}

			// Add a new task
			tasks.push(function updateCreature(next) {
				creature.update(function done(err) {

					if (err) {
						return next(err);
					}

					next(null, creature);
				});
			});
		});

		Fn.parallel(tasks, function doneTasks(err, result) {

			if (err) {
				return callback(err);
			}

			callback(null, result);
		});
	});
});

/**
 * Get all the eggs
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
App.setMethod(function getEggs(callback) {

	var that = this,
	    result = [];

	// Get all the egg ids
	this.command('dde: putv targ,enum 2 5 2,dde: putv targ,next', function gotEggs(err, response) {

		var egg_targs,
		    tasks = [],
		    stat;

		if (err) {
			return callback(err);
		}

		// Get the first 4 characters of the response
		stat = response.slice(0, 4);

		if (stat == 'enum') {
			return callback(new Error('Failed to get eggs: got enum'));
		} else if (stat == 'erro') {
			return callback(new Error('Failed to get eggs: got ' + stat));
		}

		// Get all the egg targs ids
		egg_targs = response.split('|');

		// Iterate over all the egg ids
		egg_targs.forEach(function eachEgg(egg_targ) {

			if (egg_targ == 0) {
				return;
			}

			tasks.push(function getEgg(next) {

				var egg = that.eggs[egg_targ];

				// Egg is falsy, probably one of those zero-byte moniker eggs
				if (egg === false) {
					return next();
				}

				if (!egg) {
					egg = new Egg(that, egg_targ);
				}

				// Remember this egg
				that.eggs[egg_targ] = egg;

				egg.update(function updatedEgg(err) {

					if (err) {
						return next(err);
					}

					if (!egg.moniker) {
						that.eggs[egg_targ] = false;
						return next();
					}

					// Make sure it really is an egg
					result.push(egg);

					return next();
				});
			});
		});

		// Update all the found eggs
		Fn.parallel(tasks, function done(err) {

			// Iterate over all the previously found eggs
			Obj.each(that.eggs, function eachEgg(egg, key) {

				if (!egg) {
					return;
				}

				// The egg has dissappeared?
				if (result.indexOf(egg) == -1) {
					// Remove the egg from the egg cache
					delete that.eggs[egg.id];

					// And "solve" the disappearance (events)
					egg.solveDisappearance();
				}
			});

			callback(err, result);
		});
	});
});

/**
 * Get the state of the game
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
App.setMethod(function getIsPlaying(callback) {
	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Actually get the "paused" status
	this.command('inst,dde: putv paus,endm', function gotResponse(err, result) {

		if (err) {
			return callback(err);
		}

		if (result == 0) {
			that.paused = false;
		} else {
			that.paused = true;
		}

		callback(null, that.paused);
	});
});

/**
 * Resume the game by pushing on the "Play" button
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
App.setMethod(['resume', 'play'], function resume(callback) {

	var that = this,
	    previous = this.paused;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Indicate nothing is paused
	this.paused = false;

	// Send the play commands
	this.ole.sendJSON({type: 'play'}, function gotResponse(err, result) {

		if (err) {
			that.paused = previous;
			return callback(err);
		}

		callback(null);
	});
});

/**
 * Pause the game by pushing on the "Pause" button
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
App.setMethod(function pause(callback) {

	var that = this,
	    previous = this.paused;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Indicate nothing is paused
	this.paused = true;

	// Send the pause commands
	this.ole.sendJSON({type: 'pause'}, function gotResponse(err) {

		if (err) {
			that.paused = previous;
			return callback(err);
		}

		callback(null);
	});
});

module.exports = App;