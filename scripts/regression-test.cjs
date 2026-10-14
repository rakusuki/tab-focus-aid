#!/usr/bin/env node
'use strict';
const vm = require('node:vm');
const assert = require('node:assert/strict');
// Reproduce the syntax error that broke v0.3.0.
const malformed = String.raw`const broken = /Chrome\\//.test(navigator.userAgent);`;
assert.throws(() => new vm.Script(malformed), SyntaxError);
console.log('PASS regression: malformed Chrome regular expression rejected');
