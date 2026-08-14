// story: e02s01
// Unit tests for core/shell.js (MF namespace + register API).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

// shell.js exports MF via module.exports in a Node context.
const MF = require('../src/core/shell.js');

test('MF namespace is exposed with an apps registry', () => {
  assert.ok(MF, 'MF is defined');
  assert.ok(Array.isArray(MF.apps) || typeof MF.apps === 'object');
});

test('MF.register stores app metadata and returns it', () => {
  const app = MF.register({ name: 'stickies', title: 'Stickies Board', defaultWidth: 640 });
  assert.strictEqual(app.title, 'Stickies Board');
  assert.strictEqual(MF.apps.stickies.title, 'Stickies Board');
});

test('MF.register rejects a missing name', () => {
  assert.throws(() => MF.register({ title: 'no name' }), /requires a meta object with a name/);
});
