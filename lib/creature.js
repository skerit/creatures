'use strict';

var libpath = require('path'),
    Blast = __Protoblast,
    cid = 0,
    Fn = Blast.Collection.Function,
    fs = require('graceful-fs');

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Small Furry Creatures Ole connection class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.6
 *
 * @param    {CreaturesApplication}   app
 */
var Creature = Fn.inherits('Develry.Creatures.Base', function Creature(app) {

	// A library specific counter
	this.counter = cid++;

	// The application
	this.app = app;

	// The moniker, this will only need to be fetched once
	this._moniker = null;
	this.hex_moniker = null;

	// Values that need to be updated
	this.name = '';

	// The age in minutes
	this.age = 0;

	// The lifestage number
	this.agen = 0;

	// Creature info that can be stored in-game
	this.note_vars = {};
});

/**
 * The lifestages of a creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @type     {Array}
 */
Creature.setStatic('lifestages', [
	'Baby',
	'Child',
	'Adolescent',
	'Youth',
	'Adult',
	'Elderly',
	'Senile',
	'Dead'
]);

/**
 * The drives of a creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type     {Array}
 */
Creature.setStatic('drives', [
	'Pain',
	'Need for pleasure',
	'Hunger',
	'Coldness',
	'Hotness',
	'Tiredness',
	'Sleepiness',
	'Loneliness',
	'Overcrowdedness',
	'Fear',
	'Boredom',
	'Anger',
	'Sexdrive',
	'Injury',
	'Suffocation',
	'Thirst',
	'Stress'
]);

/**
 * The moniker
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.6
 *
 * @type   {String}
 */
Creature.setProperty(function moniker() {
	return this._moniker;
}, function setMoniker(moniker) {

	this._moniker = moniker;

	if (moniker) {
		this.emitOnce('got_moniker', moniker);

		// Autoregister this creature by their moniker
		this.app.creatures[moniker] = this;
	}

	return moniker;
});

/**
 * The id of the creature in the world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @type   {Number}
 */
Creature.setProperty(function id() {
	return this._id;
}, function setId(id) {

	// Remember the id
	this._id = id;

	// Autoregister this creature by their id
	if (id) {
		this.app.creatures_by_id[id] = this;
	} else {
		this.log('warning', 'Setting falsy id', id, 'on creature', this.moniker);
	}

	return id;
});

/**
 * The formated age
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type   {String}
 */
Creature.setProperty(function formated_age() {

	var minutes,
	    result,
	    hours;

	hours = ~~(this.age / 60);
	minutes = this.age % 60;

	if (hours) {
		result = hours + 'h ';
	} else {
		result = '';
	}

	result += minutes + 'm';

	return result;
});

/**
 * Age in hhmm format
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type   {String}
 */
Creature.setProperty(function age_for_filename() {

	var minutes,
	    result,
	    hours;

	hours   = Blast.Bound.Number.toPaddedString(~~(this.age / 60), 2);
	minutes = Blast.Bound.Number.toPaddedString(this.age % 60, 2);

	return String(hours) + String(minutes);
});

/**
 * The lifestage string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type   {String}
 */
Creature.setProperty(function lifestage() {
	return Creature.lifestages[this.agen];
});

/**
 * The most pressing drive name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type     {String}
 */
Creature.setProperty(function drive() {
	return Creature.drives[this.drive_nr];
});

/**
 * Is this norn unnamed?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.2.2
 *
 * @type     {Boolean}
 */
Creature.setProperty(function is_unnamed() {

	// If there is no name it is obviously unnamed
	if (!this.name) {
		return true;
	}

	// If the name starts with a lower-than sign,
	// assume it's unnamed
	if (this.name[0] == '<') {
		return true;
	}

	// We don't allow using the moniker or hex_moniker as a name
	if (this.name == this.moniker || this.name == this.hex_moniker) {
		return true;
	}

	return false;
});

/**
 * Does this creature have a name?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type     {Boolean}
 */
Creature.setProperty(function has_name() {
	return !this.is_unnamed;
});

/**
 * Is the creature in the current world?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type   {Boolean}
 */
Creature.setProperty(function is_in_world() {
	return this.id != null;
});

/**
 * Get the gender of the norn as text
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {String}   cmd
 * @param    {Function} callback
 */
Creature.setProperty(function gender() {
	if (this.male) {
		return 'male';
	} else {
		return 'female';
	}
});

