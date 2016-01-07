/* jslint node: true, esnext: true */
"use strict";

const zlib = require('zlib');
const BaseStep = require('kronos-step').Step;

const GzipStep = {
	"name": "kronos-step-gzip",
	"description": "This step just forwards each request from its in endpoint to its out endpoint",
	"endpoints": {
		"outZip": {
			"out": true,
			"uti": "kronos.message"
		},
		"outUnZip": {
			"out": true,
			"uti": "kronos.message"
		},
		"inZip": {
			"in": true,
			"uti": "kronos.message"
		},
		"inUnZip": {
			"in": true,
			"uti": "kronos.message"
		}
	},

	finalize(manager, scopeReporter, stepConfiguration) {
		const inZipEndpoint = this.endpoints.inZip;
		const inUnZipEndpoint = this.endpoints.inUnZip;
		const outUnZipEndpoint = this.endpoints.outUnZip;
		const outZipEndpoint = this.endpoints.outZip;

		const inZipFunc = function (message) {
			// The stream data should be zipped
			let stream = message.payload;
			let gzip = zlib.createGzip();
			message.payload = stream.pipe(gzip);
			return outZipEndpoint.send(message);
		};

		const inUnZipFunc = function (message) {
			// The stream data should be un-zipped
			let stream = message.payload;
			let gunzip = zlib.createGunzip();
			message.payload = stream.pipe(gunzip);
			return outUnZipEndpoint.send(message);
		};

		inUnZipEndpoint.receive = inUnZipFunc;
		inZipEndpoint.receive = inZipFunc;
	}

};

const GzipStepFactory = Object.assign({}, BaseStep, GzipStep);
module.exports = GzipStepFactory;
