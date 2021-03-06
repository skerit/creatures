var Extractor = require('binary-extractor'),
    Blast = __Protoblast,
    Nr = Blast.Bound.Number,
    Fn = Blast.Collection.Function;

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Genome class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {CreaturesApplication}   app
 * @param    {String}                 path
 */
var Genome = Fn.inherits('Develry.Creatures.Base', function Genome(app, path) {

	// The parent creatures app
	this.app = app;

	// The path to the file
	this.path = path;

	// The genes
	this.genes = [];
});

/**
 * Possible genetypes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Genome.setProperty('types', {
	'00' : {
		name : 'Brain lobe',
		data : [
			// General
			'x',
			'y',
			'width',
			'height',
			'perception',
			// Cell body
			'threshold',
			'leakage',
			'rest_state',
			'input_gain',
			{name: 'state', length: 8},
			'winner_takes_all',

			'__skip__'
			//{name: 'dendrite_0', length: 47},
			//{name: 'dendrite_1', length: 47}
		]
	},
	'01' : {
		name : 'Brain organ',
		data : [
			'clock_rate',
			'life_force_repair_rate',
			'life_force_start',
			'biotick_start',
			'atp_damage_coefficient'
		]
	},
	'10' : {
		name : 'Receptor',
		data : [
			'organ',
			'tissue',
			'locus',
			'chemical',
			'threshold',
			'nominal',
			'gain',
			'flags'
		]
	},
	'11' : {
		name : 'Emitter',
		data : [
			'organ',
			'tissue',
			'locus',
			'chemical',
			'threshold',
			'sample_rate',
			'gain',
			'flags'
		]
	},
	'12' : {
		name : 'Chemical reaction',
		data : [
			'l1a', 'l1c',
			'l2a', 'l2c',
			'r1a', 'r1c',
			'r2a', 'r2c',
			'reaction_rate'
		]
	},
	'13' : {
		name : 'Half lives',
		data : [
			{name: 'values', length: 256}
		]
	},
	'14' : {
		name : 'Initial concentration',
		data : [
			'chemical',
			'amount'
		]
	},
	'20' : {
		name : 'Stimulus',
		data : [
			'type',
			'significance',
			'sensory_neuron',
			'intensity',
			{name: 'flags', values: ['modulate', 'neuron_offset', 'sensed_when_asleep']},
			'chemical_1',
			'chemical_1_amount',
			'chemical_2',
			'chemical_2_amount',
			'chemical_3',
			'chemical_3_amount',
			'chemical_4',
			'chemical_4_amount'
		]
	},
	'21' : {
		name : 'Genus',
		data : [
			{name: 'species', values: ['norn', 'grendel', 'ettin', 'shee']},
			{name: 'mother_moniker', length: 4},
			{name: 'father_moniker', length: 4}
		]
	},
	'22' : {
		name : 'Appearance',
		data : [
			{name: 'body_part', values: ['head', 'body', 'leg', 'arm', 'tail']},
			'breed',
			'species'
		]
	},
	'23' : {
		name : 'Pose',
		data : [
			'pose_number',
			{name: 'pose_string', length: 15}
		]
	},
	'24' : {
		name : 'Gait',
		data : [
			'gait_number',
			'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'
		]
	},
	'25' : {
		name : 'Instinct',
		data : [
			'lobe_nr_1',
			'cell_nr_1',
			'lobe_nr_2',
			'cell_nr_2',
			'lobe_nr_3',
			'cell_nr_3',
			'creature_action',
			'reward_or_punish',
			'amount'
		]
	},
	'26' : {
		name : 'Pigment',
		data : [
			{name: 'color', values: ['red', 'green', 'blue']},
			'intensity'
		]
	},
	'27' : {
		name : 'Pigment bleed',
		data : [
			'rotation',
			'swap'
		]
	},
	'30' : {
		name : 'Organ',
		data : [
			'clock_rate',
			'life_force_repair_rate',
			'life_force_start',
			'biotick_start',
			'atp_damage_coefficient'
		]
	}
});

/**
 * Read the file and process it
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.8
 *
 * @param    {Boolean}  refresh
 * @param    {Function} callback
 */
Genome.setMethod(function load(refresh, callback) {

	var that = this;

	if (typeof refresh == 'function') {
		callback = refresh;
		refresh = false;
	}

	if (!callback) {
		callback = Fn.Thrower;
	}

	// Callback if this has already been loaded and a refresh is not needed
	if (this.loaded && !refresh) {
		return Blast.setImmediate(function immediate() {
			callback(null);
		});
	}

	if (!this.path) {
		return callback(new Error('Can not load genome: no path given'));
	}

	this.readFile(this.path, function gotFileBuffer(err, buffer) {

		if (err) {
			return callback(err);
		}

		// Process the buffer
		that.processBuffer(buffer);

		that.loaded = true;

		return callback(null);
	});
});