/**
 * Perform a creature-specific command
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.1
 *
 * @param    {String|Array}   cmds
 * @param    {Function}       callback
 */
Creature.setMethod(function command(cmds, callback) {

	var cmd,
	    i;

	if (!this.id) {
		this.log('error', 'Unable to perform command on creature without id', cmds);
		return callback(new Error('This creature has no valid id'));
	}

	if (!cmds) {
		return callback(new Error('No valid command is given'));
	}

	if (!Array.isArray(cmds)) {
		cmds = [cmds];
	}

	cmd = '';

	for (i = 0; i < cmds.length; i++) {
		if (cmd) {
			cmd += ',';
		}

		cmd += "targ " + this.id + "," + cmds[i];
	}

	cmd = 'inst,' + cmd;

	this.app.command(cmd, callback);
});

/**
 * Focus on this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function focus(callback) {
	this.app.command('inst,setv norn ' + this.id + ',endm', callback);
});

/**
 * Pickup this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function pickup(callback) {
	return this.command('edit', callback);
});

/**
 * Make this creature know all the vocabulary words.
 * It'll forget it's own name though,
 * but this is easily fixed by calling `setName` again
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @param    {Function} callback
 */
Creature.setMethod(function teachLanguage(callback) {
	// command 32777 is what the "Stone of Ancient Knowledge" also uses
	return this.app.command('inst,setv norn ' + this.id + ',sys: cmnd 32777,endm', callback);
});

/**
 * Get the current creature's interpretation of the given word index
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {Number}   index
 * @param    {Function} callback
 */
Creature.setMethod(function getWord(index, callback) {
	this.command('dde: word ' + index, callback);
});

/**
 * Select this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.2
 * @version  0.2.2
 *
 * @param    {Function} callback
 */
Creature.setMethod(function select(callback) {

	if (!this.id) {
		return Blast.nextTick(callback, null, new Error('Can not select a creature without knowing its ID'));
	}

	this.app.command('setv norn ' + this.id, callback);
});

/**
 * Get this creature's moniker, fetching it from the application if needed
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.2
 * @version  0.2.2
 *
 * @param    {Boolean}  force
 * @param    {Function} callback
 */
Creature.setMethod(function getMoniker(force, callback) {

	var that = this;

	if (typeof force == 'function') {
		callback = force;
		force = false;
	}

	if (!force) {

		// If we already have a moniker, callback with it
		if (this.moniker) {
			return Blast.nextTick(callback, null, this.moniker);
		}

		// If we don't, but we are getting it soon, wait for it
		if (this.hasBeenSeen('updating') && !this.hasBeenSeen('updated')) {
			return this.once('got_moniker', function gotMoniker(moniker) {
				return callback(null, moniker);
			});
		}
	}

	// Else get it from the application
	this.command('dde: getb monk', function gotHexMoniker(err, response) {

		if (err) {
			return callback(err);
		}

		that.hex_moniker = response;

		// The formated moniker, needs to be reversed for some reason
		that.moniker = that.app.formatMoniker(response).split('').reverse().join('').trim();

		callback(null, that.moniker);
	});
});

/**
 * Set the creatures name
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.2.0
 *
 * @param    {String}   name
 * @param    {Function} callback
 */
Creature.setMethod(function setName(name, callback) {

	var that = this,
	    cmd;

	if (!callback) {
		callback = Function.thrower;
	}

	if (!name) {
		return callback(new Error('No name was provided'));
	}

	if (name.indexOf('[') > -1 || name.indexOf(']') > -1) {
		return callback(new Error('Please provide a valid name'));
	}

	cmd = 'dde: putb [' + name + '] cnam';

	// Already change the name
	this.name = name;

	this.command(cmd, function done(err, result) {

		if (err) {
			return callback(err);
		}

		that.update(function done(err) {

			if (err) {
				return callback(err);
			}

			if (that.name != name) {
				return callback(new Error('Unable to set name "' + name + '"'));
			}

			callback(null);
		});
	});
});

/**
 * Move creature to specified coordinates
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.4
 *
 * @param    {Number}   x
 * @param    {Number}   y
 * @param    {Function} callback
 */
Creature.setMethod(function move(x, y, callback) {
	return this.command('mcrt ' + x + ' ' + y, callback);
});

/**
 * Load by moniker
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {String}   moniker
 * @param    {Function} callback
 */
