/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const fs = require('fs');
const path = require("path");
const rimraf = require('rimraf');

const fixturesDir = path.join(__dirname, 'fixtures');
const volatileDir = path.join(__dirname, 'fixtures', 'volatile');
const comperator = require('file-compare');

const step = require('kronos-step');
const testStep = require('kronos-test-step');
const stepPassThrough = require('../index.js');

const GzipStep = require('../index');

// ---------------------------
// Create a mock manager
// ---------------------------
const manager = testStep.managerMock;
GzipStep.registerWithManager(manager);


describe('zip and unzip files', function () {
	/**
	 * Clears the test directory. This is the monitored directoy where the files will be created
	 */
	beforeEach(function () {
		// Delete all the the 'volatile' directory
		try {
			rimraf.sync(volatileDir);
		} catch (err) {
			console.log(err);
		}
		fs.mkdirSync(volatileDir);
	});

	/**
	 * Reads a file, get zipped by the step and then comapred against its reference.
	 */
	it('zip a stream', function (done) {
		// Set the timeout for this test
		this.timeout(4000);

		let inFile = path.join(fixturesDir, 'normal.txt');
		let outFileRef = path.join(fixturesDir, 'normal.txt.gz');
		let outFile = path.join(volatileDir, 'testFile.txt.gz');

		// Stores the error messages
		// Currently the error messges will not be checked.
		let errors = [];

		let step1 = manager.getStepInstance({
			"type": "kronos-step-gzip",
			"name": "myGzipStep"
		});


		let inEndPoint = step1.endpoints.inZip;
		let outEndPoint = step1.endpoints.outZip;

		// This endpoint is the IN endpoint of the next step.
		// It will be connected with the OUT endpoint of the Adpater
		let receiveEndpoint = step.createEndpoint("testEndpointIn", {
			"in": true
		});

		// This endpoint is the OUT endpoint of the previous step.
		// It will be connected with the OUT endpoint of the Adpater
		let sendEndpoint = step.createEndpoint("testEndpointOut", {
			"out": true
		});

		// This generator emulates the IN endpoint of the next step.
		// It will be connected with the OUT endpoint of the Adpater
		let receiveFunction = function (message) {

			// get the GZIP stream and write it to the file
			let writeStream = fs.createWriteStream(outFile);

			// after the file was written we need to compare it
			message.payload.pipe(writeStream).on('finish', function () {

				// check that the file exists
				let stats = fs.lstatSync(outFile);

				// Is it a directory?
				if (stats.isFile()) {
					comperator.compare(outFile, outFileRef, "sha1", function (copied, err) {
						assert.ok(copied, "The created zip file is not the same as expected");
						done();
					});
				} else {
					assert.ok(false, "The file does not exists");
					done();
				}
			});
		};


		receiveEndpoint.receive = receiveFunction;
		outEndPoint.connect(receiveEndpoint);
		inEndPoint.connect(sendEndpoint);

		let msg = {
			"info": {
				"file_name": "anyFile.txt"
			}
		};
		msg.payload = fs.createReadStream(inFile);

		step1.start().then(function (step) {
			sendEndpoint.send(msg);
		}, function (error) {
			done(error); // 'uh oh: something bad happened’
		});

	});


	/**
	 * Reads a zipped file, get unzipped by the step and then comapred against its reference.
	 */
	it('unzip a stream', function (done) {
		// Set the timeout for this test
		this.timeout(4000);

		let inFile = path.join(fixturesDir, 'normal.txt.gz');
		let outFileRef = path.join(fixturesDir, 'normal.txt');
		let outFile = path.join(volatileDir, 'testFile.txt');

		// Stores the error messages
		// Currently the error messges will not be checked.
		let errors = [];

		let step1 = manager.getStepInstance({
			"type": "kronos-step-gzip",
			"name": "myStep"
		});

		let inEndPoint = step1.endpoints.inUnZip;
		let outEndPoint = step1.endpoints.outUnZip;

		// This endpoint is the IN endpoint of the next step.
		// It will be connected with the OUT endpoint of the Adpater
		let receiveEndpoint = step.createEndpoint("testEndpointIn", {
			"in": true,
			"passive": true
		});

		// This endpoint is the OUT endpoint of the previous step.
		// It will be connected with the OUT endpoint of the Adpater
		let sendEndpoint = step.createEndpoint("testEndpointOut", {
			"out": true,
			"active": true
		});


		// This generator emulates the IN endpoint of the next step.
		// It will be connected with the OUT endpoint of the Adpater
		let receiveFunction = function (message) {

			// get the GZIP stream and write it to the file
			let writeStream = fs.createWriteStream(outFile);

			// after the file was written we need to compare it
			message.payload.pipe(writeStream).on('finish', function () {

				// check that the file exists
				let stats = fs.lstatSync(outFile);

				// Is it a directory?
				if (stats.isFile()) {
					setTimeout(comperator.compare(outFile, outFileRef, "sha1", function (copied, err) {
						assert.ok(copied, "The created unziped file is not the same as expected");
						done();
					}), 1000);

				} else {
					assert.ok(false, "The file does not exists");
					done();
				}
			});
		};
		receiveEndpoint.receive = receiveFunction;
		outEndPoint.connect(receiveEndpoint);
		inEndPoint.connect(sendEndpoint);

		let msg = {
			"info": {
				"file_name": "anyFile.txt"
			}
		};

		msg.payload = fs.createReadStream(inFile);

		step1.start().then(function (step) {
			sendEndpoint.send(msg);
		}, function (error) {
			done(error); // 'uh oh: something bad happened’
		});

	});


});
