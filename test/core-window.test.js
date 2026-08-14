// story: e02s05
// Unit tests for core/window/window.js — manager registry + node-safe metadata.
// DOM construction/rendering is covered by UAT (no DOM in the harness).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const MF = require('../src/core/window/window.js');

test('MF.Window stores metadata and registers with the manager', () => {
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'Pomodoro', width: 300, height: 200, x: 10, y: 20 });
  assert.strictEqual(w.title, 'Pomodoro');
  assert.strictEqual(w.width, 300);
  assert.strictEqual(w.height, 200);
  assert.strictEqual(MF.WindowManager.count(), 1);
  assert.strictEqual(MF.WindowManager.top(), w);
  assert.ok(w.id.startsWith('mf-window-'));
});

test('MF.WindowManager.add is idempotent', () => {
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'a' });
  MF.WindowManager.add(w); // already added by constructor
  assert.strictEqual(MF.WindowManager.count(), 1);
});

test('MF.WindowManager.remove detaches and clears top', () => {
  MF.WindowManager.windows.length = 0;
  const w1 = new MF.Window({ title: '1' });
  const w2 = new MF.Window({ title: '2' });
  assert.strictEqual(MF.WindowManager.count(), 2);
  MF.WindowManager.remove(w1);
  assert.strictEqual(MF.WindowManager.count(), 1);
  assert.strictEqual(MF.WindowManager.top(), w2);
  MF.WindowManager.remove(w2);
  assert.strictEqual(MF.WindowManager.count(), 0);
  assert.strictEqual(MF.WindowManager.top(), null);
});

test('MF.Window is node-safe: no DOM build, defaults applied', () => {
  const w = new MF.Window({});
  assert.strictEqual(w.el, null);
  assert.strictEqual(w.width, 480);
  assert.strictEqual(w.height, 360);
});