Creature.setMethod(function loadByMoniker(moniker, callback) {

	moniker = moniker.trim();

	if (!moniker) {
		return callback(new Error('Empty moniker given'));
	}

	if (moniker.charCodeAt(0) == 0) {
		return callback(new Error('Moniker string cannot contain null bytes'));
	}

	this.moniker = moniker;
	this.loadHistoryFiles(callback);
});

/**
 * Load gene file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.6
 *
 * @param    {Function} callback
 */
Creature.setCacheMethod(function loadGeneFile(callback) {

	var that = this;

	if (!this.moniker) {
		return callback(new Error('Moniker has not been set, can not load gene file'));
	}

	this.log('debug', 'Loading gene for', this.moniker);

	// Get all worlds, but we only need the history_map location
	this.app.getWorlds(function gotWorlds(err, worlds, history_maps) {

		var history_path,
		    gene_path,
		    gene_map;

		history_path = Blast.Bound.Object.first(history_maps);

		// If this is for World.sfc, the history folder itself contains the data,
		// so in order to get the Genetics folder we only need to go up 1 folder
		if (Blast.Bound.String.endsWith(history_path, '\\History')) {
			gene_map = libpath.resolve(history_path, '..', 'Genetics');
		} else {
			gene_map = libpath.resolve(history_path, '..', '..', 'Genetics');
		}

		gene_path = libpath.resolve(gene_map, that.moniker + '.gen');

		// Create the gene instance
		that.gene = new Blast.Classes.Develry.Creatures.Genome(that.app, gene_path);

		// And load it
		that.gene.load(function loadedGene(err) {

			if (err) {
				// Failed to load the file! Let's check the application's genetics folder
				that.app.getProcessPath(function gotPath(_err, process_path) {

					if (_err) {
						return callback(_err);
					}

					gene_path = libpath.resolve(that.app.process_dir, 'Genetics', that.moniker + '.gen');
					that.gene.path = gene_path;

					that.gene.load(function loadedGeneAgain(err) {
						if (err) {
							return callback(err);
						}

						callback(null);
					});
				});

				return;
			}

			if (err) {
				return callback(err);
			}

			callback(null);
		});
	});
});

/**
 * Load history files
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.6
 *
 * @param    {Function} callback
 */
Creature.setCacheMethod(function loadHistoryFiles(callback) {

	var that = this,
	    tasks = [],
	    cr_file,
	    histories = {},
	    path_map = {};

	if (!callback) {
		throw new Error('Creature#loadHistoryFiles method requires a callback');
	}

	// We need a moniker, so make sure we get it
	if (!this.moniker) {
		return this.getMoniker(function gotMoniker(err) {

			if (err) {
				return callback(err);
			}

			loadHistoryFiles.call(that, callback);
		});
	}

	this._loading_history_files = true;

	cr_file = 'cr_' + this.moniker;

	this.app.getWorlds(function gotWorlds(err, worlds, history_maps) {

		if (err) {
			return callback(err);
		}

		Blast.Collection.Object.each(history_maps, function eachWorld(path, name) {
			tasks.push(function getHistory(next) {

				var history_path = libpath.resolve(path, cr_file);

				that.readFile(history_path, function gotFile(err, data) {

					if (!err) {
						histories[name] = data;
						path_map[name] = history_path;
					}

					return next();
				});
			});
		});

		tasks.push(function getGene(next) {
			that.loadGeneFile(next);
		});

		if (that.is_in_world) {
			tasks.push(function loadVars(next) {
				that.loadNoteVars(next);
			});
		}

		Fn.parallel(tasks, function done(err) {

			var buffer,
			    hist,
			    name;

			if (err) {
				return callback(err);
			}

			// Set the histories object
			that.histories = {};

			for (name in histories) {
				buffer = histories[name];

				// Create the new history object
				hist = new Blast.Classes.Develry.Creatures.CrHistory(that.app, path_map[name]);

				// Add this creature
				hist.creature = that;

				// Process the buffer
				hist.processBuffer(buffer);

				that.histories[name] = hist;
			}

			that.emitOnce('ready');

			callback(null, that.histories);
		});
	});
});

/**
 * Register a history file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {CrHistory}   history
 */
Creature.setMethod(function registerHistory(history) {
	if (!this.histories[history.world_name]) {
		this.histories[history.world_name] = history;
	}
});

/**
 * Load the appropriate history file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {Function} callback
 */