/**
 * Process the buffer
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.6
 *
 * @param    {Buffer|Extractor}   buffer
 * @param    {Boolean}            from_export   Is this buffer from an export file?
 *
 * @return   {Number}   The next index in the buffer that isn't a gene
 */
Genome.setMethod(function processBuffer(buffer, from_export) {

	var gene,
	    temp,
	    gen;

	if (Buffer.isBuffer(buffer)) {
		gen = new Extractor(buffer)
	} else {
		gen = buffer;
		buffer = gen.buffer;
	}

	if (!from_export) {
		// Get the header first
		temp = gen.readBytes(3).toString();

		if (temp != 'dna') {
			throw new Error('Can\'t read file: not a genome');
		}

		// Get the version of the genome file
		this.version = Number(gen.readBytes(1).toString());
	} else {
		// Jump to the first gene part after the CGenome string
		gen.index = buffer.indexOf('gene', buffer.indexOf('CGenome'));
	}

	// Reset the genes array
	this.genes.length = 0;

	// Consume the buffer
	while ((temp = gen.readBytes(4).toString()) == 'gene') {

		// Get the gene header
		gene = {
			// 00, 01, 02 or 03
			type            : gen.readByte(),
			subtype         : gen.readByte(),

			// Specific gene within a type/subtype category
			sequence        : gen.readByte(),

			// Appears to indicate a duplicate gene
			duplicate       : gen.readByte(),

			// The "switch-on" time for the gene
			stage           : gen.readByte(),

			// Contains sex dependence, mutability & dormancy
			flags           : gen.readByte(),
			mutation_chance : gen.readByte()
		};

		// Extract the flags
		gene.mutable     = Nr.bitAt(gene.flags, 0);
		gene.duplicable  = Nr.bitAt(gene.flags, 1);
		gene.deletable   = Nr.bitAt(gene.flags, 2);
		gene.male_only   = Nr.bitAt(gene.flags, 3);
		gene.female_only = Nr.bitAt(gene.flags, 4);
		gene.dormant     = Nr.bitAt(gene.flags, 5);

		gene.male = gene.male_only || gene.female_only == 0;
		gene.female = gene.female_only || gene.male_only == 0;

		// Now get the data itself
		gene.data = this.extractGeneData(gene, gen);

		this.genes.push(gene);
	}

	if (this.genes.length < 50) {
		console.warn('Too few genes found');
	}

	return gen.index - 4;
});

/**
 * Extract gene data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.4
 *
 * @param    {Object}          header
 * @param    {BinaryExtractor} gen
 */
Genome.setMethod(function extractGeneData(header, gen) {

	var typestr = String(header.type) + String(header.subtype),
	    result = {},
	    piece,
	    info,
	    temp,
	    i;

	// Get the name of the type of this gene
	info = this.types[typestr];

	if (!info) {
		this.log('error', 'Unable to find info on gene type', typestr);
		console.info('Header of unknown gene:', header);
		return;
	}

	// Get the name
	header.name = info.name;

	for (i = 0; i < info.data.length; i++) {
		piece = info.data[i];

		// If it's just a string, only 1 byte is needed
		if (typeof piece == 'string') {

			if (piece == '__skip__') {
				temp = gen.after('gene');

				if (temp != -1) {
					gen.index -= 4;
				}
			} else {
				result[piece] = gen.readByte();
			}
		} else {
			if (piece.length) {
				result[piece.name] = gen.readBytes(piece.length);
			} else {
				temp = gen.readByte();
				result[piece.name] = temp;

				// Add the value name
				if (piece.values) {
					result[piece.name + '_name'] = piece.values[temp];
				}
			}
		}
	}

	return result;
});

/**
 * Get all genes of a specific type
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   name
 *
 * @return   {Array}
 */
Genome.setMethod(function getGenesOfName(name) {

	var result = [],
	    gene,
	    i;

	for (i = 0; i < this.genes.length; i++) {
		gene = this.genes[i];

		if (gene.name == name) {
			result.push(gene);
		}
	}

	return result;
});

/**
 * Get pigment info
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.4
 *
 * @return   {Object}
 */
Genome.setMethod(function getPigmentInfo(creature) {

	var intensity,
	    result = {},
	    genes,
	    gene,
	    r,
	    g,
	    b,
	    i;

	// Get the pigment genes
	genes = this.getGenesOfName('Pigment');

	// Prepare the rgb arrays
	r = [];
	g = [];
	b = [];

	for (i = 0; i < genes.length; i++) {
		gene = genes[i];

		if (creature) {
			// Skip genes that are not for this gender
			if ((creature.male && !gene.male) || (creature.female && !gene.female)) {
				continue;
			}
		}

		// Skip dormant genes
		if (gene.dormant) {
			continue;
		}

		if (gene.data && gene.data.color_name) {
			intensity = 1 + (0.125 * ((gene.data.intensity - 128) / 128));

			switch (gene.data.color_name) {
				case 'red':
					r.push(intensity);
					break;

				case 'green':
					g.push(intensity);
					break;

				case 'blue':
					b.push(intensity);
					break;
			}
		}
	}

	if (r.length) {
		r = Creatures.S16.meanReduce(r);
	} else {
		r = 1;
	}

	if (g.length) {
		g = Creatures.S16.meanReduce(g);
	} else {
		g = 1;
	}

	if (b.length) {
		b = Creatures.S16.meanReduce(b);
	} else {
		b = 1;
	}

	result = {
		r : r,
		g : g,
		b : b
	};

	return result;
});

