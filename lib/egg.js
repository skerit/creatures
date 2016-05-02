var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    Egg,
    Fn = Blast.Collection.Function;

/**
 * The Egg Class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {CreaturesApplication}   app
 * @param    {Array}                  data
 */
Egg = Fn.inherits('Informer', 'Develry.Creatures', function Egg(app, id) {

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

	// If we already know this is not an egg, return
	if (this.not_an_egg) {
		return callback(null);
	}

	console.log('');
	console.log('Looking up egg id:', this.id);
	console.log('----');

	// Construct the command
	cmd = 'targ ' + this.id + ',dde: putv obv0,dde: putv pose,dde: putv obv1,dde: putv ';

	if (that.app.is_c1) {
		cmd += 'obv2';
	} else {
		cmd += 'tick';
	}

	cmd += ',dde: putv obv3'

	that.app.command(cmd, function gotCommand(err, egg_res) {

		var egg_data;

		if (err) {
			return callback(err);
		}

		egg_data = egg_res.split('|');

		console.log(egg_res.length, egg_res);
		console.log('Egg data:', egg_data);
		//return;

		if (egg_data[0] == 0) {
			that.not_an_egg = true;
		} else {

			// Format the moniker
			if (!that.moniker) {
				that.hex_moniker = Number(egg_data[0]).toString(16);
				that.moniker = that.app.formatMoniker(that.hex_moniker);
			}

			// The stage of the egg
			that.stage = Number(egg_data[1]);

			// The sex of the egg
			// 0 is unkown, 1 is male, 2 is female
			that.sex = Number(egg_data[2]);

			// Gender properties
			that.male = that.sex == 1;
			that.female = this.sex == 2;

			if (that.app.is_c1) {
				if (egg_data[3] == 2) {
					that.paused = true;
				} else {
					that.paused = false;
				}
			} else {
				if (that.stage < 3 && egg_data[3] == 0) {
					that.paused = true;
				} else {
					that.paused = false;
				}
			}
		}

		callback(null);
	});
});

module.exports = Egg;