Creature.setCacheMethod(function loadHistory(callback) {

	var that = this,
	    world_name,
	    histories;

	if (!callback) {
		callback = Function.thrower;
	}

	Fn.parallel(function getWorldName(next) {
		that.app.getWorldName(function gotName(err, name) {

			if (err) {
				return next(err);
			}

			world_name = name;
			next();
		});
	}, function loadHistoryFiles(next) {
		that.loadHistoryFiles(function gotHistoryFiles(err, result) {

			if (err) {
				return next(err);
			}

			histories = result;
			next();
		});
	}, function done(err) {

		var history;

		if (err) {
			return callback(err);
		}

		history = histories[world_name];

		if (!history) {
			history = Blast.Bound.Object.first(histories);
		}

		that.emit('history', history);

		return callback(null, history);
	});
});

/**
 * Get all the worlds this creature is in
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.2
 *
 * @param    {Function} callback
 */
Creature.setMethod(function getWorldNames(callback) {

	var that = this,
	    worlds;

	this.loadHistoryFiles(function gotHistory(err, map) {

		if (err) {
			return callback(err);
		}

		if (map) {
			worlds = Object.keys(map);
		} else {
			worlds = [];
		}

		return callback(null, worlds);
	});
});

/**
 * Get this creature's parent
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.6
 *
 * @param    {String}   type        mother or father
 * @param    {Function} callback
 */
Creature.setMethod(function getParent(type, callback) {

	var that = this,
	    prop = '_parent_' + type;

	if (this.hasBeenSeen('getting_' + type)) {

		this.log('debug', 'Getting', type, 'of', this.moniker, 'from cache');

		// The event name might start with "got_", it is also fired
		// when the parent is unable to be found
		return this.afterOnce('got_' + type, function gotParent() {
			callback(null, that[prop]);
		});
	}

	this.log('debug', 'Getting', type, 'of', this.moniker, 'for first time');

	this.emit('getting_' + type);

	function done(err, result) {

		if (err) {
			that.log('error', 'Error finding', type, 'of', that.moniker, err);
		} else if (result) {
			that.log('debug', 'Found', type, 'of', that.moniker, ':', result.moniker);
		} else {
			that.log('debug', 'Did not find', type, 'of', that.moniker);
		}

		if (err) {
			callback(err);
		} else {
			that[prop] = result;
			callback(null, result);
		}

		that.emit('got_' + type);
	};

	// Get the history file
	this.loadHistory(function gotHistory(err, history) {

		var moniker;

		if (err) {
			return done(err);
		}

		if (!history) {
			return done(new Error('History not found'));
		}

		moniker = history[type + '_moniker'];

		if (!moniker || moniker.charCodeAt(0) == 0) {
			return done();
		}

		if (moniker == 'test') {
			return done();
		}

		that.app.getCreature(false, moniker, function gotParent(err, parent) {

			if (err) {
				that.log('error', 'Unable to get parent creature (' + type + ') with moniker "' + moniker + '"', err);
				return done();
			}

			if (!parent.id) {
				return parent.updateByHistory(function updateddone(err) {

					if (err) {
						return done(err);
					}

					that[prop] = parent;

					done(null, parent);
				});
			}

			that[prop] = parent;

			done(null, parent);
		});
	});
});

/**
 * Get this creature's mother
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function getMother(callback) {
	this.getParent('mother', callback);
});

/**
 * Get this creature's father
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function getFather(callback) {
	this.getParent('father', callback);
});

/**
 * Get this creature's children
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function getChildren(callback) {

	var that = this;

	this.app.getWorldHistory(function gotHistoryFiles(err, histories) {

		var result_histories,
		    history,
		    result,
		    tasks,
		    seen,
		    i;

		if (err) {
			return callback(err);
		}

		result_histories = [];
		result = [];
		seen = [];

		for (i = 0; i < histories.length; i++) {
			history = histories[i];

			if (history.mother_moniker == that.moniker || history.father_moniker == that.moniker) {

				// If this moniker has already been seen, skip it
				if (seen.indexOf(history.moniker) > -1) {
					continue;
				}

				result_histories.push(history);

				// Add this moniker to the seen array
				seen.push(history.moniker);
			}
		}

		tasks = [];

		result_histories.forEach(function eachHistory(history) {
			tasks.push(function getCreature(next) {
				history.loadCreature(function gotCreature(err, creature) {

					if (err) {
						return next(err);
					}

					result.push(creature);
					next();
				});
			});
		});

		Fn.parallel(tasks, function done(err) {

			if (err) {
				return callback(err);
			}

			callback(null, result);
		});
	});
});

/**
 * Load creature information based on id
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.6
 *
 * @param    {String}   id
 * @param    {Function} callback
 */
