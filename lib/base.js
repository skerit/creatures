var Creatures,
    Blast = __Protoblast,
    Base,
    Fn = Blast.Collection.Function,
    fs = require('graceful-fs');

// Get the Creatures namespace
Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Creatures base class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Base = Fn.inherits('Informer', 'Develry.Creatures', function Base() {});

/**
 * Simplify the object for Hawkejs
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {WeakMap}   wm
 *
 * @return   {Object}
 */
Base.setMethod(function toHawkejs(wm) {

	// Don't clone in NW
	if (Blast.isNW) {
		return this;
	}

	return Blast.Bound.JSON.clone(this, null, wm);
});

/**
 * Log something
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.7
 */
Base.setMethod(function log(type) {

	var method,
	    args,
	    i;

	args = [this.constructor.name];

	for (i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	switch (type) {
		case 'error':
			method = 'error';
			break;

		case 'debug':
			method = 'debug';
			break;

		case 'warn':
			method = 'warn';
			break;

		default:
			args.unshift(type);
			method = 'log';
			break;
	}

	if (Creatures.log_informer) {
		Creatures.log_informer.emit('log', type, this.constructor.name, args.slice(1));
	}

	return console[method].apply(console, args);
});

/**
 * Named counters for debugging
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.6
 * @version  0.2.6
 *
 * @param    {String}   key
 *
 * @return   {Number}
 */
Base.setMethod(function debugCounter(key) {

	if (!this._counters) {
		this._counters = {};
	}

	if (!this._counters[key]) {
		this._counters[key] = 0;
	}

	this._counters[key]++;

	return this._counters[key];
});

/**
 * Open a file
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.4
 */
Base.setMethod(function readFile(path, options, callback) {

	var that = this,
	    attempts = 1;

	if (typeof options == 'function') {
		callback = options;
		options = null;
	}

	fs.readFile(path, options, function gotFile(err, contents) {

		if (err) {

			if (err.code != 'ENOENT') {
				attempts++;

				if (attempts < 6) {
					that.log('error', 'Read file failed with', err.code, ', attempting retry', attempts);

					return setTimeout(function tryAgain() {
						fs.readFile(path, options, gotFile);
					}, 150 * attempts);
				}

				that.log('error', 'Failed to read file', path, 'after', attempts, 'attempts');
			}

			return callback(err);
		}

		callback(null, contents);
	});
});

module.exports = Base;