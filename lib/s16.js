var Extractor = require('binary-extractor'),
    libpath = require('path'),
    Blast = __Protoblast,
    Fn = Blast.Collection.Function,
    fs = require('graceful-fs');

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

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
var S16 = Fn.inherits('Develry.Creatures.Base', function S16(app, path) {

	// The parent creatures app
	this.app = app;

	// The basename
	this.basename = libpath.basename(path);

	// The path to the file
	this.path = path;

	// The content images
	this.images = [];

	// The filepaths we tried
	this.tried = [];
});

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {Number}  r   The red color value
 * @param   {Number}  g   The green color value
 * @param   {Number}  b   The blue color value
 *
 * @return  {Array}       The HSL representation
 */
S16.setStatic(function rgbToHsl(r, g, b) {
	r /= 255, g /= 255, b /= 255;

	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if (max == min) {
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return [ h, s, l ];
});

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {Number}  h   The hue
 * @param   {Number}  s   The saturation
 * @param   {Number}  l   The lightness
 * @return  {Array}       The RGB representation
 */
S16.setStatic(function hslToRgb(h, s, l) {
	var r, g, b;

	if (s == 0) {
		r = g = b = l; // achromatic
	} else {
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;

		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [ r * 255, g * 255, b * 255 ];
});

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   {Number}  r   The red color value
 * @param   {Number}  g   The green color value
 * @param   {Number}  b   The blue color value
 * @return  {Array}       The HSV representation
 */
S16.setStatic(function rgbToHsv(r, g, b) {
	r /= 255, g /= 255, b /= 255;

	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, v = max;

	var d = max - min;
	s = max == 0 ? 0 : d / max;

	if (max == min) {
		h = 0; // achromatic
	} else {
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return [ h, s, v ];
});

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {Number}  h    The hue
 * @param   {Number}  s    The saturation
 * @param   {Number}  v    The value
 * @return  {Array}        The RGB representation
 */
S16.setStatic(function hsvToRgb(h, s, v) {
	var r, g, b;

	var i = Math.floor(h * 6);
	var f = h * 6 - i;
	var p = v * (1 - s);
	var q = v * (1 - f * s);
	var t = v * (1 - (1 - f) * s);

	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}

	return [ r * 255, g * 255, b * 255 ];
});

/**
 * Read the file and process it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @param    {Function} callback
 */
S16.setCacheMethod(function load(callback) {

	var that = this,
	    got_filename,
	    tried;

	if (!this.app.hasBeenSeen('process_path')) {
		return this.app.afterOnce('process_path', function whenReady() {
			load.call(that, callback);
		});
	}

	if (!callback) {
		callback = Fn.thrower;
	}

	tried = this.tried;

	// If the basename if the same as the path,
	// we actually need to add path information
	if (this.path == this.basename) {
		got_filename = true;
		this.path = libpath.resolve(this.app.process_dir, 'Images', this.path);
	}

	this.readFile(this.path, function gotFileBuffer(err, buffer) {

		var new_path;

		if (err) {
			// Maybe try looking for something else?
			if (err.code == 'ENOENT') {
				new_path = libpath.resolve(that.app.process_dir, 'Applet Data', that.basename);

				if (tried.indexOf(new_path) == -1) {
					that.path = new_path;
					tried.push(new_path);
					return that.readFile(new_path, gotFileBuffer);
				}
			}

			return callback(err);
		}

		that.processBuffer(buffer);
		that.emit('loaded');
		callback(null, that);
	});
});

/**
 * Set the Pigment data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.4
 *
 * @param    {Object}   obj
 */
S16.setMethod(function setPigment(obj) {
	this.pigment_info = obj;
});

/**
 * Set the Pigment bleed data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.4
 *
 * @param    {Array}   arr
 */
S16.setMethod(function setPigmentBleed(arr) {

	if (!arr || !arr.length) {
		this.pigment_bleed_info = null;
		return;
	}

	this.pigment_bleed_info = arr;
});

/**
 * Process the buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @param    {Buffer}   buffer
 */
S16.setMethod(function processBuffer(buffer) {

	var images = this.images,
	    number,
	    entry,
	    pixel,
	    index,
	    info,
	    swap,
	    hsl,
	    rot,
	    ex = new Extractor(),
	    i,
	    j,
	    k,
	    r,
	    b;

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
			// Green numbers rgb(50, 255, 67) are also transparent
			if (!number || number == 2016) {
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

			if (this.pigment_info) {
				entry.rgba[index]   = ~~(entry.rgba[index  ] * this.pigment_info.r);
				entry.rgba[index+1] = ~~(entry.rgba[index+1] * this.pigment_info.g);
				entry.rgba[index+2] = ~~(entry.rgba[index+2] * this.pigment_info.b);
			}

			if (this.pigment_bleed_info) {
				hsl = S16.rgbToHsl(entry.rgba[index], entry.rgba[index+1], entry.rgba[index+2]);

				for (k = 0; k < this.pigment_bleed_info.length; k++) {
					info = this.pigment_bleed_info[k];
					rot = (0.33 * ((info.rotation - 128) / 128));

					//hsl[0] = (((hsl[0] * 360) - (info.rotation - (64*3))) % 360) / 360;
					hsl[0] = (hsl[0] - rot) % 1;

					if (hsl[0] < 0) {
						hsl[0] = 1 + hsl[0];
					}
				}

				info = S16.hslToRgb(hsl[0], hsl[1], hsl[2]);
				entry.rgba[index  ] = (entry.rgba[index  ] + info[0]) / 2;
				entry.rgba[index+1] = (entry.rgba[index+1] + info[1]) / 2;
				entry.rgba[index+2] = (entry.rgba[index+2] + info[2]) / 2;

				// Now do the swap
				for (k = 0; k < this.pigment_bleed_info.length; k++) {
					info = this.pigment_bleed_info[k];
					swap = Math.abs(1 * ((info.swap - 128) / 128));

					r = entry.rgba[index]
					b = entry.rgba[index+2];

					entry.rgba[index  ] = (entry.rgba[index  ] + ((r * (1-swap)) + (b * swap))) / 2;
					entry.rgba[index+2] = (entry.rgba[index+2] + ((b * (1-swap)) + (r * swap))) / 2;

				}
			}
		}
	}
});

module.exports = S16;