/* jslint node: true, esnext: true */
"use strict";

const zlib = require('zlib');

const baseStep = require('kronos-step').step;
const messageFactory = require('kronos-step').message;

/**
 * Zips and unzips the data stream
 */
class StepGzip extends baseStep {

	/**
	 * receives messages from incomming endpoints
	 */
	_doReceive(endpointName, message) {
		const self = this;

		if (endpointName === 'inZip') {
			// The stream data should be zipped
			let stream = message.payload;
			let gzip = zlib.createGzip();
			message.payload = stream.pipe(gzip);
			self._push("outZip", message);
		} else if (endpointName === 'inUnZip') {
			// The stream data should be un-zipped
			let stream = message.payload;
			let gunzip = zlib.createGunzip();
			message.payload = stream.pipe(gunzip);
			self._push("outUnZip", message);
		}
	}

	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		// The stream comming from this entpoint is ZIPPED
		this._addEndpointFromConfig({
			"name": "outZip",
			"active": true,
			"out": true
		});

		// The stream comming from this entpoint is UN-ZIPPED
		this._addEndpointFromConfig({
			"name": "outUnZip",
			"active": true,
			"out": true
		});

		// Use this enpoint to ZIP a stream
		this._addEndpointFromConfig({
			"name": "inZip",
			"passive": true,
			"in": true
		});

		// Use this enpoint to UN-ZIP a stream
		this._addEndpointFromConfig({
			"name": "inUnZip",
			"passive": true,
			"in": true
		});
	}
}

module.exports = function (kronos, flow, opts) {
	return new StepGzip(kronos, flow, opts);
};
