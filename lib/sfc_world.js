var child_process = require('child_process'),
    Extractor = require('binary-extractor'),
    libpath = require('path'),
    Blast = __Protoblast,
    Fn = Blast.Collection.Function;

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The SfcWorld file class:
 * Files with the sfc extension are world savegames
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   path
 */
var SfcWorld = Fn.inherits('Develry.Creatures.Base', function SfcWorld(app, path) {

	// The parent creatures app
	this.app = app;

	// The path to the file
	this.path = path;

	// The found locations
	this.locations = {};
});

/**
 * Load the file
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @param    {Function} callback
 */
SfcWorld.setCacheMethod(function load(callback) {

	var that = this;

	if (!callback) {
		callback = Function.thrower;
	}

	if (this.buffer) {
		return callback();
	}

	this.readFile(this.path, function gotFile(err, buffer) {

		if (err) {
			return callback(err);
		}

		that.buffer = buffer;
		that.processBuffer(buffer);
		callback();
	});
});

/**
 * Process a history buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer
 */
SfcWorld.setMethod(function processBuffer(buffer) {

	var ex = new Extractor(),
	    locations_index,
	    count = 0,
	    name,
	    x,
	    y;

	// Set the extractor buffer
	ex.setBuffer(buffer);

	// The locations always start with "The Incubator"
	locations_index = buffer.indexOf('0D54686520496E', 'hex');

	// Skip to there
	if (locations_index == -1) {
		this.emit('ready');
		return;
	}

	ex.skip(locations_index);

	// There are at most 6 favourite locations,
	// the incubator is always present
	do {
		name = ex.readLString().trim();
		x = ex.readWord();
		y = ex.readWord();

		if (!name || name.length > 20 || x > 25000) {
			// Don't forget set the index back when it's needed
			break;
		}

		count++;

		this.locations[name] = {
			name : name,
			x    : x,
			y    : y
		};
	} while (name && count < 6);

	this.emit('ready');
});

module.exports = SfcWorld;