Creature.setMethod(function loadById(id, callback) {

	if (!id) {
		return Blast.nextTick(callback, null, new Error('Can not load a creature by an empty id'));
	}

	this.id = id;

	this.update(callback);
});

/**
 * Update this creature's data from the running game
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.4
 *
 * @param    {Function}   callback
 */
Creature.setMethod(function update(callback) {

	var that = this;

	callback = Fn.regulate(callback);

	this.emit('updating');

	var bomb = Fn.timebomb(10000, function onTimeout() {
		callback(new Error('Creature update timeout: ' + that.moniker));
	});

	Fn.parallel(function getName(next) {
		that.command('dde: getb cnam', function gotName(err, response) {

			if (err) {
				return next(err);
			}

			that.name = response;

			next();
		});
	}, function getMoniker(next) {

		// Skip if the moniker is already present
		if (that.moniker) {
			return next();
		}

		that.command('dde: getb monk', function gotMoniker(err, response) {

			if (err) {
				return next(err);
			}

			// Store the hexadecimal version of the moniker
			that.hex_moniker = response;

			// The formated moniker, needs to be reversed for some reason
			that.moniker = that.app.formatMoniker(response).split('').reverse().join('').trim();

			next();
		});
	}, function getVitals(next) {

		var health_chemical,
		    cmd;

		if (that.app.is_c1) {
			health_chemical = 59;
		} else {
			health_chemical = 72;
		}

		cmd = [
			// Age in minutes
			'dde: putv camn',

			// Health chemical
			'dde: putv chem ' + health_chemical,

			// Dead or alive
			'dde: putv dead',

			// "Species" is actually the gender of a creature
			'dde: putv spcs',

			// Creature lifestage
			'dde: putv cage',

			// The race of the creature
			'dde: putv gnus',

			// The most pressing drive
			'dde: putv drv!',

			// Is it unconscious?
			'dde: putv uncs',

			// Moniker of the baby, if it's pregnant
			'dde: putv baby',

			// Is it asleep?
			'dde: putv aslp',

			// X position
			'dde: putv posx',

			// Y position
			'dde: putv posy',

			// The type of room the creature is in
			'dde: putv rtyp'
		].join(',');

		that.command(cmd, function gotVitals(err, response) {

			var pieces;

			if (err) {
				return next(err);
			}

			if (response == null) {
				return next(new Error('Unable to get vitals: response was undefined'));
			}

			pieces = response.split('|');

			// Get the pieces and cast them to the correct type
			that.age = Number(pieces[0]);

			// The current health of the creature
			that.health = Number(pieces[1]);

			// Is this creature dead?
			that.dead = Boolean(Number(pieces[2]));

			// The sex of the creature
			// 0 is unkown, 1 is male, 2 is female
			that.sex = Number(pieces[3]);

			// Gender properties
			that.male = that.sex == 1;
			that.female = that.sex == 2;

			// The lifestage of the creature
			that.agen = Number(pieces[4]);

			// The race of the creature
			that.race = pieces[5];

			// The most pressing drive
			that.drive_nr = pieces[6];

			// Is it unconscious?
			that.unconscious = Boolean(Number(pieces[7]));

			// If pregnant, the child moniker
			if (pieces[8] && pieces[8] == '0') {
				that.pregnant = '';
			} else {
				that.pregnant = pieces[8];
			}

			// Is the creature asleep?
			that.asleep = Boolean(Number(pieces[9]));

			// The current X position
			that.x = Number(pieces[10]);

			// The current Y position
			that.y = Number(pieces[11]);

			// The current room type
			that.room_type = Number(pieces[12]);

			next();
		});
	}, function done(err) {

		bomb.defuse();

		if (err) {
			return callback(err);
		}

		callback(null);
		that.emit('updated');
	});
});

/**
 * Get the generation of this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.2.6
 *
 * @param    {Function}   callback
 */
