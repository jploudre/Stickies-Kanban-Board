// story: e02s05, e06s01
// core/window/window.js — generic Mac window component + manager.
// MF.Window owns the strip-pattern titlebar, centered title, the close/maximize
// buttons, and (since e06s01) dragging the window by its titlebar.
// MF.WindowManager positions windows on the desktop and manages z-order/focus.
//
//   var w = new MF.Window({ title, content, width, height, x, y, onClose })
//   MF.WindowManager.add(w) / remove(w)   (auto-added by the constructor)
//
// Dragging: press and move on the .window-title head to reposition the window.
// A flow-layout window (no x/y) is converted to absolute positioning at its
// current spot on first drag. Set { draggable: false } to disable.
//
// Node-safe: without a document the element is not built, but the manager
// registry, window metadata, and draggable flag still work (tests).
(function (root) {
  'use strict';

  var MF = root.MF || {};

  var seq = 0;         // per-session window id counter
  var zBase = 100;     // below the menubar (z-index 999), above page content

  function Window(opts) {
    opts = opts || {};
    this.id = 'mf-window-' + (++seq);
    this.title = opts.title || '';
    this.width = opts.width !== undefined ? opts.width : 480;
    this.height = opts.height !== undefined ? opts.height : 360;
    this._hasW = opts.width !== undefined;
    this._hasH = opts.height !== undefined;
    this.x = (opts.x !== undefined) ? opts.x : null;
    this.y = (opts.y !== undefined) ? opts.y : null;
    this.onClose = opts.onClose || null;
    this.content = opts.content || null;
    // Whether the titlebar shows the close/maximize chrome buttons. A flow-layout
    // window (e.g. a board) can opt out with { buttons: false }.
    this.buttons = opts.buttons !== false;
    // Whether pressing and dragging the titlebar moves the window. On by default
    // so every Mac window is draggable; an app can opt out with { draggable: false }.
    this.draggable = opts.draggable !== false;
    // Optional custom titlebar content: an element (or array of elements) that
    // replaces the default span.title — lets an app embed an editable title.
    this.titleEl = opts.titleEl || null;
    this.el = null;    // DOM element, built lazily in build() (browser only)
    this.contentEl = null;

    if (typeof document !== 'undefined') this.build();

    MF.WindowManager.add(this);
  }

  Window.prototype.build = function () {
    var w = document.createElement('div');
    w.className = 'window window-focus';
    w.id = this.id;
    // Only constrain when the app asked for a size (a flow-layout window like
    // the kanban board keeps its CSS max-content sizing).
    if (this._hasW) w.style.width = this.width + 'px';
    if (this._hasH) w.style.height = this.height + 'px';

    var head = document.createElement('div');
    head.className = 'window-title head';

    if (this.buttons) {
      var close = document.createElement('a');
      close.className = 'btn-close';
      close.href = '#';
      head.appendChild(close);
    }

    if (this.titleEl) {
      (Array.isArray(this.titleEl) ? this.titleEl : [this.titleEl]).forEach(function (el) {
        head.appendChild(el);
      });
    } else {
      var title = document.createElement('span');
      title.className = 'title';
      var text = document.createElement('span');
      text.className = 'text';
      text.textContent = this.title;
      title.appendChild(text);
      head.appendChild(title);
    }
    if (this.buttons) {
      var maxi = document.createElement('a');
      maxi.className = 'btn-maximize';
      maxi.href = '#';
      head.appendChild(maxi);
    }

    var content = document.createElement('div');
    content.className = 'window-content';
    if (this.content) {
      if (typeof this.content === 'string') content.innerHTML = this.content;
      else content.appendChild(this.content);
    }

    w.appendChild(head);
    w.appendChild(content);
    this.el = w;
    this.contentEl = content;

    this._enableTitleDrag(head);
    return w;
  };

  // Let the window be moved by pressing and dragging its titlebar. Handlers run
  // in the browser only (no document here means no-op, keeping tests node-safe).
  Window.prototype._enableTitleDrag = function (head) {
    var self = this;
    if (typeof document === 'undefined' || !head.addEventListener) return;
    head.addEventListener('mousedown', function (ev) {
      self._beginDrag(ev);
    });
  };

  Window.prototype._beginDrag = function (ev) {
    if (!this.draggable || ev.button !== 0) return;
    // Never hijack the titlebar's own controls (close/maximize, an edit field).
    if (ev.target && ev.target.closest && ev.target.closest('a, input, .edit')) return;
    ev.preventDefault();

    var el = this.el;
    var scrollX = (typeof window !== 'undefined' && window.pageXOffset) || 0;
    var scrollY = (typeof window !== 'undefined' && window.pageYOffset) || 0;

    // A flow-layout window has no inline position; snapshot its current on-screen
    // spot and switch to absolute so we can move it. Snapshot the rect first, then
    // clear the centering margins (e.g. the board's `28px auto`), then position at
    // the captured spot so the window doesn't jump. Width/min/max are untouched.
    if (!el.style.position) {
      var rect = el.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.margin = '0';
      el.style.left = (rect.left + scrollX) + 'px';
      el.style.top = (rect.top + scrollY) + 'px';
    }

    var startX = ev.clientX;
    var startY = ev.clientY;
    var startLeft = parseInt(el.style.left, 10) || 0;
    var startTop = parseInt(el.style.top, 10) || 0;

    function onMove(e) {
      el.style.left = (startLeft + e.clientX - startX) + 'px';
      el.style.top = (startTop + e.clientY - startY) + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (document.body && document.body.classList) document.body.classList.remove('mf-window-dragging');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    if (document.body && document.body.classList) document.body.classList.add('mf-window-dragging');
  };

  MF.Window = Window;

  MF.WindowManager = {
    windows: [],

    add: function (w) {
      if (this.windows.indexOf(w) !== -1) return this;
      this.windows.push(w);
      if (typeof document !== 'undefined' && w.el) {
        // Windows with an explicit position are placed on the desktop; others
        // (e.g. a centered flow-layout board) keep their CSS layout.
        if (w.x !== null || w.y !== null) {
          w.el.style.position = 'absolute';
          if (w.x !== null) w.el.style.left = w.x + 'px';
          if (w.y !== null) w.el.style.top = w.y + 'px';
        }
        w.el.style.zIndex = String(zBase + this.windows.length);
        document.body.appendChild(w.el);
      }
      return this;
    },

    remove: function (w) {
      var i = this.windows.indexOf(w);
      if (i === -1) return this;
      this.windows.splice(i, 1);
      if (typeof document !== 'undefined' && w.el && w.el.parentNode) {
        w.el.parentNode.removeChild(w.el);
      }
      return this;
    },

    count: function () { return this.windows.length; },

    top: function () {
      return this.windows.length ? this.windows[this.windows.length - 1] : null;
    },
  };

  root.MF = MF;
  if (typeof module !== 'undefined' && module.exports) module.exports = MF;
})(typeof window !== 'undefined' ? window : globalThis);
