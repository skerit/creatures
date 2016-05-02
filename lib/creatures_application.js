var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    CrHistory = require('./cr_history.js'),
    Creature = require('./creature.js'),
    libpath = require('path'),
    SfcOle = require('./sfc_ole.js'),
    Egg = require('./egg.js'),
    Fn = Blast.Collection.Function,
    os = require('os'),
    fs = require('fs'),
    App;

/**
 * The Creatures Application class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
App = Fn.inherits('Informer', 'Develry.Creatures', function CreaturesApplication() {

	// Create a connection object
	this.ole = new SfcOle();

	// Creature objects
	this.creatures = {};

	// Egg objects
	this.eggs = {};

	// For now, only c2 is supported
	this.is_c1 = false;
});

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

	console.log('GET WORLD NAME!')

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
				console.log('Name:', name)
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
 * @version  0.1.0
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

		creature.loadByMoniker(id_or_moniker, function loaded(err) {

			if (err) {
				return callback(err);
			}

			callback(null, creature);
		});
	});
});

/**
 * Send a command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   str
 * @param    {Function} callback
 */
App.setMethod(function command(str, callback) {
	this.ole.firecommand(str, callback);
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
 * @version  0.1.0
 *
 * @param    {String}   str
 * @param    {Function} callback
 */
App.setMethod(function getCreatureIds(callback) {

	var that = this;

	this.ole.firecommand('inst,enum 4 0 0,dde: putv targ,next,endm', function gotResponse(err, response) {

		var pieces;

		if (err) {
			return callback(err);
		}

		pieces = response.split('|');

		callback(null, pieces);
	});
});

/**
 * Get all the creatures
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function getCreatures(callback) {

	var that = this,
	    tasks = [];

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
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
App.setMethod(function getEggs(callback) {

	var that = this,
	    result = [];

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
			return callback(new Error('Got enum?'));
		} else if (stat == 'erro') {
			return callback(new Error('Got ' + stat));
		}

		// Get all the egg targs ids
		egg_targs = response.split('|');

		egg_targs.forEach(function eachEgg(egg_targ) {
			tasks.push(function getEgg(next) {

				var egg = that.eggs[egg_targ] || new Egg(that, egg_targ);

				egg.update(function updatedEgg(err) {

					if (err) {
						return next(err);
					}

					// Make sure it really is an egg
					if (!egg.not_an_egg) {
						result.push(egg);
					}

					return next();
				});
			});


			return;

			
		});

		Fn.parallel(tasks, function done(err) {

			console.log('Got egg data:', err, result);

			callback(err, result);
		});
	});
});

module.exports = App;