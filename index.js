/* jslint node: true, esnext: true */
'use strict';

const Step = require('./lib/step-gzip');

module.exports.Step = Step;

exports.registerWithManager = manager => manager.registerStep(Step);
