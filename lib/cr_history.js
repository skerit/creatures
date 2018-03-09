var Blast = __Protoblast,
    Fn = Blast.Collection.Function,
    fs = require('fs');

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The History file class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {String}   path
 */
var History = Fn.inherits('Develry.Creatures.Base', function CrHistory(app, path) {

	// The parent creatures app
	this.app = app;

	// The path to the file
	this.path = path;

	// Creature object will be set here
	this.creature = null;
});

/**
 * The name of the world,
 * the last part of the path is used for this.
 * That'll work with everything except world.sfc
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
History.prepareProperty(function world_name() {

	var pieces,
	    piece;

	if (!this.path) {
		console.warn('History did not have a path!');
		return '';
	}

	pieces = this.path.split('/');
	piece = pieces.pop();

	if (!piece) {
		piece = pieces.pop();
	}

	return piece;
});

/**
 * Read the file and process it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Boolean}  refresh
 * @param    {Function} callback
 */
History.setMethod(function load(refresh, callback) {

	var that = this;

	if (typeof refresh == 'function') {
		callback = refresh;
		refresh = false;
	}

	if (!callback) {
		callback = Fn.Thrower;
	}

	// Callback if this has already been loaded and a refresh is not needed
	if (this.moniker && !refresh) {
		return Blast.setImmediate(function immediate() {
			callback(null);
		});
	}

	fs.readFile(this.path, function gotFileBuffer(err, buffer) {

		if (err) {
			return callback(err);
		}

		// Process the buffer
		that.processBuffer(buffer);

		return callback(null);
	});
});

/**
 * Create/get the creature object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function} callback
 */
History.setMethod(function loadCreature(callback) {

	var that = this;

	if (this.creature) {
		return Blast.setImmediate(function immediate() {
			callback(null, that.creature);
		});
	}

	this.load(function loaded(err) {

		if (err) {
			return callback(err);
		}

		that.app.getCreature(that.moniker, function gotCreature(err, creature) {

			if (err) {
				return callback(err);
			}

			creature.registerHistory(that);

			that.creature = creature;
			callback(null, creature);
		});
	});
});

/**
 * Read CString of the current buffer,
 * and move buffer index pointer.
 * These aren't Cstrings as you know them,
 * they don't end with \0
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer   Optional buffer to read from
 *
 * @return   {String}
 */
History.setMethod(function readCstring(buffer) {

	var set_pointer,
	    length,
	    string,
	    end,
	    idx;

	if (!buffer) {
		set_pointer = true;
		buffer = this.buffer;
		idx = this.buffer_index;
	} else {
		idx = 0;
	}

	// Get the length of the cstring
	length = buffer[idx];

	// Increment the idx
	idx += 1;

	// @TODO: do something when length is 255, or so

	// Calculate the end index
	end = idx + length;

	// Get the actual string
	string = buffer.slice(idx, end).toString();

	if (set_pointer) {
		this.buffer_index = end;
	}

	return string;
});

/**
 * Read moniker and move pointer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer   Optional buffer to read from
 *
 * @return   {String}
 */
History.setMethod(function readMoniker(buffer) {

	var set_pointer,
	    string,
	    idx;

	if (!buffer) {
		set_pointer = true;
		buffer = this.buffer;
		idx = this.buffer_index;
	} else {
		idx = 0;
	}

	// Get the actual string
	string = this.app.formatMoniker(buffer.slice(idx, idx + 4));

	if (set_pointer) {
		this.buffer_index = idx + 4;
	}

	return string;
});

/**
 * Read LONG
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer   Optional buffer to read from
 *
 * @return   {String}
 */
History.setMethod(function readLong(buffer) {

	var set_pointer,
	    number,
	    idx,
	    end;

	if (!buffer) {
		set_pointer = true;
		buffer = this.buffer;
		idx = this.buffer_index;
	} else {
		idx = 0;
	}

	end = idx + 4;

	// Parse the unsigned 32-bit long little-endian integer
	number = buffer.readUInt32LE(idx);

	if (set_pointer) {
		this.buffer_index = end;
	}

	return number;
});

/**
 * Read a number of bytes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Integer}  size
 * @param    {Buffer}   buffer   Optional buffer to read from
 *
 * @return   {Buffer}
 */
History.setMethod(function readBytes(size, buffer) {

	var set_pointer,
	    result,
	    idx,
	    end;

	if (!buffer) {
		set_pointer = true;
		buffer = this.buffer;
		idx = this.buffer_index;
	} else {
		idx = 0;
	}

	end = idx + size;

	result = buffer.slice(idx, end)

	if (set_pointer) {
		this.buffer_index = end;
	}

	return result;
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
History.setMethod(function processBuffer(buffer) {

	// Set the current buffer
	this.buffer = buffer;

	// Set the current buffer index
	this.buffer_index = 0;

	// Get the moniker from the file
	this.moniker = this.readMoniker();

	// Set the creature's own name
	this.name = this.readCstring();

	// Read the mother's moniker
	this.mother_moniker = this.readMoniker();

	// Read the mother's name
	this.mother_name = this.readCstring();

	// Read the father's moniker
	this.father_moniker = this.readMoniker();

	// Read the father's name, if any
	this.father_name = this.readCstring();

	// Read the birthday
	this.birthday = this.readCstring();

	// Read the birthplace
	this.birthplace = this.readCstring();

	// Read the owner name
	this.owner_name = this.readCstring();

	// Read the owner url
	this.owner_url = this.readCstring();

	// Read the owner notes
	this.owner_notes = this.readCstring();

	// Read the owner email
	this.owner_email = this.readCstring();

	// Read the creatures's state
	this.long_state = this.readLong();

	// Creature status
	this.is_alive = this.long_state == 0;
	this.is_dead = this.long_state == 1;
	this.is_exported = this.long_state == 2;

	// Read the creatures's gender
	this.long_gender = this.readLong();

	// Creature gender
	this.is_male = this.long_gender == 1;
	this.is_female = this.long_gender == 2;

	// Read the creature's age
	// WARNING: always seems to be 0
	this.age = this.readLong();

	// Read the creature's epitaph, if there is one
	this.epitapth = this.readCstring();

	// The picture of the norn's album to use for the grave
	this.grave_picture = this.readLong();

	// Time of death
	this.time_of_death = this.readLong();
	this.date_of_death = this.time_of_death ? new Date(this.time_of_death * 1000) : null;

	// Time of birth
	this.time_of_birth = this.readLong();
	this.date_of_birth = new Date(this.time_of_birth * 1000);

	// Time of reaching adolescence
	this.time_of_adolescence = this.readLong();
	this.date_of_adolescence = this.time_of_adolescence ? new Date(this.time_of_adolescence * 1000) : null;

	// Is this death registered?
	this.is_death_registered = Boolean(this.readLong());

	// Genus: kind of creature
	this.long_genus = this.readLong();

	// Get correct genus
	this.is_norn = this.long_genus == 1;
	this.is_grendel = this.long_genus == 2;
	this.is_ettin = this.long_genus == 3;

	// The lifestage of the creature
	this.long_stage = this.readLong();

	// The chimicals at death
	this.chemicals_at_death = this.readBytes(256);

	// Emit the processed event
	this.emit('processed');
});


module.exports = History;