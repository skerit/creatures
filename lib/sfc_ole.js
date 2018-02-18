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

	// Create the queues
	this.createQueue('main');
	this.createQueue('checker');

	// Connection attempts
	this.connection_attempts = 0;
});

/**
 * Create a queue
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @return   {FunctionQueue}
 */
SfcOle.setMethod(function createQueue(type) {

	var queue,
	    name;

	// Construct the queue property name
	name = type + '_queue';

	// Create a function queue
	queue = Fn.createQueue();

	// Only 1 command can be processed at a time
	queue.limit = 1;

	// The queue can start now
	queue.start();

	// Store the queue
	this[name] = queue;

	// Create the buffer
	this[type + '_buffer'] = '';

	return queue;
});

/**
 * Spawn something with the given arguments
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}   path
 * @param    {Object}   arg_object
 *
 * @return   {ChildProcess}
 */
SfcOle.setMethod(function spawn(path, arg_object) {

	if (!arg_object) {
		arg_object = {};
	}

	return child_process.spawn(path, [JSON.stringify(arg_object)]);
});

/**
 * Create the connection,
 * if C2 is not running, it'll be started
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.1
 */
SfcOle.setMethod(function connect() {

	var that = this,
	    vbole_path = libpath.resolve(__dirname, '..', 'vbole.exe');

	// Create an instance of the vbole application,
	// which connects to Creatures 2
	this.vbole_main = this.spawn(vbole_path, {do_debug: true});

	// Create another instance of the same vbole application,
	// but this one will only be used for checking on CAOS errors
	this.vbole_checker = this.spawn(vbole_path, {error_dialog_check: false, do_debug: true});

	// Listen to the exit code
	this.vbole_main.on('exit', function onExit(code) {

		that.connection_attempts++;

		if (that.connection_attempts < 10) {
			that.connect();
		} else {
			throw new Error('VBOLE application crashed again, with code ' + code);
		}
	});

	this.vbole_checker.on('exit', function onExit(code) {
		console.error('Second VBOle application exited:', code);
	});

	// Listen to error output
	this.vbole_main.stderr.on('data', function onError(data) {

		// Convert the buffer to a string
		data = String(data);

		// Just output debug messages
		if (data[0] == '[' && Blast.Bound.String.startsWith(data, '[DEBUG]')) {
			console.info(data);
			return;
		}

		// Is the error a JSON object?
		if (data[0] == '{') {
			data = JSON.parse(data);

			// Emit this as an error we need to handle
			that.emit('vbole_error', data, function respond(response) {

				if (!response) {
					response = {};
				}

				if (!response.type) {
					response.type = '';
				}

				that.vbole_main.stdin.write(JSON.stringify(response));
			}, null);
		} else {
			console.error('VBOle error:', data);
		}
	});

	// Listen to output
	this.vbole_main.stdout.on('data', function onData(data) {
		that.gotOleData('main', String(data));
	});

	// Listen to the second application too
	this.vbole_checker.stdout.on('data', function onDataTwo(data) {
		that.gotOleData('checker', String(data));
	});

	// Listen to the second application too
	this.vbole_checker.stderr.on('data', function onErrorTwo(data) {
		// Convert the buffer to a string
		data = String(data);

		// Just output debug messages
		if (data[0] == '[' && Blast.Bound.String.startsWith(data, '[DEBUG]')) {
			console.info('[CHECKER]' + data);
			return;
		}

		console.error('[CHECKER] ' + data);
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
 * @version  0.2.1
 *
 * @param    {String}   type
 * @param    {String}   str
 */
SfcOle.setMethod(function gotOleData(type, str) {

	var name = type + '_buffer';

	// Add this to the current buffer
	this[name] += str;

	//console.log(this.buffer);

	// See if the buffer ends with \r\n
	if (this[name].slice(-2) == '\r\n') {

		// It does, so get everything before the returns
		str = this[name].slice(0, -2);

		// Reset the buffer
		this[name] = '';

		// Emit as response
		this.emit(type + '_response', str);
	}
});

/**
 * Send a command to the second instance and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Object}   json
 * @param    {Function} callback
 */
SfcOle.setMethod(function sendCheckerJSON(object, callback) {
	return this._sendJSON('checker', object, callback);
});

/**
 * Send a command to the main vbole instance and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Object}   json
 * @param    {Function} callback
 */
SfcOle.setMethod(function sendJSON(object, callback) {
	return this._sendJSON('main', object, callback);
});

/**
 * Send a command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.1
 *
 * @param    {String}   target
 * @param    {Object}   json
 * @param    {Function} callback
 */
SfcOle.setMethod(function _sendJSON(target, object, callback) {

	var that = this,
	    multiple = Array.isArray(object),
	    vbole_name,
	    message,
	    err;

	if (!callback) {
		callback = Fn.thrower;
	}

	if (!this.vbole_main) {
		this.connect();
	}

	vbole_name = 'vbole_' + target;

	// Send 1 command at a time
	this[target + '_queue'].add(function queueCommand(done) {

		// Listen for the response
		that.once(target + '_response', function gotResponse(response) {

			// The response is always a json object since v0.2.1
			response = JSON.parse(response);

			// See if some error caused an error
			err = extractError(response, object);

			if (err) {
				callback(err);
			} else {
				callback(null, response);
			}

			done();
		});

		// Stringify the command
		message = JSON.stringify(object);

		try {
			// Send it to the executable
			that[vbole_name].stdin.write(message);
		} catch (err) {
			return callback(err);
		}
	});
});

/**
 * Extract an error from the response object/array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Array|Object} response
 * @param    {Array|Object} request
 *
 * @return   {Error}
 */
function extractError(response, request) {

	var result,
	    entry,
	    req,
	    i;

	response = Blast.Bound.Array.cast(response);
	request = Blast.Bound.Array.cast(request);

	for (i = 0; i < response.length; i++) {
		entry = response[i];

		if (entry.error) {
			req = request[i] || {};
			result = new Error('Error in "' + req.type + '" command: ' + entry.error);
			break;
		}
	}

	return result;
}

/**
 * Send a CAOS command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.1
 *
 * @param    {String}   caos
 * @param    {Function} callback
 */
SfcOle.setMethod(function sendCAOS(caos, callback) {

	var that = this,
	    attempt = 0,
	    payload,
	    bomb;

	// Make sure the callback can only be called 1 time
	callback = Fn.regulate(callback);

	// Listen for timeout
	bomb = Fn.timebomb(3000, function exploded() {
		that.sendCheckerJSON({type: 'checkerrordialog'}, function gotResult(err, result) {

			var new_data;

			attempt++;

			if (err) {
				return callback(err);
			}

			// No dialogs found? Give it more time then?
			if (!result.result) {
				if (attempt > 5) {
					return callback(new Error('CAOS timeout, no dialog box detected'));
				}

				bomb = Fn.timebomb(3000, exploded);
				return;
			}

			new_data = {
				error: 'DialogBox',
				elements: result.elements
			};

			that.emit('vbole_error', new_data, function respond(response) {

				if (!response) {
					return callback(new Error('Unhandled dialogbox, do it yourself'));
				}

				if (response.type == 'close') {
					console.log('Closing dialogbox!!');

					that.sendCheckerJSON([
						{type: 'geterrordialog'},
						{type: 'close'}
					], function done(err, result) {

						if (err) {
							return callback(err);
						}

						callback(new Error('Caos command caused an error'));
					});
				}
			}, null);
		});
	});

	payload = {
		type    : 'caos',
		command : caos
	};

	this.sendJSON(payload, function sentJSON(err, result) {

		// Defuse the timebomb
		bomb.defuse();

		if (err) {
			return callback(err);
		}

		if (result.error) {
			return callback(new Error(result.error));
		}

		return callback(null, result.result);
	});
});

module.exports = SfcOle;