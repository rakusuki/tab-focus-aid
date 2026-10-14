#!/usr/bin/env node
'use strict';
const vm = require('node:vm');
const assert = require('node:assert/strict');
// The escaped slash bug from v0.3.0 must be rejected.
const malformed = String.raw`const broken = /Chrome\\\\//.test(navigator.userAgent);`;
assert.throws(() => new vm.Script(malformed), SyntaxError);
console.log('PASS regression: malformed Chrome regular expression rejected');
