var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    libpath = require('path'),
    Creature,
    fs = require('fs'),
    Fn = Blast.Collection.Function;

/**
 * The Small Furry Creatures Ole connection class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {CreaturesApplication}   app
 */
Creature = Fn.inherits('Informer', 'Develry.Creatures', function Creature(app) {

	// The application
	this.app = app;

	// The id of this creature in the current world
	this.id = null;

	// The moniker, this will only need to be fetched once
	this.moniker = null;
	this.hex_moniker = null;

	// Values that need to be updated
	this.name = '';
	this.age = 0;
});

/**
 * Perform a creature-specific command
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   cmd
 * @param    {Function} callback
 */
Creature.setMethod(function command(cmd, callback) {

	cmd = "inst,targ " + this.id + "," + cmd;

	this.app.command(cmd, callback);
});

/**
 * Move creature to specified coordinates
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Number}   left
 * @param    {Number}   top
 * @param    {Function} callback
 */
Creature.setMethod(function move(left, right, callback) {
	this.command('mvto ' + left + ' ' + right + ',setv grab 1,slim', callback);
});

/**
 * Load by moniker
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   moniker
 * @param    {Function} callback
 */
Creature.setMethod(function loadByMoniker(moniker, callback) {
	this.moniker = moniker;
	this.loadHistoryFiles(callback);
});

/**
 * Load history files
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function loadHistoryFiles(callback) {

	var that = this,
	    tasks = [],
	    cr_file,
	    histories = {},
	    path_map = {};

	if (!this.moniker) {
		return callback(new Error('Moniker has not been set, can not load history files'));
	}

	cr_file = 'cr_' + this.moniker;

	this.app.getWorlds(function gotWorlds(err, worlds, history_map) {

		if (err) {
			return callback(err);
		}

		Blast.Collection.Object.each(history_map, function eachWorld(path, name) {
			tasks.push(function getHistory(next) {

				var history_path = libpath.resolve(path, cr_file);

				fs.readFile(history_path, function gotFile(err, data) {

					if (!err) {
						histories[name] = data;
						path_map[name] = history_path;
					}

					return next();
				});
			});
		});

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
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function loadHistory(callback) {

	var that = this,
	    world_name,
	    histories;

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

		return callback(null, history);
	});
});

/**
 * Get all the worlds this creature is in
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
Creature.setMethod(function getWorldNames(callback) {

	var that = this,
	    worlds;

	this.loadHistoryFiles(function gotHistory(err, map) {

		worlds = Object.keys(map);

		return callback(null, worlds);
	});
});

/**
 * Get this creature's parent
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   type        mother or father
 * @param    {Function} callback
 */
Creature.setMethod(function getParent(type, callback) {

	var that = this;

	// Get the history file
	this.loadHistory(function gotHistory(err, history) {

		if (err) {
			return callback(err);
		}

		if (!history) {
			return callback(new Error('History not found'));
		}

		that.app.getCreature(history[type + '_moniker'], callback);
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
 * @version  0.1.0
 *
 * @param    {String}   id
 * @param    {Function} callback
 */
Creature.setMethod(function loadById(id, callback) {

	this.id = id;

	this.update(callback);
});

/**
 * Update this creature's data from the running game
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}   callback
 */
Creature.setMethod(function update(callback) {

	var that = this;

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
			this.hex_moniker = response;

			// The formated moniker, needs to be reversed for some reason
			that.moniker = that.app.formatMoniker(response).split('').reverse().join('');

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

		cmd = 'dde: putv camn,dde: putv chem ' + health_chemical + ',dde: putv dead,dde: putv spcs,dde: putv cage,dde: putv gnus';

		that.command(cmd, function gotVitals(err, response) {

			var pieces;

			if (err) {
				return next(err);
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
			that.female = this.sex == 2;

			// The lifestage of the creature
			that.agen = Number(pieces[4]);

			// The race of the creature
			that.race = pieces[5];

			next();
		});
	}, function done(err) {

		if (err) {
			return callback(err);
		}

		callback(null);
	});
});

module.exports = Creature;