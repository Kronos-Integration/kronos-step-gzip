/* jslint node: true, esnext: true */
"use strict";

const zlib = require('zlib');
const baseStep = require('kronos-step').Step;
const messageFactory = require('kronos-step').message;

/**
 * Zips and unzips the data stream
 */
class StepGzip extends baseStep {

	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		const inZipEndpoint = this.endpoints.inZip;
		const inUnZipEndpoint = this.endpoints.inUnZip;
		const outUnZipEndpoint = this.endpoints.outUnZip;
		const outZipEndpoint = this.endpoints.outZip;

		const inZipFunc = function (message) {
			// The stream data should be zipped
			let stream = message.payload;
			let gzip = zlib.createGzip();
			message.payload = stream.pipe(gzip);
			outZipEndpoint.send(message);
		};

		const inUnZipFunc = function (message) {
			// The stream data should be un-zipped
			let stream = message.payload;
			let gunzip = zlib.createGunzip();
			message.payload = stream.pipe(gunzip);
			outUnZipEndpoint.send(message);
		};

		inUnZipEndpoint.registerReceiveCallback(inUnZipFunc);
		inZipEndpoint.registerReceiveCallback(inZipFunc);
	}
}

StepGzip.configuration = {
	"name": "kronos-step-gzip",
	"description": "This step just forwards each request from its in endpoint to its out endpoint",
	"endpoints": {
		"outZip": {
			"active": true,
			"out": true,
			"uti": "kronos.message"
		},
		"outUnZip": {
			"active": true,
			"out": true,
			"uti": "kronos.message"
		},
		"inZip": {
			"in": true,
			"passive": true,
			"uti": "kronos.message"
		},
		"inUnZip": {
			"passive": true,
			"in": true,
			"uti": "kronos.message"
		}
	}
};

module.exports = StepGzip;
