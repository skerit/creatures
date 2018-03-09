var Blast = __Protoblast,
    Fn = Blast.Collection.Function;

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Egg Class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {CreaturesApplication}   app
 * @param    {Array}                  data
 */
var Egg = Fn.inherits('Develry.Creatures.Base', function Egg(app, id) {

	// The application
	this.app = app;

	// Creatures sens an egg targ that isn't an egg
	this.not_an_egg = false;

	// The targ id
	this.id = id;

	// The moniker, this will only need to be fetched once
	this.moniker = null;
	this.hex_moniker = null;

	// The stage of the egg
	this.stage = 0;

	// Is the egg paused?
	this.paused = null;
});

/**
 * Current gender
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type    {String}
 */
Egg.setProperty(function gender() {

	var result = '';

	if (this.sex == 0) {
		result = 'Unknown';
	} else if (this.sex == 1) {
		result = 'Male';
	} else if (this.sex == 2) {
		result = 'Female';
	}

	return result;
});

/**
 * Is this egg hatching?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type    {Boolean}
 */
Egg.setProperty(function hatching() {
	return this.stage == 6;
});

/**
 * Has this egg hatched?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type    {Boolean}
 */
Egg.setProperty(function hatched() {
	return this.stage == 7;
});

/**
 * Perform an egg-specific command
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}   cmd
 * @param    {Function} callback
 */
Egg.setMethod(function command(cmd, callback) {

	if (!this.id) {
		return callback(new Error('This egg has no valid id'));
	}

	cmd = "inst,targ " + this.id + "," + cmd;

	this.app.command(cmd, callback);
});

/**
 * Solve the disappearance of this egg
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function}   callback
 */
Egg.setMethod(function solveDisappearance(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// Get all the available creatures
	this.app.getCreatures(function gotCreatures(err, creatures) {

		var matching_creature;

		if (err) {
			return callback(err);
		}

		// Iterate over all the creatures and see if there's a match
		creatures.forEach(function eachCreature(creature) {
			if (creature.moniker && creature.moniker == that.moniker) {
				matching_creature = creature;
			}
		});

		if (matching_creature) {
			// If it hasn't been emitted yet, do the hatched event now
			that.emitOnce('hatched', matching_creature);

			// And finally the removed event (when the egg shell is gone)
			that.emit('removed', 'hatched', matching_creature);
		} else {
			that.emit('removed');
		}
	});
});

/**
 * Pause this egg
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function}   callback
 */
Egg.setMethod(function pause(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// It's already hatching, nothing to pause
	if (this.hatching || this.hatched) {
		return Blast.setImmediate(callback);
	}

	this.command('doif pose lt 6,doif tick gt 0,tick 0,endi,endi', function paused(err) {

		if (err) {
			return callback(err);
		}

		that.paused = true;
		that.update(callback);
	});
});

/**
 * Pause this egg
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function}   callback
 */
Egg.setMethod(function resume(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// It's already hatching, nothing to resume
	if (this.hatching || this.hatched) {
		return Blast.setImmediate(callback);
	}

	this.command('doif pose lt 6,doif tick eq 0,tick 600,endi,endi', function resumed(err) {

		if (err) {
			return callback(err);
		}

		that.paused = false;
		that.update(callback);
	});
});

/**
 * Hatch this egg
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function}   callback
 */
Egg.setMethod(function hatch(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	// It's already hatching, nothing to force
	if (this.hatching || this.hatched) {
		return Blast.setImmediate(callback);
	}

	this.command('doif pose le 6,pose 6,setv attr 195,tick 10,endi', function hatched(err) {

		if (err) {
			return callback(err);
		}

		that.paused = false;
		that.update(callback);
	});
});

/**
 * Update this egg's data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}   callback
 */
Egg.setMethod(function update(callback) {

	var that = this,
	    cmd;

	if (this.not_an_egg) {
		return callback();
	}

	// Construct the command
	// 'targ ' + this.id + ',
	cmd = 'dde: putv obv0,dde: putv pose,dde: putv obv1,dde: putv ';

	if (that.app.is_c1) {
		cmd += 'obv2';
	} else {
		cmd += 'tick';
	}

	cmd += ',dde: putv obv3'

	that.command(cmd, function gotCommand(err, egg_res) {

		var egg_data;

		if (err) {
			return callback(err);
		}

		egg_data = egg_res.split('|');

		if (egg_data[0] == 0) {
			that.id = '';
			that.removed = true;
		}

		// Format the moniker
		if (!that.moniker) {
			that.hex_moniker = Number(egg_data[0]).toString(16);
			that.moniker = that.app.formatMoniker(that.hex_moniker);
		}

		// Some monikers exist out of 0 bytes
		// (Don't know where they come from though)
		if (!that.moniker || that.moniker.charCodeAt(0) == 0) {
			that.moniker = '';
			that.not_an_egg = true;
			return callback();
		}

		// The stage of the egg
		that.stage = Number(egg_data[1]);

		// The sex of the egg
		// 0 is unkown, 1 is male, 2 is female
		that.sex = Number(egg_data[2]);

		// Gender properties
		that.male = that.sex == 1;
		that.female = that.sex == 2;

		// Current tick progress
		that.tick_progress = Number(egg_data[3]);

		if (that.app.is_c1) {
			if (egg_data[3] == 2) {
				that.paused = true;
			} else {
				that.paused = false;
			}
		} else {
			if (that.stage <= 3 && that.tick_progress == 0) {
				that.paused = true;
			} else {
				that.paused = false;
			}
		}

		// Stage 7 means it has hatched!
		if (that.stage == 7) {
			that.app.getCreature(that.moniker, function gotCreature(err, creature) {

				if (err || !creature) {
					return;
				}

				// Emit the hatched event
				that.emitOnce('hatched', creature);
			});
		}

		callback(null);
		that.emit('updated');
	});
});

module.exports = Egg;