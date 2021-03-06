var child_process = require('child_process'),
    libpath = require('path'),
    Blast = __Protoblast,
    Fn = Blast.Collection.Function,
    fs = require('graceful-fs');

// Get the Creatures namespace
var Creatures = Fn.getNamespace('Develry.Creatures');

/**
 * The Small Furry Creatures Ole connection class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.0
 */
var SfcOle = Fn.inherits('Develry.Creatures.Base', function SfcOle() {

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
 * if C2 is not running, it'll be started.
 * If instances are already running they will be closed first
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.7
 */
SfcOle.setMethod(function connect() {

	var that = this,
	    vbole_path = libpath.resolve(__dirname, '..', 'vbole.exe');

	if (this.vbole_main) {
		// Remove all listeners from the existing instances
		this.vbole_main.removeAllListeners();
		this.vbole_checker.removeAllListeners();

		this.log('debug', 'Restarting VBOLE instances');

		// Kill the instances
		this.vbole_main.kill();
		this.vbole_checker.kill();
	}

	// Create an instance of the vbole application,
	// which connects to Creatures 2
	this.vbole_main = this.spawn(vbole_path, {do_debug: true});

	// Create another instance of the same vbole application,
	// but this one will only be used for checking on CAOS errors
	this.vbole_checker = this.spawn(vbole_path, {error_dialog_check: false, do_debug: true});

	// Listen to the exit code
	this.vbole_main.on('exit', function onExit(code) {
		that.log('error', 'Main vbole application has closed with code', code, ', attempting reconnection', that.connection_attempts++);
		that.connect();
	});

	this.vbole_main.on('error', function onError(err) {
		that.log('error', 'Main:', err);
	});

	// Listen for stdin errors (writes after close & such)
	this.vbole_main.stdin.on('error', function onError(err) {
		// Ignore
		that.log('error', 'Main:', err);
	});

	this.vbole_checker.on('exit', function onExit(code) {
		that.log('error', 'Checker vbole application has closed with code', code, ', attempting reconnection', that.connection_attempts++);
		that.connect();
	});

	this.vbole_checker.on('error', function onError(err) {
		that.log('error', 'Checker error:', err);
	});

	// Listen to error output
	this.vbole_main.stderr.on('data', function onError(data) {

		// Convert the buffer to a string
		data = String(data);

		// Just output debug messages
		if (data[0] == '[' && Blast.Bound.String.startsWith(data, '[DEBUG]')) {
			that.log('debug', data);
			return;
		}

		// Is the error a JSON object?
		if (data[0] == '{') {
			data = JSON.parse(data);

			// Send this as an error to the callback
			if (that.last_main_callback) {
				that.last_main_callback(data);
			}

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
			that.log('error', 'VBOle:', data);
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
			that.log('debug', '[CHECKER]', data);
			return;
		}

		that.log('error', '[CHECKER] ', data);
	});

	// Do an initial error dialog check
	that.sendCheckerJSON({type: 'checkerrordialog'}, function didInitialCheck(err, data) {
		that.log('debug', 'Initial error check:', err, data);
	});

	// Set the path, because VB6 is too stupid to know it itself
	this.sendJSON({
		type    : 'setpath',
		command : libpath.resolve(__dirname, '..')
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
 * @version  0.2.7
 *
 * @param    {String}   target
 * @param    {Object}   json
 * @param    {Function} callback
 */
SfcOle.setMethod(function _sendJSON(target, object, callback) {

	var that = this,
	    multiple = Array.isArray(object),
	    original_callback,
	    vbole_name,
	    message,
	    timeout,
	    err;

	if (!callback) {
		callback = Fn.thrower;
	}

	original_callback = callback;

	if (!this.vbole_main) {
		this.connect();
	}

	// Make sure the callback is only called once
	callback = Fn.regulate(function doCallback(err) {
		that['last_sent_callback_' + target] = null;
		original_callback.apply(null, arguments);
	}, function overflow(count, args) {
		that.log('error', 'VBOLE reply came too late, callback already called:', count, args);
	});

	// Remember this callback
	that['last_' + target + '_callback'] = callback;

	vbole_name = 'vbole_' + target;

	if (target == 'checker') {
		if (this.vbole_checker.send_count > 3) {
			timeout = 500;
		} else {
			if (!this.vbole_checker.send_count) {
				this.vbole_checker.send_count = 0;
			}

			// Initial wait will be at least 1 second
			timeout = 3500;
		}

		this.vbole_checker.send_count++;
	} else {
		timeout = 4000;
	}

	// Send 1 command at a time
	this[target + '_queue'].add(function queueCommand(done) {

		var bomb;

		// Make sure "done" gets called only once
		done = Fn.regulate(done);

		// Create a timebomb that'll execute the callback
		// after a certain amount of time
		bomb = Fn.timebomb(timeout, function timedout(err) {

			var new_error;

			// Call done on the next tick
			Blast.nextTick(done);

			// Create a new error
			new_error = new Error('VBOLE "' + target + '" did not respond to request after ' + timeout + 'ms');

			// Indicate it's a timeout
			new_error.timeout = true;

			that.log('error', 'VBOLE "' + target + '" did not respond to request after', timeout, 'ms', target, object);
			that.log('error', ' »» Request was ' + JSON.stringify(object));

			callback(new_error);
		});

		// Set the last date we sent
		that['last_sent_' + target] = object;

		// Listen for the response
		that.once(target + '_response', function gotResponse(response) {

			// Call done on the next tick
			Blast.nextTick(done);

			// Defuse the bomb
			bomb.defuse();

			// The response is always a json object since v0.2.1
			response = JSON.parse(response);

			// See if some error caused an error
			err = extractError(response, object);

			if (err) {
				callback(err);
			} else {
				callback(null, response);
			}
		});

		// Stringify the command
		message = JSON.stringify(object);

		if (!that[vbole_name].stdin.writable) {
			// Call done on the next tick
			Blast.nextTick(done);

			bomb.defuse();

			callback(new Error('VBOle input has closed'));
			return;
		}

		try {
			// Send it to the executable
			that[vbole_name].stdin.write(message);
		} catch (err) {

			// Call done on the next tick
			Blast.nextTick(done);

			bomb.defuse();

			callback(err);
		}
	});
});

/**
 * Extract an error from the response object/array
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.2
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
			result.type = req.type;
			result.vbmsg = entry.error;
			result.req = req;
			break;
		}
	}

	if (result) {
		result.original_response = response;
	}

	return result;
}

/**
 * Escape a string that should be typed verbatim
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}   keys
 *
 * @return   {String}
 */
SfcOle.setMethod(function escapeKeys(keys) {

	var result;

	if (keys == null) {
		throw new Error('Keys parameter should not be null');
	}

	keys = String(keys);

	// Unescaped these characters would perform a special "SendKeys" function.
	// For example: an unescaed tilde (~) would result in a return
	result = keys.replace(/[\+\^\%\~\(\)\[\]\{\}]/gi, '{$&}');

	return result;
});

/**
 * Send a CAOS command and callback with the response
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.2.2
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
	callback = Fn.regulate(callback || Fn.thrower);

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
					return callback(new Error('CAOS timeout, no dialog box detected, command was: ' + caos));
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

					that.sendCheckerJSON([
						//{type: 'geterrordialog'},
						{type: 'close'}
					], function done(err, result) {

						if (err) {
							return callback(err);
						}

						callback(new Error('Caos command caused an error, code was: ' + caos));
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