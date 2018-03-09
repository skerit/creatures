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

module.exports = Base;