var Creatures,
    Blast = __Protoblast,
    Base,
    Fn = Blast.Collection.Function;

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
 * @version  0.2.4
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
			method = 'log';
			break;
	}

	if (Creatures.log_informer) {
		Creatures.log_informer.emit('log', type, this.constructor.name, args.slice(1));
	}

	return console[method].apply(console, args);
});

module.exports = Base;