var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    SfcOle,
    Fn = Blast.Collection.Function;

/**
 * The Small Furry Creatures Ole connection class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
SfcOle = Fn.inherits('Informer', 'Develry.Creatures', function SfcOle() {

	// Create a function queue
	this.queue = Fn.createQueue();

	// Only 1 command can be processed at a time
	this.queue.limit = 1;

	// The queue can start now
	this.queue.start();

	// The current buffer
	this.buffer = '';
});

/**
 * Create the connection,
 * if C2 is not running, it'll be started
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
SfcOle.setMethod(function connect() {

	var that = this;

	// Create an instance of the vbole application,
	// which connects to Creatures 2
	this.vbole = child_process.spawn('vbole.exe');

	// Listen to output
	this.vbole.stdout.on('data', function onData(data) {
		that.gotOleData('' + data);
	});
});

/**
 * Method to process incoming ole data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   str
 */
SfcOle.setMethod(function gotOleData(str) {

	// Add this to the current buffer
	this.buffer += str;

	//console.log(this.buffer);

	// See if the buffer ends with \r\n
	if (this.buffer.slice(-2) == '\r\n') {

		// It does, so get everything before the returns
		str = this.buffer.slice(0, -2);

		// Reset the buffer
		this.buffer = '';

		// Emit as response
		this.emit('response', str);
	}
});

/**
 * Send a command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   chunk
 */
SfcOle.setMethod(function firecommand(str, callback) {

	var that = this;

	if (!this.vbole) {
		this.connect();
	}

	this.queue.add(function queueCommand(done) {

		// Create a listener
		that.once('response', function gotResponse(response) {
			callback(null, response);
			done();
		});

		// Send the command
		that.vbole.stdin.write(str);
	});
});

module.exports = SfcOle;