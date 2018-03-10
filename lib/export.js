var Extractor = require('binary-extractor'),
    Blast = __Protoblast,
    Fn = Blast.Collection.Function,
    fs = require('fs');

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Export class is a type of creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {CreaturesApplication}   app
 * @param    {String}                 path
 */
var Export = Fn.inherits('Develry.Creatures.Creature', function Export(app, path) {

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
	    name,
	    ex = new Extractor(),
	    i;

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

	// Skip to index 76 (Start of CGallery interesting data)
	ex.index = 78;

	// Create the cgallery array
	this.cgallery = [];

	for (i = 0; i < 250; i++) {
		temp = {};

		// The next 2 bytes are always 0x0400
		ex.skip(2);

		// The next byte is always 0 or 1
		temp.bool1 = ex.readByte(1);

		// Next is another byte
		temp.byte1 = ex.readByte(1);

		// Then we have 3 0 bytes again
		ex.skip(3);

		// Another unknown byte
		temp.byte2 = ex.readByte(1);

		// Another set of 3 0 bytes
		ex.skip(3);

		// Then we have another 2 bytes
		temp.byte3 = ex.readByte(1);
		temp.byte4 = ex.readByte(1);

		// Go back 2, it might also be a word... no idea
		ex.index -= 2;
		temp.word = ex.readWord();

		// Some kind of number.ranging from 0 to 14
		temp.nr = ex.readByte(1);

		// The next is another 0
		ex.skip(1);

		this.cgallery.push(temp);
	}

	// At 4283 the creature's moniker appears again
	ex.index = 4283;

	if (ex.readBytes(4).toString() != this.moniker) {
		console.warn('Wrong moniker?')
	}

	// Next is the mother's moniker
	this.mother_moniker = ex.readBytes(4).toString();

	// And the father's
	this.father_moniker = ex.readBytes(4).toString();

	// Next is the mother's name
	this.mother_name = ex.readLString();

	// And the father's name
	this.father_name = ex.readLString();

	// Now there is always 2 FF bytes
	ex.skip(2);

	// Followed by 0x01000400
	ex.skip(4);

	// Next is the Body part of the CGallery
	if (ex.readBytes(4).toString() != 'Body') {
		console.warn('Export "Body" section not found');
	} else {
		// Next is 0x0400
		ex.skip(2);
	}

	// Jump to the CBiochemistry part (+/- 89033 bytes)
	ex.after('CBiochemistry');

	// Load chemistry
	this.chemistry = new Creatures.Chemistry(this.app);
	this.chemistry.processBuffer(ex);

	// Get the health
	this.health = this.chemistry.getValue(72);

	// Skip over COrgan and some other data
	ex.after([0x14, 0, 0, 0, 0x70, 0x01]);

	// Next byte is the lifestage
	this.agen = ex.readByte(1);

	// Now it's 3 unknown bytes
	ex.skip(3);

	// Followed by 1 0 byte
	ex.skip(1);

	// Now a moniker may or may not appear again.
	// This is sometimes the same moniker, or the "original" creature moniker?
	// Sometimes it's empty
	ex.skip(4);

	// Now there are 5 zero bytes again
	ex.skip(5);

	// And 1 more unknown byte
	ex.skip(1);

	// The next 2 bytes are the age
	this.age = ex.readWord();

	// Parse the age
	this.age = ~~((this.age * 25.6) / 60);

	// Let's find the creatures name
	ex.after([0x3C, 0x80, 0xF8, 0x8D, 0xFC, 0x88]);

	// Look for this creature's moniker again
	ex.after(this.moniker);

	// And now we can get the name
	this.name = ex.readLString();

	// Next is the mother's moniker
	ex.skip(4);

	// And the mother's name
	ex.readLString();

	// The father's moniker
	ex.skip(4);

	// And the father's name
	ex.readLString();

	// Next is the birthdate
	this.birthdate_string = ex.readLString();

	// Javascript can parse this date easily
	this.birthdate = new Date(this.birthdate_string);

	// And the birthplace name
	this.birthplace = ex.readLString();

	// The original owner (if registered)
	this.owner_name = ex.readLString();

	// The owner's url
	this.owner_url = ex.readLString();

	// The owner's notes
	this.notes = ex.readLString();

	// And the owner's email address
	this.email = ex.readLString();

	// Jump to the CGenome part (+/- 98120 bytes)
	ex.after('CGenome');

	// The first 2 bytes is the length of the chunk
	this.genome_chunk_length = ex.readWord();

	// Then there are 2 0 bytes
	ex.skip(2);

	// Next is the moniker, again
	if (ex.readBytes(4).toString() != this.moniker) {
		console.warn('Genome moniker missmatch');
	}

	// And now we have the gender
	this.male = ex.readByte(1) == 1;
	this.female = !this.male;

	// Another 3 0 bytes
	ex.skip(3);

	// And finally the lifestage
	this.agen = ex.readByte(1);

	// Process the genome
	this.genome = new Blast.Classes.Develry.Creatures.Genome(this.app);

	// Process the genome part of the buffer
	this.genome.processBuffer(ex, true);
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

/**
 * Get a specific body image of this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}     part_name    The body part type
 * @param    {Function}   callback
 */
Export.setAfterMethod('loaded', function getBodyPartImage(part_name, callback) {
	this.genome.getBodyPartImage(this, part_name, callback);
});


module.exports = Export;