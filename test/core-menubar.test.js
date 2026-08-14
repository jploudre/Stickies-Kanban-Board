// story: e02s04
// Unit tests for core/menubar/menubar.js — registry API + node-safe no-op.
// DOM rendering/click routing is covered by UAT (no DOM in the harness).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const MF = require('../src/core/menubar/menubar.js');

test('MF.menubar.on registers handlers and returns the component', () => {
  let fired = null;
  const ret = MF.menubar.on('action', (payload) => { fired = payload; });
  assert.strictEqual(ret, MF.menubar);
  assert.ok(fired === null, 'handlers do not fire on registration');
});

test('MF.menubar.render is a node-safe no-op without a document', () => {
  assert.strictEqual(MF.menubar.render({ appTitle: 'x', menus: [] }), null);
});

test('MF.menubar enable/disable helpers are node-safe no-ops', () => {
  assert.doesNotThrow(() => {
    MF.menubar.setMenuEnabled('color', false);
    MF.menubar.setItemEnabled('undo-board', false);
    MF.menubar.setActiveColor('yellow');
  });
});
