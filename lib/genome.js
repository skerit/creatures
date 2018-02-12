var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    Extractor = require('binary-extractor'),
    Genome,
    fs = require('fs'),
    Fn = Blast.Collection.Function;

/**
 * The Genome class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {CreaturesApplication}   app
 * @param    {String}                 path
 */
Genome = Fn.inherits('Informer', 'Develry.Creatures', function Genome(app, path) {

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
			'x',
			'y',
			'width',
			'height',
			'perception',
			'threshold',
			'leakage',
			'rest_state',
			'input_gain',
			{name: 'state', length: 12},
			'flags',
			{name: 'dendrite_0', length: 21},
			{name: 'dendrite_1', length: 21}
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
			'chemical',
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
 * @version  0.1.0
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

	fs.readFile(this.path, function gotFileBuffer(err, buffer) {

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
 * @version  0.1.0
 *
 * @param    {Buffer}   buffer
 */
Genome.setMethod(function processBuffer(buffer) {

	var gene,
	    temp,
	    gen = new Extractor();

	gen.setBuffer(buffer);

	// Get the header first
	temp = gen.readBytes(3).toString();

	if (temp != 'dna') {
		throw new Error('Can\'t read file: not a genome');
	}

	// Get the version of the genome file
	this.version = Number(gen.readBytes(1).toString());

	// Reset the genes array
	this.genes.length = 0;

	// Consume the buffer
	while ((temp = gen.readBytes(4).toString()) == 'gene') {

		// Get the gene header
		gene = {
			type            : gen.readByte(),
			subtype         : gen.readByte(),
			sequence        : gen.readByte(),
			duplicate       : gen.readByte(),
			stage           : gen.readByte(),
			flags           : gen.readByte(),
			mutation_chance : gen.readByte()
		};

		// Now get the data itself
		gene.data = this.extractGeneData(gene, gen);

		this.genes.push(gene);
	}
});

/**
 * Extract gene data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
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

	// Get the name
	header.name = info.name;

	for (i = 0; i < info.data.length; i++) {
		piece = info.data[i];

		// If it's just a string, only 1 byte is needed
		if (typeof piece == 'string') {
			result[piece] = gen.readByte();
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

module.exports = Genome;