/**
 * Get pigment bleed info
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.4
 * @version  0.2.4
 *
 * @return   {Object}
 */
Genome.setMethod(function getPigmentBleedInfo(creature) {

	var result = [],
	    rotations = [],
	    swaps = [],
	    genes,
	    gene,
	    i;

	// Get the pigment genes
	genes = this.getGenesOfName('Pigment bleed');

	for (i = 0; i < genes.length; i++) {
		gene = genes[i];

		if (creature) {
			// Skip genes that are not for this gender
			if ((creature.male && !gene.male) || (creature.female && !gene.female)) {
				continue;
			}
		}

		// Skip dormant genes
		if (gene.dormant) {
			continue;
		}

		if (gene.data) {
			result.push(gene.data);

			// Calculate the rotation coefficient
			gene.data.rotation_coef = (0.33 * ((gene.data.rotation - 128) / 128));

			if (gene.data.rotation >= 128) {
				gene.data.abs_rot = gene.data.rotation - 128;
			} else {
				gene.data.abs_rot = 128 - gene.data.rotation;
			}

			gene.data.inv_rot = 127 - gene.data.abs_rot;

			// Calculate the swap coefficient
			gene.data.swap_coef = Math.abs(1 * ((gene.data.swap - 128) / 128));

			if (gene.data.swap >= 128) {
				gene.data.abs_swap = gene.data.swap - 128;
			} else {
				gene.data.abs_swap = 128 - gene.data.swap;
			}

			gene.data.inv_swap = 127 - gene.data.abs_swap;
		}
	}

	return result;
});


/**
 * Get a specific body image of this creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.4
 *
 * @param    {Export|Creature}   creature
 * @param    {String}            part_name    The body part type
 * @param    {Function}          callback
 *
 * @return   {Creatures.S16}
 */
Genome.setMethod(function getBodyPartImage(creature, part_name, callback) {

	var that = this,
	    breed_char,
	    filename,
	    try_age,
	    prefix,
	    parts,
	    genes,
	    gene,
	    s16,
	    i;

	parts = {
		head             : 'A',
		body             : 'B',
		left_thigh       : 'C',
		left_shin        : 'D',
		left_foot        : 'E',
		right_thigh      : 'F',
		right_shin       : 'G',
		right_foot       : 'H',

		left_humerus     : 'I',
		left_upper_arm   : 'I',

		left_radius      : 'J',
		left_forearm     : 'J',

		right_radius     : 'K',
		right_forearm    : 'K',

		// Tails are not in C1
		tail_root        : 'M',
		tail_tip         : 'N',

		// Ears & hair are present in CV
		// but supported in DS
		left_ear         : 'O',
		right_ear        : 'P',
		hair             : 'Q'
	};

	// The first char of the filename is the body part
	prefix = parts[part_name];

	// Get the appearance genes
	genes = that.getGenesOfName('Appearance');

	for (i = 0; i < genes.length; i++) {
		gene = genes[i];

		if (gene.data.body_part_name == part_name) {
			break;
		} else {
			gene = null
		}
	}

	if (!gene) {
		console.warn('Could not find', part_name, 'gene in', genes, this);

		return callback(null);
	}

	// Add the species number
	if (creature.female) {
		prefix += (gene.data.species + 4);
	} else {
		prefix += gene.data.species;
	}

	// Not all lifestages are available,
	// try with the current one first
	try_age = creature.agen || 0;

	// The last part of the filename is the breed character
	breed_char = String.fromCharCode(65 + gene.data.breed);

	// The filename we want
	filename = prefix + try_age + breed_char + '.s16';

	// Create the s16 instance
	s16 = new Creatures.S16(that.app, filename);

	// Set the pigment info
	s16.setPigment(this.getPigmentInfo(creature));
	s16.setPigmentBleed(this.getPigmentBleedInfo(creature));

	s16.load(function loaded(err) {

		if (err) {

			if (err.code == 'ENOENT' && try_age > 0) {
				try_age--;

				// Construct the new filename of a lower lifestage
				// (Ettins for example only have sprites for lifestage 0)
				filename = prefix + try_age + breed_char + '.s16';

				s16 = new Creatures.S16(that.app, filename);

				return s16.load(loaded);
			}

			return callback(err);
		}

		callback(null, s16);
	});

	return s16;
});

module.exports = Genome;