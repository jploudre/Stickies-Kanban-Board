// story: e01s02
// Smoke test — proves the headless harness (tools/run-tests.sh) can execute a
// test file and report pass. Tests pure logic only.
//
// formatClock lives in core (src/core/util.js, promoted there so the Pomodoro
// app and this harness share it) — this is the canary that node --test works
// and that core pure helpers are require-able.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const MF = require('../src/core/util.js');

test('formatClock formats mm:ss (boundaries + typical)', () => {
  assert.strictEqual(MF.formatClock(0), '00:00');      // min
  assert.strictEqual(MF.formatClock(59), '00:59');     // before minute rollover (off-by-one)
  assert.strictEqual(MF.formatClock(60), '01:00');     // exact minute
  assert.strictEqual(MF.formatClock(61), '01:01');     // just after minute rollover
  assert.strictEqual(MF.formatClock(25 * 60), '25:00'); // a full pomodoro
});

test('formatClock pads single digits with leading zero', () => {
  assert.strictEqual(MF.formatClock(601), '10:01');
  assert.strictEqual(MF.formatClock(0), '00:00');
});
