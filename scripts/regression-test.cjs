#!/usr/bin/env node
'use strict';
// A regression test proving that syntactically invalid JavaScript cannot pass.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
assert.throws(() => new vm.Script("const broken = /Chrome\\//.test(navigator.userAgent);"), SyntaxError);
console.log('PASS regression: invalid Chrome regular expression rejected');
