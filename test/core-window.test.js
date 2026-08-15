// story: e02s05
// Unit tests for core/window/window.js — manager registry + node-safe metadata.
// DOM construction/rendering is covered by UAT (no DOM in the harness).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const MF = require('../src/core/window/window.js');

// Minimal DOM shim so build() can be exercised headlessly (window.js only builds
// when a global document exists).
function makeFakeDocument() {
  function el(tag) {
    return {
      tagName: tag, className: '', style: {}, href: '', textContent: '', children: [],
      _listeners: {}, parentNode: null, getBoundingClientRect: () => ({ left: 0, top: 0 }),
      closest: () => null,
      addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
      removeEventListener(type, fn) { if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter((f) => f !== fn); },
      dispatch(type, ev) { (this._listeners[type] || []).forEach((fn) => fn(ev)); },
      setAttribute() {}, appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
      querySelector() { return null; }, classList: { add() {}, remove() {}, contains() { return false; } },
    };
  }
  const doc = {
    createElement: el, body: el('body'), _listeners: {},
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
    removeEventListener(type, fn) { if (this._listeners[type]) this._listeners[type] = this._listeners[type].filter((f) => f !== fn); },
  };
  return doc;
}

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

test('MF.Window with buttons:false omits close/maximize from the titlebar', () => {
  global.document = makeFakeDocument();
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'board', buttons: false });
  const head = w.el.children[0];
  const classes = head.children.map((c) => c.className);
  assert.ok(!classes.includes('btn-close'), 'no close button rendered');
  assert.ok(!classes.includes('btn-maximize'), 'no maximize button rendered');
  delete global.document;
});

test('MF.Window defaults to rendering the close/maximize buttons', () => {
  global.document = makeFakeDocument();
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'app', width: 320, height: 220 });
  const head = w.el.children[0];
  const classes = head.children.map((c) => c.className);
  assert.ok(classes.includes('btn-close'), 'default includes close button');
  assert.ok(classes.includes('btn-maximize'), 'default includes maximize button');
  delete global.document;
});

test('MF.Window defaults draggable true; draggable:false is honored', () => {
  const a = new MF.Window({ title: 'a' });
  assert.strictEqual(a.draggable, true, 'draggable on by default');
  const b = new MF.Window({ title: 'b', draggable: false });
  assert.strictEqual(b.draggable, false, 'draggable:false honored');
});

test('titlebar mousedown starts a drag: body class + doc mousemove listener', () => {
  global.document = makeFakeDocument();
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'draggable', x: 10, y: 20 });
  const head = w.el.children[0];
  let added = 0;
  const origAdd = global.document.addEventListener.bind(global.document);
  global.document.addEventListener = function (t, fn) { if (t === 'mousemove') added += 1; origAdd(t, fn); };
  const bodyAdd = global.document.body.classList.add;
  let bodyClassAdded = false;
  global.document.body.classList.add = function (c) { if (c === 'mf-window-dragging') bodyClassAdded = true; bodyAdd(c); };

  head.dispatch('mousedown', { button: 0, clientX: 50, clientY: 60, target: w.el.children[1], preventDefault() {} });
  assert.strictEqual(added, 1, 'document mousemove listener registered while dragging');
  assert.ok(bodyClassAdded, 'mf-window-dragging class applied to body');
  delete global.document;
});

test('first drag converts a flow window to absolute at its current spot', () => {
  global.document = makeFakeDocument();
  MF.WindowManager.windows.length = 0;
  const w = new MF.Window({ title: 'flow', buttons: false });
  const head = w.el.children[0];
  w.el.getBoundingClientRect = () => ({ left: 42, top: 37 });

  head.dispatch('mousedown', { button: 0, clientX: 10, clientY: 10, target: w.el.children[0], preventDefault() {} });
  assert.strictEqual(w.el.style.position, 'absolute', 'converted to absolute');
  assert.strictEqual(w.el.style.margin, '0', 'centering margins cleared');
  assert.strictEqual(w.el.style.left, '42px', 'snapshot left kept');
  assert.strictEqual(w.el.style.top, '37px', 'snapshot top kept');
  delete global.document;
});