Creature.setMethod(function getGeneration(callback) {

	var that = this,
	    gen = -1;

	if (this.generation != null) {
		return callback(null, this.generation);
	}

	if (!this.hasBeenSeen('ready')) {

		this.loadHistoryFiles();

		return this.once('ready', function afterReady() {
			that.getGeneration(callback);
		});
	}

	if (this.hasBeenSeen('getting_generation')) {
		return this.once('got_generation', function gotGeneration() {
			callback(null, that.generation);
		});
	}

	if (this.note_vars && this.note_vars.generation) {
		this.generation = Number(this.note_vars.generation);

		if (!isNaN(this.generation)) {
			callback(null, this.generation);
			this.emit('got_generation', gen);
			return;
		}
	}

	this.emit('getting_generation');

	Fn.series(function getFather(next) {
		that.getFather(function gotFather(err, father) {

			if (err) {
				that.log('warning', 'Unable to get father of', that.moniker);
				return next();
			}

			if (!father) {
				return next();
			}

			if (father.id == null && !father.name) {
				return next();
			}

			father.getGeneration(next);
		});
	}, function getMother(next) {
		that.getMother(function gotMother(err, mother) {

			if (err) {
				that.log('warning', 'Unable to get mother of', that.moniker);
				return next();
			}

			if (!mother) {
				return next();
			}

			if (mother.id == null && !mother.name) {
				return next();
			}

			mother.getGeneration(next);
		});
	}, function gotParents(err, result) {

		var max_gen,
		    char;

		if (err) {
			that.log('error', 'Failed to get generation:', err);
			return callback(err);
		}

		max_gen = Math.max(result[0] == null ? -1 : result[0], result[1] == null ? -1 : result[1]);

		// No generation found, use name
		if (max_gen == -1) {
			if (that.name) {
				char = that.name[0].toLowerCase().charCodeAt(0) - 97;

				that.log('warning', 'Getting generation of', that.moniker, 'based on name', that.name, '=', char);

				if (char > -1) {
					max_gen = char;
				} else {
					max_gen = 0;
				}
			} else {
				// Nothing
				max_gen = 0;
			}
		} else {
			max_gen++;
		}

		gen = max_gen;
		that.generation = gen;

		// Store the generation info in the creature
		that.setVar('generation', gen);

		callback(null, gen);

		that.emit('got_generation', gen);
	});
});

/**
 * Update creature information by its history
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {CrHistory}   history
 * @param    {Function}    callback
 */
Creature.setMethod(function updateByHistory(history, callback) {

	var that = this;

	if (typeof history == 'function') {
		callback = history;
		history = null;
	}

	Fn.series(function getHistory(next) {

		if (history) {
			return next();
		}

		that.loadHistory(function gotHistory(err, loaded_history) {
			history = loaded_history;
			next(err);
		});
	}, function done(err) {

		if (err) {
			return callback(err);
		}

		if (!history) {
			return callback(new Error('Unable to get history for ' + that.moniker));
		}

		if (!that.name) {
			that.name = history.name;
		}

		callback();
	});
});

/**
 * Export a creature to the given path
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.6
 *
 * @param    {String}      filepath
 * @param    {Function}    callback
 */
Creature.setMethod(function exportTo(filepath, callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	if (!this.id) {
		return callback(new Error('Can not export a creature that has no in-world id'));
	}

	Fn.series(function doUpdate(next) {
		that.update(function done(err) {

			if (err) {
				that.log('warn', 'Failed to update creature before export:', err);
			}

			next();
		});
	}, function doExport(next) {

		// Unpause if needed (restores paused state)
		that.app.doUnpaused(function doExport(next) {
			that.app.ole.sendJSON([
				{type: 'caos',   command: 'inst,setv norn ' + that.id + ',endm'},
				{type: 'c2window'},
				{type: 'sleep',  command: 50},
				{type: 'keys',   command: '%' + that.app.menuKey('file') + '{DOWN}' + that.app.menuKey('export')},
				{type: 'sleep',  command: 50},
				{type: 'window', command: that.app.menuKey('export_title'), retries: 10},
				{type: 'keys',   command: filepath + '{ENTER}'}
			], function gotResult(err, results) {

				if (err) {
					return next(err);
				}

				setTimeout(function wait() {
					that.emit('exported', filepath);
					that.emit('removed', 'exported');
					that.app.emit('exported_creature', that, filepath);

					next(null, results);
				}, 500);
			});
		}, next);
	}, function done(err) {

		if (err) {
			return callback(err);
		}

		callback(null, filepath);
	});
});

/**
 * Inseminate this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Creature} donor
 * @param    {Function} callback
 */
