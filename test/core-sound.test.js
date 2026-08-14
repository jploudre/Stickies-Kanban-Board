// story: e02s03
// Unit tests for core/sound/sound.js — registry + graceful playback no-op.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const MF = require('../src/core/sound/sound.js');

test('MF.sound.register stores a sound by name', () => {
  MF.sound.register('pop', 'assets/sound-pop.wav');
  assert.strictEqual(MF.sound.get('pop'), 'assets/sound-pop.wav');
});

test('MF.sound.register rejects missing name or url', () => {
  assert.throws(() => MF.sound.register('', 'x'), /name and a url/);
  assert.throws(() => MF.sound.register('x', ''), /name and a url/);
});

test('MF.sound.get returns null for an unknown sound', () => {
  assert.strictEqual(MF.sound.get('does-not-exist'), null);
});

test('MF.sound.play no-ops where Audio is unavailable (returns false)', () => {
  // In a node test env there is no Audio/document, so play must be a clean no-op.
  assert.strictEqual(MF.sound.play('pop'), false);
  assert.strictEqual(MF.sound.play('unknown'), false);
});
