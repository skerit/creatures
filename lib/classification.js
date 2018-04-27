module.exports = function loadClassification(App) {

	var all = App.prototype.classification_system,
	    system,
	    invisible,
	    simple,
	    complex,
	    creatures,
	    genus,
	    species;

	// The system family
	App.register('System',           0);

	App.register('Halo toggler', 0, 1, 0);

	// The invisible family
	App.register('Invisible',        1);


	// The simple objects family
	App.register('Simple object',    2);

	// The Self genus
	App.register('Self', 2, 0);

	// The System genus in the Simple objects
	App.register('System', 2, 1);

	// Simple system species
	App.register('Speech bubble',      2, 1, 2);
	App.register('Norn indicator',     2, 1, 3);
	App.register('Coma indicator',     2, 1, 4);
	App.register('Sleep indicator',    2, 1, 5);
	App.register('Drowning indicator', 2, 1, 6);

	App.register('Teleporter flash',     2, 1, 21);
	App.register('Made by Trifid seed',  2, 1, 22);
	App.register('Rotating cheese sign', 2, 1, 23);
	App.register('Ettin mother',         2, 1, 25);
	App.register('Zander generator',     2, 1, 26);
	App.register('Bubbles',              2, 1, 27);
	App.register('Something in sub bay', 2, 1, 28);
	App.register('Tree sounds',          2, 1, 29);
	App.register('Swamp sounds',         2, 1, 30);
	App.register('Fruit generator',      2, 1, 31);
	App.register('Shee scarer',          2, 1, 32);

	App.register('Rabbit generator',     2, 1, 37);

	App.register('Hatchery sounds',      2, 1, 39);
	App.register('Ocean sounds',         2, 1, 40);
	App.register('Desert sounds',        2, 1, 41);
	App.register('Glowing green window', 2, 1, 42);
	App.register('Potion tanks',         2, 1, 43);
	App.register('Green fluids',         2, 1, 44);
	App.register('Red fluids',           2, 1, 45);
	App.register('Yellow fluids',        2, 1, 46);

	App.register('Flugelhorn notes',             2, 1, 47);
	App.register('Gnat and firefly generator',   2, 1, 48);
	App.register('Potion-filling nozzle',        2, 1, 49);
	App.register('Potion-filling valve',         2, 1, 50);

	App.register('Grendel mother',               2, 1, 52);
	App.register('Bubble generator',             2, 1, 53);
	App.register('Iceberg generator',            2, 1, 54);

	App.register('Barrel that triggers Shee scarer', 2, 1, 56);

	/**
	 * Call buttons
	 */
	App.register('Call Button', 2, 2);

	App.register('Space-age style',     2, 2, 1);
	App.register('Old-fashioned style', 2, 2, 2);

	// Custom
	App.register('Travelers rescue pole', 2, 2, 48584);
	App.register('Travelers hub',         2, 2, 48585);


	/**
	 * Nature
	 */
	App.register('Nature',      2, 3);

	App.register('Hatchery waterfall',   2, 3, 1);
	App.register('Swamp waves',          2, 3, 2);

	App.register('Submarine lock mask',  2, 3, 4);

	App.register('Seasonal tree',           2, 3, 8);
	App.register('Possible bee hive sites', 2, 3, 9);
	App.register('Dungeon flamepots',       2, 3, 10);

	App.register('More waterwheel',         2, 3, 12);

	App.register('RH Large lava flume',     2, 3, 14);
	App.register('LH Large lava flume',     2, 3, 15);
	App.register('Middle lava blub',        2, 3, 16);
	App.register('Left lava blub',          2, 3, 17);
	App.register('Iceberg',                 2, 3, 18);
	App.register('Spiderweb',               2, 3, 19);

	/**
	 * Good plants
	 */
	App.register('Good Plant',      2, 4);

	App.register('Tomato',             2, 4, 1);
	App.register('Gelsemium plant',    2, 4, 2);
	App.register('Fungi (deprecated)', 2, 4, 3);

	App.register('Acorn plant',      2, 4, 4);
	App.register('Walking tree',     2, 4, 5);

	/**
	 * Creature eggs
	 */
	App.register('Creature egg',    2, 5);

	App.register('Norn egg',        2, 5, 2);
	App.register('Ettin egg',       2, 5, 3);
	App.register('Grendel egg',     2, 5, 4);

	/**
	 * Processed foods
	 */
	App.register('Processed food',  2, 6);

	App.register('Cheese', 2, 6, 1);
	App.register('Honey',  2, 6, 2);

	/**
	 * Drink
	 */
	App.register('Drink',           2, 7);

	App.register('Water bottle', 2, 7, 1);
	App.register('Water pump',   2, 7, 2);
	App.register('Potion flask', 2, 7, 3);

	// Custom
	App.register('Water fountain', 2, 7, 22222);

	/**
	 * Food dispensor
	 */
	App.register('Food dispensor',  2, 8);

	App.register('Cheese vendor',   2, 8, 1);

	/**
	 * Implements
	 */
	App.register('Implements',      2, 9);

	App.register('Cactus seed launcher',     2, 9, 1);
	App.register('Pear plant seed launcher', 2, 9, 2);
	App.register('Trifid seed launcher',     2, 9, 3);
	App.register('Carrot seed launcher',     2, 9, 4);
	App.register('Trumpet seed launcher',    2, 9, 5);
	App.register('Windsock',                 2, 9, 6);
	App.register('Outer sub-lock door',      2, 9, 7);
	App.register('Inner sub-lock door',      2, 9, 8);
	App.register('Potato seed launcher',     2, 9, 9);
	App.register('Volcano door',             2, 9, 10);
	App.register('Doghouse',                 2, 9, 11);

	App.register('Fishing pole',             2, 9, 13);
	App.register('Fishing hook',             2, 9, 14);
	App.register('Electric gate',            2, 9, 15);
	App.register('PowerUp',                  2, 9, 16);
	App.register('Sciencekit powerup',       2, 9, 17);
	App.register('Neuroscience powerup',     2, 9, 18);
	App.register('All creatures powerup',    2, 9, 19);
	App.register('Scroll powerup',           2, 9, 20);
	App.register('Terrarium door',           2, 9, 21);

	App.register('DG Cactus seed launcher',  2, 9, 23);
	App.register('Zander egg launcher',      2, 9, 24);
	App.register('Goldfish egg launcher',    2, 9, 25);
	App.register('Orange butterfly egg launcher', 2, 9, 26);
	App.register('Purple butterfly egg launcher', 2, 9, 27);
	App.register('Shee laptop computer',          2, 9, 28);

	/**
	 * Cliff edges
	 */
	App.register('Cliff Edge',      2, 10);

	/**
	 * Detritus (Rotten food)
	 */
	App.register('Detritus',        2, 11);

	App.register('Spoiled tomato',  2, 11, 1);

	App.register('Spoiled trifid fruit',      2, 11, 3);
	App.register('Spoiled pear plant fruit',  2, 11, 4);
	App.register('Spoiled trumpet fruit',     2, 11, 5);
	App.register('Fishbones',                 2, 11, 6);
	App.register('Spoiled carrot',            2, 11, 7);
	App.register('Spoiled potato',            2, 11, 8);

	/**
	 * Cures
	 */
	App.register('Cures',           2, 12);

	/**
	 * Toys
	 */
	App.register('Toys',            2, 13);

	App.register('Norn launcher',  2, 13, 1);
	App.register('Tomato gun',     2, 13, 2);

	App.register('Beachball',        2, 13, 4);
	App.register('Green tennisball', 2, 13, 5);
	App.register('Car',              2, 13, 6);
	App.register('Stuffed dog',      2, 13, 7);
	App.register('Punching bag',     2, 13, 8);
	App.register('Slinky',           2, 13, 9);

	App.register('Purple tennisball', 2, 13, 12);
	App.register('Spinning top',      2, 13, 13);
	App.register('Punchgun',          2, 13, 14);
	App.register('Copper triangle',   2, 13, 15);
	App.register('Drum',              2, 13, 16);
	App.register('Electric guitar',   2, 13, 17);
	App.register('Saxophone',         2, 13, 18);

	/**
	 * Weather
	 */
	App.register('Weather',         2, 14);

	App.register('Cloud',                      2, 14, 1);
	App.register('Thunderhead with lightning', 2, 14, 2);
	App.register('Rain, snow and sleet',       2, 14, 3);

	App.register('Teùperature & pressure regulator', 2, 14, 5);
	App.register('Cloud machine',                    2, 14, 10);

	/**
	 * Bad plants
	 */
	App.register('Bad plant',       2, 15);

	App.register('Light green cactus', 2, 15, 1);
	App.register('Venus flytrap',      2, 15, 2);

	App.register('Dark green cactus',  2, 15, 4);
	App.register('Fungus',             2, 15, 5);
	App.register('Deathcap mushroom',  2, 15, 6);
	App.register('Deathcap',           2, 15, 7);
	App.register('Ledum berry',        2, 15, 8);
	App.register('Red fruit',          2, 15, 9);

	/**
	 * Animal nests
	 */
	App.register('Animal nest',     2, 16);

	App.register('Anthill',         2, 16, 1);
	App.register('Beehive',         2, 16, 2);

	/**
	 * Bad bugs
	 */
	App.register('Bad bug',         2, 17);

	App.register('Ant',             2, 17, 1);
	App.register('Bee',             2, 17, 2);
	App.register('Queen ant',       2, 17, 3);
	App.register('Gnats',           2, 17, 4);
	App.register('Queen bee',       2, 17, 5);
	App.register('Swarming bee',    2, 17, 6);

	/**
	 * Regular bugs
	 */
	App.register('Bug',             2, 18);

	App.register('Purple pupae',          2, 18, 1);
	App.register('Striped caterpillar',   2, 18, 2);
	App.register('Orange butterfly',      2, 18, 3);
	App.register('Firefly',               2, 18, 4);
	App.register('Glow worm',             2, 18, 5);
	App.register('Hairy caterpillar',     2, 18, 6);
	App.register('Purple butterfly',      2, 18, 7);
	App.register('Purple butterfly egg',  2, 18, 8);
	App.register('Snail',                 2, 18, 9);

	/**
	 * Bad critters
	 */
	App.register('Bad critter',     2, 19);

	App.register('Bat',             2, 19, 1);
	App.register('Crab',            2, 19, 2);
	App.register('Clam',            2, 19, 3);
	App.register('Coral',           2, 19, 4);
	App.register('Borland the C monster', 2, 19, 5);
	App.register('Shee statue eyes',      2, 19, 6);

	App.register('Jellyfish',        2, 19, 8);
	App.register('Spider',           2, 19, 9);

	// Custom bad critters
	App.register('Underground sweeper', 2, 19, 21000);

	/**
	 * Regular critters
	 */
	App.register('Critter',         2, 20);

	App.register('Rabbit',          2, 20, 1);
	App.register('Doozer',          2, 20, 2);
	App.register('Zander',          2, 20, 3);
	App.register('Anemone',         2, 20, 4);
	App.register('Chameleon',       2, 20, 5);

	App.register('Zander egg',      2, 20, 7);

	App.register('Goldfish',        2, 20, 9);
	App.register('Dog',             2, 20, 10);

	App.register('Puffer fish',     2, 20, 13);

	App.register('Frog tadpole',    2, 20, 16);
	App.register('Frog',            2, 20, 17);
	App.register('Frog egg',        2, 20, 19);

	/**
	 * Seeds
	 */
	App.register('Seed',             2, 21);

	App.register('Pear flower seed',        2, 21, 1);
	App.register('Light green cactus seed', 2, 21, 2);
	App.register('Trifid seed',             2, 21, 3);
	App.register('Trumpet seed',            2, 21, 4);
	App.register('Trumpet seed',            2, 21, 5);
	App.register('Dark green cactus seed',  2, 21, 6);
	App.register('Pufball spore',           2, 21, 7);
	App.register('Orchid seed',             2, 21, 8);

	/**
	 * Leafs
	 */
	App.register('Leaf',            2, 22);

	/**
	 * Root vegetables
	 */
	App.register('Root vegetable',  2, 23);

	App.register('Carrot',          2, 23, 1);
	App.register('Potatoe',         2, 23, 2);

	/**
	 * Flowers
	 */
	App.register('Flower',          2, 24);

	App.register('Pear plant flower', 2, 24, 1);
	App.register('Triffid flower',    2, 24, 2);
	App.register('Trumpet flower',    2, 24, 3);
	App.register('Orchid',            2, 24, 4);

	/**
	 * Fruits
	 */
	App.register('Fruit',           2, 25);

	App.register('Tomato',           2, 25, 1);
	App.register('Gelsemium',        2, 25, 2);
	App.register('Trifid fruit',     2, 25, 3);
	App.register('Pear plant fruit', 2, 25, 4);
	App.register('Trumpet fruit',    2, 25, 5);
	App.register('Acorn',            2, 25, 6);
	App.register('Masham berry',     2, 25, 7);
	App.register('Purple droopy',    2, 25, 8);
	App.register('Aubergine',        2, 25, 9);

	App.register('Ashgum berry',     2, 25, 10);
	App.register('Rosehip',          2, 25, 11);
	App.register('Arnica berry',     2, 25, 12);
	App.register('Summer foxfire berry', 2, 25, 13);
	App.register('Cantharis berry',      2, 25, 14);
	App.register('Pulsatilla berry',     2, 25, 15);
	App.register('Fungi',            2, 25, 16);
	App.register('Bryonia berry',    2, 25, 17);

	// The complex objects family
	App.register('Complex object', 3);

	/**
	 * Movers
	 */
	App.register('Mover',      3, 1);

	App.register('Submarine',  3, 1, 2);

	/**
	 * Lifts
	 */
	App.register('Lift',        3, 2);

	App.register('Bamboo & slat lift', 3, 2, 2);
	App.register('Metal cage lift',    3, 2, 3);
	App.register('Platform lift',      3, 2, 4);

	/**
	 * Computers
	 */
	App.register('Computer',    3, 3);

	App.register('Verbs computer',    3, 3, 1);
	App.register('Drives computer',   3, 3, 2);

	App.register('Doozer blackboard', 3, 3, 10);
	App.register('Laptop blackboard', 3, 3, 11);

	// Custom
	App.register('Easy-talk computer', 3, 3, 31502);

	/**
	 * Mediabox (fun)
	 */
	App.register('Mediabox',    3, 4);

	App.register('Clock',       3, 4, 1);
	App.register('Calender',    3, 4, 2);
	App.register('Chimes',      3, 4, 3);
	App.register('Flugelhorn',  3, 4, 4);

	/**
	 * Messages
	 */
	App.register('Messages',    3, 5);

	/**
	 * LeftRight
	 */
	App.register('LeftRight',   3, 6);

	App.register('Rowboat',     3, 6, 1);
	App.register('Rubber raft', 3, 6, 2);
	App.register('Tube car',    3, 6, 3);

	/**
	 * Incubators
	 */
	App.register('Incubator',   3, 7);

	App.register('Incubator',   3, 7, 1);

	/**
	 * Teleporters
	 */
	App.register('Teleporter',  3, 8);

	App.register('Hatchery teleporter', 3, 8, 1);
	App.register('Teleporter',          3, 8, 2);

	/**
	 * Machines
	 */
	App.register('Machine',     3, 10);

	App.register('Splicer turret',           3, 10, 1);
	App.register('Splicer screw-gear',       3, 10, 2);
	App.register('Splicer left-hand cage',   3, 10, 3);
	App.register('Splicer right-hand cage',  3, 10, 4);
	App.register('Splicer lever',            3, 10, 5);
	App.register('Splicer cooling coils',    3, 10, 6);
	App.register('Splicer egg drop',         3, 10, 7);
	App.register('Control room RH computer', 3, 10, 8);
	App.register('Control room red light',   3, 10, 9);
	App.register('Control room needle gauge',3, 10, 10);
	App.register('Control room lh computer', 3, 10, 11);
	App.register('Potion mixer',             3, 10, 12);

	// The creatures family
	App.register('Creature',        4);

	App.register('All Creatures', 4, 0);
	App.register('Norn',          4, 1);
	App.register('Grendel',       4, 2);
	App.register('Ettin',         4, 3);
	App.register('Geat',          4, 4);
};