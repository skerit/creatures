var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    Extractor = require('binary-extractor'),
    Export,
    fs = require('fs'),
    Fn = Blast.Collection.Function;

/**
 * The Export class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {CreaturesApplication}   app
 * @param    {String}                 path
 */
Export = Fn.inherits('Develry.Creatures.Base', function Export(app, path) {

	// The parent creatures app
	this.app = app;

	// The path to the file
	this.path = path;

	// Has this instance been imported?
	this.imported = 0;
});

/**
 * Read the file and process it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Function} callback
 */
Export.setMethod(function load(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.Thrower;
	}

	if (this.hasBeenSeen('loaded')) {
		return Blast.setImmediate(callback);
	}

	if (this.hasBeenSeen('loading')) {
		return this.afterOnce('loaded', function loaded() {
			Blast.setImmediate(callback);
		});
	}

	this.emit('loading');

	fs.readFile(this.path, function gotFileBuffer(err, buffer) {

		if (err) {
			return callback(err);
		}

		// Process the buffer
		that.processBuffer(buffer);

		that.emit('loaded');
		callback();
	});
});


/**
 * Process the buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Buffer}   buffer
 */
Export.setMethod(function processBuffer(buffer) {

	var version,
	    temp,
	    ex = new Extractor();

	// Store the buffer
	this.buffer = buffer;

	ex.setBuffer(buffer);

	// Skip the first 2 bytes
	ex.skip(2);

	// Read the version
	version = ex.readByte();

	if (version == 1) {
		throw new Error('This is a Creatures 1 export file, it is not supported');
	}

	if (version != 2) {
		throw new Error('Only Creatures 2 export files are supported');
	}

	// 3 more unknown bytes that don't seem to change
	ex.skip(3);

	if (ex.readBytes(8).toString() != 'Creature') {
		throw new Error('This does not seem to be a Creature export file');
	}

	// Skip to index 66
	ex.index = 66;

	// Read the moniker
	this.moniker = ex.readBytes(4).toString();

	console.log('Export moniker:', this.moniker, this);
});

/**
 * Import this file in the current world
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Boolean}  force
 * @param    {Function} callback
 */
Export.setMethod('import', function _import(force, callback) {

	var that = this;

	if (typeof force == 'function') {
		callback = force;
		force = false;
	}

	if (!force && this.imported) {
		return Blast.setImmediate(function alreadyImported() {
			return callback(new Error('This instance has already been imported'));
		});
	}

	// Increment the import count of this instance
	// (not of the creature)
	this.imported++;

	// Actually import it
	this.app.importCreature(this, callback);
});

module.exports = Export;