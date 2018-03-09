var Extractor = require('binary-extractor'),
    Blast = __Protoblast,
    Fn = Blast.Collection.Function;

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Chemistry class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {CreaturesApplication}   app
 */
var Chemistry = Fn.inherits('Develry.Creatures.Base', function Chemistry(app) {

	// The parent creatures app
	this.app = app;

	// The chemical info
	this.chemicals = [];
});

/**
 * The chemicals of a creature
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @type     {Array}
 */
Chemistry.setStatic('chemicals', [
	{
		index       : 0,
		name        : 'null',
		group       : '',
		title       : 'null',
		description : ''
	},
	{
		index       : 1,
		name        : 'pain',
		group       : 'drive_levels',
		title       : 'Pain',
		description : ''
	},
	{
		index       : 2,
		name        : 'need_for_pleasure',
		group       : 'drive_levels',
		title       : 'Need for Pleasure',
		description : ''
	},
	{
		index       : 3,
		name        : 'hunger',
		group       : 'drive_levels',
		title       : 'Hunger',
		description : ''
	},
	{
		index       : 4,
		name        : 'coldness',
		group       : 'drive_levels',
		title       : 'Coldness',
		description : ''
	},
	{
		index       : 5,
		name        : 'hotness',
		group       : 'drive_levels',
		title       : 'Hotness',
		description : ''
	},
	{
		index       : 6,
		name        : 'tiredness',
		group       : 'drive_levels',
		title       : 'Tiredness',
		description : ''
	},
	{
		index       : 7,
		name        : 'sleepiness',
		group       : 'drive_levels',
		title       : 'Sleepiness',
		description : ''
	},
	{
		index       : 8,
		name        : 'loneliness',
		group       : 'drive_levels',
		title       : 'Loneliness',
		description : ''
	},
	{
		index       : 9,
		name        : 'crowded',
		group       : 'drive_levels',
		title       : 'Crowded',
		description : ''
	},
	{
		index       : 10,
		name        : 'fear',
		group       : 'drive_levels',
		title       : 'Fear',
		description : ''
	},
	{
		index       : 11,
		name        : 'boredom',
		group       : 'drive_levels',
		title       : 'Boredom',
		description : ''
	},
	{
		index       : 12,
		name        : 'anger',
		group       : 'drive_levels',
		title       : 'Anger',
		description : ''
	},
	{
		index       : 13,
		name        : 'sex_drive',
		group       : 'drive_levels',
		title       : 'Sex Drive',
		description : ''
	},
	{
		index       : 14,
		name        : 'injury',
		group       : 'drive_levels',
		title       : 'Injury',
		description : ''
	},
	{
		index       : 15,
		name        : 'suffocation',
		group       : 'drive_levels',
		title       : 'Suffocation',
		description : ''
	},
	{
		index       : 16,
		name        : 'thirst',
		group       : 'drive_levels',
		title       : 'Thirst',
		description : ''
	},
	{
		index       : 17,
		name        : 'stress',
		group       : 'drive_levels',
		title       : 'Stress',
		description : ''
	},
	{
		index       : 18,
		name        : 'pain_increase',
		group       : 'drive_raising',
		title       : 'Pain Increase',
		description : ''
	},
	{
		index       : 19,
		name        : 'need_for_pleasure_increase',
		group       : 'drive_raising',
		title       : 'Need for Pleasure Increase',
		description : ''
	},
	{
		index       : 20,
		name        : 'hunger_increase',
		group       : 'drive_raising',
		title       : 'Hunger Increase',
		description : ''
	},
	{
		index       : 21,
		name        : 'coldness_increase',
		group       : 'drive_raising',
		title       : 'Coldness Increase',
		description : ''
	},
	{
		index       : 22,
		name        : 'hotness_increase',
		group       : 'drive_raising',
		title       : 'Hotness Increase',
		description : ''
	},
	{
		index       : 23,
		name        : 'tiredness_increase',
		group       : 'drive_raising',
		title       : 'Tiredness Increase',
		description : ''
	},
	{
		index       : 24,
		name        : 'sleepiness_increase',
		group       : 'drive_raising',
		title       : 'Sleepiness Increase',
		description : ''
	},
	{
		index       : 25,
		name        : 'loneliness_increase',
		group       : 'drive_raising',
		title       : 'Loneliness Increase',
		description : ''
	},
	{
		index       : 26,
		name        : 'crowded_increase',
		group       : 'drive_raising',
		title       : 'Crowded Increase',
		description : ''
	},
	{
		index       : 27,
		name        : 'fear_increase',
		group       : 'drive_raising',
		title       : 'Fear Increase',
		description : ''
	},
	{
		index       : 28,
		name        : 'boredom_increase',
		group       : 'drive_raising',
		title       : 'Boredom Increase',
		description : ''
	},
	{
		index       : 29,
		name        : 'anger_increase',
		group       : 'drive_raising',
		title       : 'Anger Increase',
		description : ''
	},
	{
		index       : 30,
		name        : 'sex_drive_increase',
		group       : 'drive_raising',
		title       : 'Sex Drive Increase',
		description : ''
	},
	{
		index       : 31,
		name        : 'injury_increase',
		group       : 'drive_raising',
		title       : 'Injury Increase',
		description : ''
	},
	{
		index       : 32,
		name        : 'suffocation_increase',
		group       : 'drive_raising',
		title       : 'Suffocation Increase',
		description : ''
	},
	{
		index       : 33,
		name        : 'thirst_increase',
		group       : 'drive_raising',
		title       : 'Thirst Increase',
		description : ''
	},
	{
		index       : 34,
		name        : 'stress_increase',
		group       : 'drive_raising',
		title       : 'Stress Increase',
		description : ''
	},
	{
		index       : 35,
		name        : 'pain_decrease',
		group       : 'drive_reducing',
		title       : 'Pain Decrease',
		description : ''
	},
	{
		index       : 36,
		name        : 'need_for_pleasure_decrease',
		group       : 'drive_reducing',
		title       : 'Need for Pleasure Decrease',
		description : ''
	},
	{
		index       : 37,
		name        : 'hunger_decrease',
		group       : 'drive_reducing',
		title       : 'Hunger Decrease',
		description : ''
	},
	{
		index       : 38,
		name        : 'coldness_decrease',
		group       : 'drive_reducing',
		title       : 'Coldness Decrease',
		description : ''
	},
	{
		index       : 39,
		name        : 'hotness_decrease',
		group       : 'drive_reducing',
		title       : 'Hotness Decrease',
		description : ''
	},
	{
		index       : 40,
		name        : 'tiredness_decrease',
		group       : 'drive_reducing',
		title       : 'Tiredness Decrease',
		description : ''
	},
	{
		index       : 41,
		name        : 'sleepiness_decrease',
		group       : 'drive_reducing',
		title       : 'Sleepiness Decrease',
		description : ''
	},
	{
		index       : 42,
		name        : 'loneliness_decrease',
		group       : 'drive_reducing',
		title       : 'Loneliness Decrease',
		description : ''
	},
	{
		index       : 43,
		name        : 'crowded_decrease',
		group       : 'drive_reducing',
		title       : 'Crowded Decrease',
		description : ''
	},
	{
		index       : 44,
		name        : 'fear_decrease',
		group       : 'drive_reducing',
		title       : 'Fear Decrease',
		description : ''
	},
	{
		index       : 45,
		name        : 'boredom_decrease',
		group       : 'drive_reducing',
		title       : 'Boredom Decrease',
		description : ''
	},
	{
		index       : 46,
		name        : 'anger_decrease',
		group       : 'drive_reducing',
		title       : 'Anger Decrease',
		description : ''
	},
	{
		index       : 47,
		name        : 'sex_drive_decrease',
		group       : 'drive_reducing',
		title       : 'Sex Drive Decrease',
		description : ''
	},
	{
		index       : 48,
		name        : 'injury_decrease',
		group       : 'drive_reducing',
		title       : 'Injury Decrease',
		description : ''
	},
	{
		index       : 49,
		name        : 'suffocation_decrease',
		group       : 'drive_reducing',
		title       : 'Suffocation Decrease',
		description : ''
	},
	{
		index       : 50,
		name        : 'thirst_decrease',
		group       : 'drive_reducing',
		title       : 'Thirst Decrease',
		description : ''
	},
	{
		index       : 51,
		name        : 'stress_decrease',
		group       : 'drive_reducing',
		title       : 'Stress Decrease',
		description : ''
	},
	{
		index       : 52,
		name        : 'reward',
		group       : 'brain',
		title       : 'Reward',
		description : 'Learning reinforcer'
	},
	{
		index       : 53,
		name        : 'punishment',
		group       : 'brain',
		title       : 'Punishment',
		description : 'Learning reinforcer'
	},
	{
		index       : 54,
		name        : 'reinforcement',
		group       : 'brain',
		title       : 'Reinforcement',
		description : 'Both punishment and reward chems decay to produce this short-life chemical. It allows eg. concept space dens to get stronger when ANY form of reinforcement occurs'
	},
	{
		index       : 55,
		name        : 'con_ash',
		group       : 'brain',
		title       : 'ConASH',
		description : 'Concept layer Atrophy Suppressing Hormone'
	},
	{
		index       : 56,
		name        : 'dec_ash1',
		group       : 'brain',
		title       : 'DecASH1',
		description : 'Decision layer Atrophy Suppressing Hormone'
	},
	{
		index       : 57,
		name        : 'reward_echo',
		group       : 'brain',
		title       : 'Reward Echo',
		description : 'Reward chem must decay rapidly, this longer lasting chem is generated during that decay'
	},
	{
		index       : 58,
		name        : 'punish_echo',
		group       : 'brain',
		title       : 'Punish Echo',
		description : 'Punishment chem must decay rapidly, this longer lasting chem is generated during that decay'
	},
	{
		index       : 59,
		name        : 'dec_ash2',
		group       : 'brain',
		title       : 'DecASH2',
		description : 'Decision layer Atrophy Suppressing Hormone'
	},
	{
		index       : 60,
		name        : '60',
		group       : '',
		title       : '60',
		description : ''
	},
	{
		index       : 61,
		name        : '61',
		group       : '',
		title       : '61',
		description : ''
	},
	{
		index       : 62,
		name        : '62',
		group       : '',
		title       : '62',
		description : ''
	},
	{
		index       : 63,
		name        : '63',
		group       : '',
		title       : '63',
		description : ''
	},
	{
		index       : 64,
		name        : '64',
		group       : '',
		title       : '64',
		description : ''
	},
	{
		index       : 65,
		name        : '65',
		group       : '',
		title       : '65',
		description : ''
	},
	{
		index       : 66,
		name        : '66',
		group       : '',
		title       : '66',
		description : ''
	},
	{
		index       : 67,
		name        : '67',
		group       : '',
		title       : '67',
		description : ''
	},
	{
		index       : 68,
		name        : 'lactate',
		group       : 'digestive',
		title       : 'Lactate',
		description : 'Product of fermentation of pyruvate. Causes muscle burn'
	},
	{
		index       : 69,
		name        : 'pyruvate',
		group       : 'digestive',
		title       : 'Pyruvate',
		description : 'An intermediate, the product of anaerobic respiration'
	},
	{
		index       : 70,
		name        : 'glucose',
		group       : 'digestive',
		title       : 'Glucose',
		description : 'Produced from starch and in a reversible reaction from glycogen. Used up by muscle action'
	},
	{
		index       : 71,
		name        : 'fatty_acid',
		group       : 'digestive',
		title       : 'Fatty Acid',
		description : 'Building Block'
	},
	{
		index       : 72,
		name        : 'glycogen',
		group       : 'digestive',
		title       : 'Glycogen',
		description : 'Short-term energy reserve, produced in reversible reaction from glucose. Produces glucose to replenish supplies for muscle action'
	},
	{
		index       : 73,
		name        : 'starch',
		group       : 'digestive',
		title       : 'Starch',
		description : 'Emitted by food objects - converts to Glucose for energy. Does NOT decrease hunger'
	},
	{
		index       : 74,
		name        : 'fat',
		group       : 'digestive',
		title       : 'Fat',
		description : 'Food source of Fatty Acid'
	},
	{
		index       : 75,
		name        : 'adipose_tissue',
		group       : 'digestive',
		title       : 'Adipose Tissue',
		description : 'High-density Carbon Storage in Albian Lifeforms'
	},
	{
		index       : 76,
		name        : 'life',
		group       : 'digestive',
		title       : 'Life',
		description : 'Decays over time, switching on receptors to change the stage of life from embryo through to senile'
	},
	{
		index       : 77,
		name        : 'muscle_tissue',
		group       : 'digestive',
		title       : 'Muscle Tissue',
		description : 'Amino Acid storage'
	},
	{
		index       : 78,
		name        : 'triglyceride',
		group       : 'digestive',
		title       : 'Triglyceride',
		description : 'First step in forming Adipose Tissue'
	},
	{
		index       : 79,
		name        : 'protein',
		group       : 'digestive',
		title       : 'Protein',
		description : 'Food source of Amino Acid'
	},
	{
		index       : 80,
		name        : 'amino_acid',
		group       : 'digestive',
		title       : 'Amino Acid',
		description : 'Building Block'
	},
	{
		index       : 81,
		name        : '81',
		group       : 'digestive',
		title       : '81',
		description : ''
	},
	{
		index       : 82,
		name        : '82',
		group       : 'digestive',
		title       : '82',
		description : ''
	},
	{
		index       : 83,
		name        : '83',
		group       : 'digestive',
		title       : '83',
		description : ''
	},
	{
		index       : 84,
		name        : '84',
		group       : 'digestive',
		title       : '84',
		description : ''
	},
	{
		index       : 85,
		name        : '85',
		group       : 'digestive',
		title       : '85',
		description : ''
	},
	{
		index       : 86,
		name        : '86',
		group       : 'digestive',
		title       : '86',
		description : ''
	},
	{
		index       : 87,
		name        : '87',
		group       : 'digestive',
		title       : '87',
		description : ''
	},
	{
		index       : 88,
		name        : '88',
		group       : 'digestive',
		title       : '88',
		description : ''
	},
	{
		index       : 89,
		name        : '89',
		group       : 'digestive',
		title       : '89',
		description : ''
	},
	{
		index       : 90,
		name        : 'dissolved_carbon_dioxide',
		group       : 'respiration',
		title       : 'Dissolved carbon dioxide',
		description : 'Waste product from the conversion of glucose to energy. May deplete naturally, or may cause behaviour changes'
	},
	{
		index       : 91,
		name        : '91',
		group       : 'respiration',
		title       : '91',
		description : ''
	},
	{
		index       : 92,
		name        : 'urea',
		group       : 'respiration',
		title       : 'Urea',
		description : 'Non-toxic product of Carbon Dioxide and Ammonia'
	},
	{
		index       : 93,
		name        : 'ammonia',
		group       : 'respiration',
		title       : 'Ammonia',
		description : 'Toxic product of using Amino Acid for fuel'
	},
	{
		index       : 94,
		name        : '94',
		group       : 'respiration',
		title       : '94',
		description : ''
	},
	{
		index       : 95,
		name        : 'oxygen',
		group       : 'respiration',
		title       : 'Oxygen',
		description : 'Vital Gas'
	},
	{
		index       : 96,
		name        : 'air',
		group       : 'respiration',
		title       : 'Air',
		description : 'Signals Breathable Air'
	},
	{
		index       : 97,
		name        : 'water',
		group       : 'respiration',
		title       : 'Water',
		description : 'Vital Fluid'
	},
	{
		index       : 98,
		name        : 'energy',
		group       : 'respiration',
		title       : 'Energy',
		description : 'Phosphorylation Cycle'
	},
	{
		index       : 99,
		name        : 'atp',
		group       : 'respiration',
		title       : 'ATP',
		description : 'High-Energy side of Phosphate Chemistry'
	},
	{
		index       : 100,
		name        : 'adp',
		group       : 'respiration',
		title       : 'ADP',
		description : 'Low-Energy side of Phosphate Chemistry'
	},
	{
		index       : 101,
		name        : 'myoglobin',
		group       : 'respiration',
		title       : 'Myoglobin',
		description : 'oxygen transporting chemical'
	},
	{
		index       : 102,
		name        : 'oxymyoglobin',
		group       : 'respiration',
		title       : 'Oxymyoglobin',
		description : 'oxygen transporting chemical, with oxygen'
	},
	{
		index       : 103,
		name        : '103',
		group       : 'respiration',
		title       : '103',
		description : ''
	},
	{
		index       : 104,
		name        : 'bilin',
		group       : 'respiration',
		title       : 'Bilin',
		description : 'Signal to produce bile acid'
	},
	{
		index       : 105,
		name        : 'oestrogen',
		group       : 'fertility_and_social',
		title       : 'Oestrogen',
		description : 'Controls fertility cycle in females'
	},
	{
		index       : 106,
		name        : 'testosterone',
		group       : 'fertility_and_social',
		title       : 'Testosterone',
		description : 'Controls fertility in males'
	},
	{
		index       : 107,
		name        : 'gonadotrophin',
		group       : 'fertility_and_social',
		title       : 'Gonadotrophin',
		description : 'Produced immediately in large quantities when pregnant. Used to eg. suppress menstrual cycle'
	},
	{
		index       : 108,
		name        : 'progesterone',
		group       : 'fertility_and_social',
		title       : 'Progesterone',
		description : 'Produced progressively during pregnancy. When it reaches a threshold, it fires a receptor to cause the egg to be laid'
	},
	{
		index       : 109,
		name        : 'inhibin',
		group       : 'fertility_and_social',
		title       : 'Inhibin',
		description : 'Testosterone feedback'
	},
	{
		index       : 110,
		name        : 'lh',
		group       : 'fertility_and_social',
		title       : 'LH',
		description : 'Signals Ovulation'
	},
	{
		index       : 111,
		name        : 'fsh',
		group       : 'fertility_and_social',
		title       : 'FSH',
		description : 'Controls oestrogen production'
	},
	{
		index       : 112,
		name        : 'steroidone',
		group       : 'fertility_and_social',
		title       : 'Steroidone',
		description : 'Idealized signal to make steroids from fatty acids'
	},
	{
		index       : 113,
		name        : 'cholesterol',
		group       : 'fertility_and_social',
		title       : 'Cholesterol',
		description : 'Vital Steroid'
	},
	{
		index       : 114,
		name        : 'arousal_potential',
		group       : 'fertility_and_social',
		title       : 'Arousal Potential',
		description : 'Biological readiness to mate'
	},
	{
		index       : 115,
		name        : 'mating_pheromone',
		group       : 'fertility_and_social',
		title       : 'Mating Pheromone',
		description : 'Turns potential arousal into arousal (sex drive)'
	},
	{
		index       : 116,
		name        : 'species_pheromone',
		group       : 'fertility_and_social',
		title       : 'Species Pheromone',
		description : 'Species recognition signal'
	},
	{
		index       : 117,
		name        : 'parent_pheromone',
		group       : 'fertility_and_social',
		title       : 'Parent Pheromone',
		description : 'Parental recognition signal'
	},
	{
		index       : 118,
		name        : 'child_pheromone',
		group       : 'fertility_and_social',
		title       : 'Child Pheromone',
		description : 'Child recognition signal'
	},
	{
		index       : 119,
		name        : 'sibling_pheromone',
		group       : 'fertility_and_social',
		title       : 'Sibling Pheromone',
		description : 'Sibling recognition signal'
	},
	{
		index       : 120,
		name        : 'opposite_sex_pheromone',
		group       : 'fertility_and_social',
		title       : 'Opposite Sex Pheromone',
		description : 'Opposite sex recognition signal'
	},
	{
		index       : 121,
		name        : 'norn_smell',
		group       : 'fertility_and_social',
		title       : 'Norn Smell',
		description : 'A signal that a Norn is near'
	},
	{
		index       : 122,
		name        : 'grendel_smell',
		group       : 'fertility_and_social',
		title       : 'Grendel smell',
		description : 'A signal that a Grendel is near'
	},
	{
		index       : 123,
		name        : 'ettin_smell',
		group       : 'fertility_and_social',
		title       : 'Ettin smell',
		description : 'A signal that an Ettin is near'
	},
	{
		index       : 124,
		name        : '124',
		group       : '',
		title       : '124',
		description : ''
	},
	{
		index       : 125,
		name        : '125',
		group       : '',
		title       : '125',
		description : ''
	},
	{
		index       : 126,
		name        : '126',
		group       : '',
		title       : '126',
		description : ''
	},
	{
		index       : 127,
		name        : '127',
		group       : '',
		title       : '127',
		description : ''
	},
	{
		index       : 128,
		name        : '128',
		group       : '',
		title       : '128',
		description : ''
	},
	{
		index       : 129,
		name        : '129',
		group       : '',
		title       : '129',
		description : ''
	},
	{
		index       : 130,
		name        : '130',
		group       : '',
		title       : '130',
		description : ''
	},
	{
		index       : 131,
		name        : '131',
		group       : '',
		title       : '131',
		description : ''
	},
	{
		index       : 132,
		name        : '132',
		group       : '',
		title       : '132',
		description : ''
	},
	{
		index       : 133,
		name        : '133',
		group       : '',
		title       : '133',
		description : ''
	},
	{
		index       : 134,
		name        : '134',
		group       : '',
		title       : '134',
		description : ''
	},
	{
		index       : 135,
		name        : '135',
		group       : '',
		title       : '135',
		description : ''
	},
	{
		index       : 136,
		name        : '136',
		group       : '',
		title       : '136',
		description : ''
	},
	{
		index       : 137,
		name        : '137',
		group       : '',
		title       : '137',
		description : ''
	},
	{
		index       : 138,
		name        : '138',
		group       : '',
		title       : '138',
		description : ''
	},
	{
		index       : 139,
		name        : '139',
		group       : '',
		title       : '139',
		description : ''
	},
	{
		index       : 140,
		name        : 'heavy_metals',
		group       : 'poisons',
		title       : 'Heavy Metals',
		description : 'Lead, Thallium, etc'
	},
	{
		index       : 141,
		name        : 'cyanide',
		group       : 'poisons',
		title       : 'Cyanide',
		description : 'Any chemical containing cyanide anion'
	},
	{
		index       : 142,
		name        : '142',
		group       : 'poisons',
		title       : '142',
		description : ''
	},
	{
		index       : 143,
		name        : 'belladonna',
		group       : 'poisons',
		title       : 'Belladonna',
		description : 'Weapon of the Deadly Nightshade'
	},
	{
		index       : 144,
		name        : 'geddonase',
		group       : 'poisons',
		title       : 'Geddonase',
		description : 'Toxin secreted by some insects in Albia'
	},
	{
		index       : 145,
		name        : 'glycotoxin',
		group       : 'poisons',
		title       : 'Glycotoxin',
		description : 'Extreme poison - breaks down glycogen'
	},
	{
		index       : 146,
		name        : 'fullness',
		group       : 'poisons',
		title       : 'Fullness',
		description : 'Negates hunger'
	},
	{
		index       : 147,
		name        : '147',
		group       : '',
		title       : '147',
		description : ''
	},
	{
		index       : 148,
		name        : '148',
		group       : '',
		title       : '148',
		description : ''
	},
	{
		index       : 149,
		name        : '149',
		group       : '',
		title       : '149',
		description : ''
	},
	{
		index       : 150,
		name        : 'vitamin_e',
		group       : 'cures',
		title       : 'Vitamin E',
		description : 'Fat Soluble vitamin, deficiency can cause infertility'
	},
	{
		index       : 151,
		name        : 'vitamin_c',
		group       : 'cures',
		title       : 'Vitamin C',
		description : 'Water soluble vitamin, used to maintain healthy connective tissue'
	},
	{
		index       : 152,
		name        : 'bile_acid',
		group       : 'cures',
		title       : 'Bile Acid',
		description : 'Aid to digestion'
	},
	{
		index       : 153,
		name        : 'insulin',
		group       : 'cures',
		title       : 'Insulin',
		description : 'Regulates storage of glucose'
	},
	{
		index       : 154,
		name        : 'glycogen_synthetase',
		group       : 'cures',
		title       : 'Glycogen Synthetase',
		description : 'Liver glycogen synthesis activity'
	},
	{
		index       : 155,
		name        : 'dehydrogenase',
		group       : 'cures',
		title       : 'Dehydrogenase',
		description : 'Detoxifies alcohol'
	},
	{
		index       : 156,
		name        : 'prostaglandin',
		group       : 'cures',
		title       : 'Prostaglandin',
		description : 'Speeds recovery from injury'
	},
	{
		index       : 157,
		name        : 'edta',
		group       : 'cures',
		title       : 'EDTA',
		description : 'Chelates heavy metals'
	},
	{
		index       : 158,
		name        : 'sodium_thiosulphite',
		group       : 'cures',
		title       : 'Sodium thiosulphite',
		description : 'Cure for cyanide poisoning'
	},
	{
		index       : 159,
		name        : 'arnica',
		group       : 'cures',
		title       : 'Arnica',
		description : 'Extract of arnica flower - cures glycotoxin poisoning'
	},
	{
		index       : 160,
		name        : '160',
		group       : '',
		title       : '160',
		description : ''
	},
	{
		index       : 161,
		name        : '161',
		group       : '',
		title       : '161',
		description : ''
	},
	{
		index       : 162,
		name        : '162',
		group       : '',
		title       : '162',
		description : ''
	},
	{
		index       : 163,
		name        : '163',
		group       : '',
		title       : '163',
		description : ''
	},
	{
		index       : 164,
		name        : '164',
		group       : '',
		title       : '164',
		description : ''
	},
	{
		index       : 165,
		name        : '165',
		group       : '',
		title       : '165',
		description : ''
	},
	{
		index       : 166,
		name        : '166',
		group       : '',
		title       : '166',
		description : ''
	},
	{
		index       : 167,
		name        : '167',
		group       : '',
		title       : '167',
		description : ''
	},
	{
		index       : 168,
		name        : 'tyrosine',
		group       : 'locomotion_and_digestion',
		title       : 'Tyrosine',
		description : 'Essential amino acid'
	},
	{
		index       : 169,
		name        : 'triptophan',
		group       : 'locomotion_and_digestion',
		title       : 'Triptophan',
		description : 'Essential amino acid'
	},
	{
		index       : 170,
		name        : 'alcohol',
		group       : 'locomotion_and_digestion',
		title       : 'Alcohol',
		description : 'Ingested from fermented fruit etc. Causes drunken gait and possible sickness'
	},
	{
		index       : 171,
		name        : 'dancing',
		group       : 'locomotion_and_digestion',
		title       : 'Dancing',
		description : 'Purple Mountain Norn music inebriation'
	},
	{
		index       : 172,
		name        : 'adrenaline',
		group       : 'locomotion_and_digestion',
		title       : 'Adrenaline',
		description : 'Natural adrenaline level builds up due to stress from excessive boredom, anger and suchlike. Has various deleterious effects on health'
	},
	{
		index       : 173,
		name        : 'hexokinase',
		group       : 'locomotion_and_digestion',
		title       : 'Hexokinase',
		description : 'Enzyme which increases ATP use as muscles build up'
	},
	{
		index       : 174,
		name        : 'activase',
		group       : 'locomotion_and_digestion',
		title       : 'Activase',
		description : 'Generated by Muscular Activity'
	},
	{
		index       : 175,
		name        : 'turnase',
		group       : 'locomotion_and_digestion',
		title       : 'Turnase',
		description : 'Generated by being Cornered'
	},
	{
		index       : 176,
		name        : 'collapsase',
		group       : 'locomotion_and_digestion',
		title       : 'Collapsase',
		description : 'Generated by Retreating'
	},
	{
		index       : 177,
		name        : 'downatrophin',
		group       : 'locomotion_and_digestion',
		title       : 'Downatrophin',
		description : 'Emitted on downslopes'
	},
	{
		index       : 178,
		name        : 'upatrophin',
		group       : 'locomotion_and_digestion',
		title       : 'Upatrophin',
		description : 'Emitted on upslopes'
	},
	{
		index       : 179,
		name        : 'glycolase',
		group       : 'locomotion_and_digestion',
		title       : 'Glycolase',
		description : 'Splits glucose to release energy during glycolysis'
	},
	{
		index       : 180,
		name        : 'protease',
		group       : 'locomotion_and_digestion',
		title       : 'Protease',
		description : 'Regulates muscle mass of norns'
	},
	{
		index       : 181,
		name        : '181',
		group       : '',
		title       : '181',
		description : ''
	},
	{
		index       : 182,
		name        : '182',
		group       : '',
		title       : '182',
		description : ''
	},
	{
		index       : 183,
		name        : '183',
		group       : '',
		title       : '183',
		description : ''
	},
	{
		index       : 184,
		name        : '184',
		group       : '',
		title       : '184',
		description : ''
	},
	{
		index       : 185,
		name        : '185',
		group       : '',
		title       : '185',
		description : ''
	},
	{
		index       : 186,
		name        : '186',
		group       : '',
		title       : '186',
		description : ''
	},
	{
		index       : 187,
		name        : '187',
		group       : '',
		title       : '187',
		description : ''
	},
	{
		index       : 188,
		name        : '188',
		group       : '',
		title       : '188',
		description : ''
	},
	{
		index       : 189,
		name        : '189',
		group       : '',
		title       : '189',
		description : ''
	},
	{
		index       : 190,
		name        : 'sea_ash1',
		group       : 'third_party',
		title       : 'SeaASH1',
		description : 'Nova Subterra Breed'
	},
	{
		index       : 191,
		name        : 'sea_ash2',
		group       : 'third_party',
		title       : 'SeaASH2',
		description : 'Nova Subterra Breed'
	},
	{
		index       : 192,
		name        : 'broodiness_increase',
		group       : 'third_party',
		title       : 'Broodiness increase',
		description : 'Kai Norn Breed'
	},
	{
		index       : 193,
		name        : 'broodiness_decrease',
		group       : 'third_party',
		title       : 'Broodiness decrease',
		description : 'Kai Norn Breed'
	},
	{
		index       : 194,
		name        : 'milk',
		group       : 'third_party',
		title       : 'Milk',
		description : 'Kai Norn Breed'
	},
	{
		index       : 195,
		name        : 'milk_biproducts',
		group       : 'third_party',
		title       : 'Milk Biproducts',
		description : 'Kai Norn Breed'
	},
	{
		index       : 196,
		name        : 'maternal_pheromone',
		group       : 'third_party',
		title       : 'Maternal Pheromone',
		description : 'Kai Norn Breed'
	},
	{
		index       : 197,
		name        : 'broodiness_echo',
		group       : 'third_party',
		title       : 'Broodiness echo',
		description : 'Kai Norn Breed'
	},
	{
		index       : 198,
		name        : 'oxytocin',
		group       : 'third_party',
		title       : 'Oxytocin',
		description : 'Kai Norn Breed'
	},
	{
		index       : 199,
		name        : 'broodiness',
		group       : 'third_party',
		title       : 'Broodiness',
		description : 'Kai Norn Breed'
	},
	{
		index       : 200,
		name        : '200',
		group       : '',
		title       : '200',
		description : ''
	},
	{
		index       : 201,
		name        : '201',
		group       : '',
		title       : '201',
		description : ''
	},
	{
		index       : 202,
		name        : '202',
		group       : '',
		title       : '202',
		description : ''
	},
	{
		index       : 203,
		name        : '203',
		group       : '',
		title       : '203',
		description : ''
	},
	{
		index       : 204,
		name        : '204',
		group       : '',
		title       : '204',
		description : ''
	},
	{
		index       : 205,
		name        : '205',
		group       : '',
		title       : '205',
		description : ''
	},
	{
		index       : 206,
		name        : '206',
		group       : '',
		title       : '206',
		description : ''
	},
	{
		index       : 207,
		name        : '207',
		group       : '',
		title       : '207',
		description : ''
	},
	{
		index       : 208,
		name        : '208',
		group       : '',
		title       : '208',
		description : ''
	},
	{
		index       : 209,
		name        : '209',
		group       : '',
		title       : '209',
		description : ''
	},
	{
		index       : 210,
		name        : '210',
		group       : '',
		title       : '210',
		description : ''
	},
	{
		index       : 211,
		name        : '211',
		group       : '',
		title       : '211',
		description : ''
	},
	{
		index       : 212,
		name        : '212',
		group       : '',
		title       : '212',
		description : ''
	},
	{
		index       : 213,
		name        : '213',
		group       : '',
		title       : '213',
		description : ''
	},
	{
		index       : 214,
		name        : '214',
		group       : '',
		title       : '214',
		description : ''
	},
	{
		index       : 215,
		name        : '215',
		group       : '',
		title       : '215',
		description : ''
	},
	{
		index       : 216,
		name        : '216',
		group       : '',
		title       : '216',
		description : ''
	},
	{
		index       : 217,
		name        : '217',
		group       : '',
		title       : '217',
		description : ''
	},
	{
		index       : 218,
		name        : '218',
		group       : '',
		title       : '218',
		description : ''
	},
	{
		index       : 219,
		name        : '219',
		group       : '',
		title       : '219',
		description : ''
	},
	{
		index       : 220,
		name        : '220',
		group       : '',
		title       : '220',
		description : ''
	},
	{
		index       : 221,
		name        : '221',
		group       : '',
		title       : '221',
		description : ''
	},
	{
		index       : 222,
		name        : '222',
		group       : '',
		title       : '222',
		description : ''
	},
	{
		index       : 223,
		name        : '223',
		group       : '',
		title       : '223',
		description : ''
	},
	{
		index       : 224,
		name        : '224',
		group       : '',
		title       : '224',
		description : ''
	},
	{
		index       : 225,
		name        : '225',
		group       : '',
		title       : '225',
		description : ''
	},
	{
		index       : 226,
		name        : '226',
		group       : '',
		title       : '226',
		description : ''
	},
	{
		index       : 227,
		name        : '227',
		group       : '',
		title       : '227',
		description : ''
	},
	{
		index       : 228,
		name        : '228',
		group       : '',
		title       : '228',
		description : ''
	},
	{
		index       : 229,
		name        : '229',
		group       : '',
		title       : '229',
		description : ''
	},
	{
		index       : 230,
		name        : '230',
		group       : '',
		title       : '230',
		description : ''
	},
	{
		index       : 231,
		name        : '231',
		group       : '',
		title       : '231',
		description : ''
	},
	{
		index       : 232,
		name        : 'histamine_a',
		group       : 'toxins',
		title       : 'Histamine A',
		description : 'Produced by some bacteria, causes sneezing (thus making disease contagious)'
	},
	{
		index       : 233,
		name        : 'histamine_b',
		group       : 'toxins',
		title       : 'Histamine B',
		description : 'Produced by some bacteria, causes coughing instead of sneezing'
	},
	{
		index       : 234,
		name        : 'sleep_toxin',
		group       : 'toxins',
		title       : 'Sleep toxin',
		description : 'Produced by some bacteria, causes sleepiness'
	},
	{
		index       : 235,
		name        : 'fever_toxin',
		group       : 'toxins',
		title       : 'Fever toxin',
		description : 'Produced by some bacteria, raises body temperature'
	},
	{
		index       : 236,
		name        : 'unknown_toxin',
		group       : 'toxins',
		title       : 'unknown toxin',
		description : ''
	},
	{
		index       : 237,
		name        : 'unknown_toxin',
		group       : 'toxins',
		title       : 'unknown toxin',
		description : ''
	},
	{
		index       : 238,
		name        : 'unknown_toxin',
		group       : 'toxins',
		title       : 'unknown toxin',
		description : ''
	},
	{
		index       : 239,
		name        : 'unknown_toxin',
		group       : 'toxins',
		title       : 'unknown toxin',
		description : ''
	},
	{
		index       : 240,
		name        : 'antibody0',
		group       : 'antibodies',
		title       : 'Antibody 0',
		description : 'Antibody to bacteria sporting Antigen 0'
	},
	{
		index       : 241,
		name        : 'antibody1',
		group       : 'antibodies',
		title       : 'Antibody 1',
		description : ''
	},
	{
		index       : 242,
		name        : 'antibody2',
		group       : 'antibodies',
		title       : 'Antibody 2',
		description : ''
	},
	{
		index       : 243,
		name        : 'antibody3',
		group       : 'antibodies',
		title       : 'Antibody 3',
		description : ''
	},
	{
		index       : 244,
		name        : 'antibody4',
		group       : 'antibodies',
		title       : 'Antibody 4',
		description : ''
	},
	{
		index       : 245,
		name        : 'antibody5',
		group       : 'antibodies',
		title       : 'Antibody 5',
		description : ''
	},
	{
		index       : 246,
		name        : 'antibody6',
		group       : 'antibodies',
		title       : 'Antibody 6',
		description : ''
	},
	{
		index       : 247,
		name        : 'antibody7',
		group       : 'antibodies',
		title       : 'Antibody 7',
		description : ''
	},
	{
		index       : 248,
		name        : 'antigen0',
		group       : 'antigens',
		title       : 'Antigen 0',
		description : 'Present on infecting bacteria - causes antibody production'
	},
	{
		index       : 249,
		name        : 'antigen1',
		group       : 'antigens',
		title       : 'Antigen 1',
		description : ''
	},
	{
		index       : 250,
		name        : 'antigen2',
		group       : 'antigens',
		title       : 'Antigen 2',
		description : ''
	},
	{
		index       : 251,
		name        : 'antigen3',
		group       : 'antigens',
		title       : 'Antigen 3',
		description : ''
	},
	{
		index       : 252,
		name        : 'antigen4',
		group       : 'antigens',
		title       : 'Antigen 4',
		description : ''
	},
	{
		index       : 253,
		name        : 'antigen5',
		group       : 'antigens',
		title       : 'Antigen 5',
		description : ''
	},
	{
		index       : 254,
		name        : 'antigen6',
		group       : 'antigens',
		title       : 'Antigen 6',
		description : ''
	},
	{
		index       : 255,
		name        : 'antigen7',
		group       : 'antigens',
		title       : 'Antigen 7',
		description : ''
	}
]);

/**
 * Process a buffer (or extractor)
 * This should be the part AFTER CBiochemistry
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Extractor|Buffer}   buffer
 */
Chemistry.setMethod(function processBuffer(buffer) {

	var entry,
	    info,
	    ex,
	    i;

	if (Buffer.isBuffer(buffer)) {
		ex = new Extractor(buffer);
	} else {
		ex = buffer;
		buffer = null;
	}

	// The first bit is always 0x0200
	ex.skip(2);

	// Now read in all the chemicals, these are [Value] [Half life]
	for (i = 0; i < Chemistry.chemicals.length; i++) {
		// Get the info of the chemical
		info = Chemistry.chemicals[i];

		if (!this.chemicals[i]) {
			this.chemicals[i] = {
				index   : i,
				name    : info.name
			};
		}

		entry = this.chemicals[i];

		// First byte is the current value
		entry.value = ex.readByte(1);

		// Second byte is the half life
		entry.halflife = ex.readByte(1);
	}

});