Creature.setMethod(function inseminate(donor, callback) {

	if (this.male) {
		return Blast.nextTick(callback, null, new Error('Can not inseminate a male creature'));
	}

	if (this.pregnant) {
		return Blast.nextTick(callback, null, new Error('This creature is already pregnant'));
	}

	let that = this,
	    moniker = null;

	if (typeof donor == 'string') {
		moniker = donor;
	} else {
		moniker = donor.moniker;
	}

	let cmds = [
		'new: gene tokn ' + this.moniker + ' tokn ' + moniker + ' var1',
		'setv baby var1,sys: camt'
	];

	this.command(cmds, function done(err) {

		if (err) {
			return callback(err);
		}

		that.update(function updated(err) {

			if (err) {
				return callback(err);
			}

			if (!that.pregnant) {
				return callback(new Error('Creature does not seem pregnant'));
			}

			callback(null);
		});
	});
});

/**
 * Get a specific body image of this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.2
 *
 * @param    {String}     part_name    The body part type
 * @param    {Function}   callback
 */
Creature.setMethod(function getBodyPartImage(part_name, callback) {

	var that = this;

	// See if the gene instance is already present
	if (this.gene) {
		return that.gene.getBodyPartImage(this, part_name, callback);
	}

	// Make sure the history files are loaded
	this.loadHistory(function gotHistory(err, history) {
		that.gene.getBodyPartImage(that, part_name, callback);
	});
});

/**
 * Get owner data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @param    {Function}   callback
 */
Creature.setMethod(function getOwnerData(callback) {

	var that = this;

	this.command('dde: getb data', function gotData(err, response) {

		var pieces,
		    result;

		if (err) {
			return callback(err);
		}

		pieces = response.split('|');

		// Owner kit sends data like this:
		// %d|%s|%d|%s|%d|%s|%s|%s|%s|%s|%s|%s|%d|%d|%d|

		result = {
			moniker        : pieces[0],
			name           : pieces[1],
			mother_moniker : pieces[2],
			mother_name    : pieces[3],
			father_moniker : pieces[4],
			father_name    : pieces[5],
			birth_date     : pieces[6],
			birth_place    : pieces[7],
			owner_name     : pieces[8],
			owner_site     : pieces[9],
			owner_notes    : pieces[10],
			owner_email    : pieces[11],
			state          : pieces[12],
			gender         : pieces[13],
			age            : pieces[14],
			_arr           : pieces
		};

		callback(null, result);
	});
});

/**
 * Register the owner notes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @param    {String}     notes
 * @param    {Function}   callback
 */
Creature.setMethod(function setNotes(notes, callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Don't set notes on creatures not in the world,
	// but don't throw an error either
	if (!this.is_in_world) {
		return Blast.nextTick(callback);
	}

	// Get the current data, we'll base the new string on that
	this.getOwnerData(function gotData(err, result) {

		var arr,
		    str;

		if (err) {
			return callback(err);
		}

		// Get the original array
		arr = result._arr;

		// Set the notes
		arr[10] = notes;

		// Make sure we don't overwrite any name that could have just been set
		if (that.has_name && that.name) {
			arr[1] = that.name;
		}

		that.command('dde: putb [' + arr.join('|') + '] data', callback);
	});
});

/**
 * Load the note variables
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @param    {Function}   callback
 */
Creature.setCacheMethod(function loadNoteVars(callback) {

	var that = this;

	this.getOwnerData(function gotOwnerData(err, result) {

		var parsed,
		    note;

		if (err) {
			return callback(err);
		}

		if (result.owner_notes && result.owner_notes.indexOf('{') > -1) {
			parsed = that.app.parse(result.owner_notes);
			that.note_vars = parsed;
		} else if (result.owner_notes) {
			// Remember the original note, if there was one
			note = result.owner_notes.trim();

			if (note) {
				that.note_vars.note = note.replace(/\{/g, '(').replace(/\}/g, ')');
			}
		}

		that.emit('loaded_note_vars');
		callback();
	});
});

/**
 * Set a note var
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @param    {String}     key
 * @param    {String}     value
 * @þaram    {Function}   callback
 */
Creature.setAfterMethod('ready', function setVar(key, value, callback) {

	var serialized;

	if (!this.note_vars) {
		this.note_vars = {};
	}

	// Store this new value
	this.note_vars[key] = value;

	// Serialize the data
	serialized = this.app.serialize(this.note_vars);

	// Store it
	this.setNotes(serialized, callback);
});

module.exports = Creature;