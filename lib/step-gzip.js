/* jslint node: true, esnext: true */
"use strict";

const zlib = require('zlib');
const BaseStep = require('kronos-step').Step;

const GzipStep = {
	"name": "kronos-step-gzip",
	"description": "This step just forwards each request from its in endpoint to its out endpoint",
	"endpoints": {
		"outZip": {
			"out": true
		},
		"outUnZip": {
			"out": true
		},
		"inZip": {
			"in": true
		},
		"inUnZip": {
			"in": true
		}
	},

	finalize(manager, stepConfiguration) {
		const outUnZipEndpoint = this.endpoints.outUnZip;
		const outZipEndpoint = this.endpoints.outZip;

		this.endpoints.inZip.receive = message => {
			// The stream data should be zipped
			let stream = message.payload;
			let gzip = zlib.createGzip();
			message.payload = stream.pipe(gzip);
			return outZipEndpoint.receive(message);
		};

		this.endpoints.inUnZip.receive = message => {
			// The stream data should be un-zipped
			let stream = message.payload;
			let gunzip = zlib.createGunzip();
			message.payload = stream.pipe(gunzip);
			return outUnZipEndpoint.receive(message);
		};
	}
};

const GzipStepFactory = Object.assign({}, BaseStep, GzipStep);
module.exports = GzipStepFactory;
