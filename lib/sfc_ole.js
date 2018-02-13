var Blast = require('protoblast')(false),
    child_process = require('child_process'),
    libpath = require('path'),
    SfcOle,
    Fn = Blast.Collection.Function;

/**
 * The Small Furry Creatures Ole connection class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 */
SfcOle = Fn.inherits('Develry.Creatures.Base', function SfcOle() {

	// Create a function queue
	this.queue = Fn.createQueue();

	// Only 1 command can be processed at a time
	this.queue.limit = 1;

	// The queue can start now
	this.queue.start();

	// The current buffer
	this.buffer = '';

	// Connection attempts
	this.connection_attempts = 0;
});

/**
 * Create the connection,
 * if C2 is not running, it'll be started
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 */
SfcOle.setMethod(function connect() {

	var that = this;

	// Create an instance of the vbole application,
	// which connects to Creatures 2
	this.vbole = child_process.spawn(libpath.resolve(__dirname, '..', 'vbole.exe'));

	this.vbole.on('exit', function onExit(code) {

		that.connection_attempts++;

		if (that.connection_attempts < 10) {
			that.connect();
		} else {
			throw new Error('VBOLE application crashed again, with code ' + code);
		}
	});

	// Listen to error output
	this.vbole.stderr.on('data', function onError(data) {
		console.error(String(data));
	});

	// Listen to output
	this.vbole.stdout.on('data', function onData(data) {
		that.gotOleData('' + data);
	});

	// Set the path, because VB6 is too stupid to know it itself
	this.sendJSON({
		type: "setpath",
		command: libpath.resolve(__dirname, '..')
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
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   chunk
 */
SfcOle.setMethod(function sendJSON(object, callback) {

	var that = this,
	    message;

	if (!this.vbole) {
		this.connect();
	}

	// Send 1 command at a time
	this.queue.add(function queueCommand(done) {

		// Listen for the response
		that.once('response', function gotResponse(response) {

			if (callback) {
				callback(null, response);
			}

			done();
		});

		// Stringify the command
		message = JSON.stringify(object);

		try {
			// Send it to the executable
			that.vbole.stdin.write(message);
		} catch (err) {
			return callback(err);
		}
	});
});

/**
 * Send a CAOS command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {String}   caos
 * @param    {Function} callback
 */
SfcOle.setMethod(function sendCAOS(caos, callback) {

	var payload = {
		type    : 'caos',
		command : caos
	};

	this.sendJSON(payload, callback);
});

module.exports = SfcOle;