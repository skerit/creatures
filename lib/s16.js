var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    Extractor = require('binary-extractor'),
    libpath = require('path'),
    S16,
    fs = require('fs'),
    Fn = Blast.Collection.Function;

/**
 * The S16 class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {CreaturesApplication}   app
 * @param    {String}                 path
 */
S16 = Fn.inherits('Develry.Creatures.Base', function S16(app, path) {

	// The parent creatures app
	this.app = app;

	// The basename
	this.basename = libpath.basename(path);

	// If the basename if the same as the path,
	// we actually need to add path information
	if (path == this.basename) {
		path = libpath.resolve(app.process_dir, 'Images', path);
	}

	// The path to the file
	this.path = path;

	// The content images
	this.images = [];
});

/**
 * Read the file and process it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Function} callback
 */
S16.setCacheMethod(function load(callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	fs.readFile(this.path, function gotFileBuffer(err, buffer) {

		if (err) {
			return callback(err);
		}

		that.processBuffer(buffer);
		that.emit('loaded');
		callback(null, that);
	});
});

/**
 * Process the buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Buffer}   buffer
 */
S16.setMethod(function processBuffer(buffer) {

	var images = this.images,
	    number,
	    entry,
	    pixel,
	    index,
	    ex = new Extractor(),
	    i,
	    j;

	// Set the extractor buffer
	ex.setBuffer(buffer);

	// Get the RGB pixel format
	this.format = ex.readLong();

	// Get the number of images
	this.image_count = ex.readWord();

	// All of the headers come before the actual data
	for (i = 0; i < this.image_count; i++) {
		entry = {
			index  : i,
			offset : ex.readLong(),
			width  : ex.readWord(),
			height : ex.readWord()
		};

		images[i] = entry;
	}

	// Iterage again to get the data
	for (i = 0; i < this.image_count; i++) {
		entry = images[i];
		entry.buffer = ex.readBytes(entry.width * entry.height * 2);

		// rgba data will go in here
		entry.rgba = new Uint8ClampedArray(entry.width * entry.height * 4);
	}

	// Parse the data
	for (i = 0; i < this.image_count; i++) {
		entry = images[i];

		for (j = 0; j < entry.buffer.length; j += 2) {
			number = entry.buffer.readUInt16LE(j);
			index = (j / 2)*4;

			// Completely 0 numbers are transparent
			if (!number) {
				entry.rgba[index+3] = 0;
				continue;
			}

			if (this.format == 0) { // 555
				// Red
				entry.rgba[index]   = (number & 0x7c00) >> 7;

				// Green
				entry.rgba[index+1] = (number & 0x03e0) >> 2;

				// Blue
				entry.rgba[index+2] = (number & 0x001f) << 3;

				// Alpha (255 is fully visible)
				entry.rgba[index+3] = 255;
			} else { // 565
				// Red
				entry.rgba[index]   = (number & 0xf800) >> 8;

				// Green
				entry.rgba[index+1] = (number & 0x07e0) >> 3;

				// Blue
				entry.rgba[index+2] = (number & 0x001f) << 3;

				// Alpha (255 is fully visible)
				entry.rgba[index+3] = 255;
			}
		}
	}
});

module.exports = S16;