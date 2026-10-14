#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'tab-focus-aid.js'), 'utf8');
const bookmark = fs.readFileSync(path.join(root, 'bookmarklet.txt'), 'utf8').trim();
const html = fs.readFileSync(path.join(root, 'register.html'), 'utf8');

function syntax(code, description) {
  try { new vm.Script(code, {filename: description}); }
  catch (error) { throw new Error(description + ' has invalid JavaScript:\n' + error.message, {cause:error}); }
  console.log('PASS syntax:', description);
}
function decodeHtml(text) {
  return text.replace(/&(#(?:x[0-9a-f]+|\d+)|amp|quot|apos|lt|gt);/gi, (_full, entity) => {
    const map = {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'};
    const lower = entity.toLowerCase();
    if (lower[0] === '#') {
      const radix = lower[1] === 'x' ? 16 : 10;
      const n = Number.parseInt(lower.slice(radix===16?2:1), radix);
      return String.fromCodePoint(n);
    }
    return map[lower] || _full;
  });
}

syntax(source, 'tab-focus-aid.js');
assert.match(bookmark, /^javascript:/i, 'bookmarklet.txt must begin with javascript:');
const jsURL = bookmark.replace(/^javascript:/i,'').trim();
assert.ok(jsURL.length, 'bookmarklet.txt must contain code');
syntax(jsURL, 'bookmarklet.txt URL payload');

const link = html.match(/<a\b[^>]*\bhref="(javascript:[^"]*)"/i);
assert.ok(link, 'register.html must contain a bookmarklet link');
const htmlURL = decodeHtml(link[1]);
assert.equal(htmlURL, bookmark, 'register.html bookmarklet must match bookmarklet.txt exactly');
assert.match(html, /class="bookmark"/, 'register.html must contain a draggable link');
assert.match(source, /all:initial!important;position:fixed!important;/, 'panel CSS must reset styles before fixed positioning');
assert.match(bookmark, /all:initial!important;position:fixed!important;/, 'bookmarklet must position panel in viewport');
syntax(htmlURL.replace(/^javascript:/i,'').trim(), 'register.html URL payload');

assert.ok(!/[\r\n]/.test(bookmark), 'bookmark URL must be one line');
console.log('PASS match: register.html and bookmarklet.txt');
console.log('All bookmarklet checks passed.');

const extensionSource=fs.readFileSync(path.join(root,'extension','tab-focus-aid.js'),'utf8');
assert.equal(extensionSource,source,'extension focus engine must match root source');
syntax(extensionSource,'extension/tab-focus-aid.js');
for(const filename of ['background.js','popup.js']){
 syntax(fs.readFileSync(path.join(root,'extension',filename),'utf8'),'extension/'+filename);
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'extension','manifest.json'),'utf8'));
assert.equal(manifest.manifest_version,3);
assert.ok(manifest.optional_host_permissions?.includes('https://*/*'));
console.log('PASS extension source parity and Manifest V3');
