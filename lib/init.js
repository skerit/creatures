var OriginalBlast,
    Creatures,
    Blast;

if (typeof __Protoblast != 'undefined') {
	OriginalBlast = __Protoblast;
}

Blast = require('protoblast')(false);
__Protoblast = Blast;

// Get the Creatures namespace
Creatures = Blast.Bound.Function.getNamespace('Develry.Creatures');

require('./base.js');
require('./creatures_application.js');
require('./chemistry.js');
require('./cr_history.js');
require('./creature.js');
require('./egg.js');
require('./export.js');
require('./genome.js');
require('./s16.js');
require('./sfc_ole.js');
require('./sfc_world.js');

if (OriginalBlast) {
	__Protoblast = OriginalBlast;
}

// Export the Creatures namespace
module.exports = Blast.Classes.Develry.Creatures.CreaturesApplication;