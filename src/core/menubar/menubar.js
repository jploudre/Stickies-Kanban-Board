// story: e02s04
// core/menubar/menubar.js — generic Mac menubar component.
// Renders the <header> from a declarative config and routes item clicks through
// a command registry. Owns the generic mechanics (dropdowns, dividers, warn
// flags, flash, enable/disable, color swatches + checkmarks, clock); menu
// *items* stay app data passed in via config.
//
//   MF.menubar.render({ appTitle, clock, menus:[{id,label,items:[…]}] })
//   MF.menubar.on('action', ({action, element}) => …)
//   MF.menubar.on('color-open', () => …)          // user hovered a color menu
//   MF.menubar.setMenuEnabled(id, bool) / setItemEnabled(action, bool)
//   MF.menubar.setActiveColor(color)
//
// Node-safe: render() is a no-op where document is unavailable (tests).
(function (root) {
  'use strict';

  var MF = root.MF || {};
  MF.menubar = MF.menubar || {};

  var handlers = { action: [], 'color-open': [] };
  var clockTimer = null;

  function emit(event, payload) {
    (handlers[event] || []).forEach(function (fn) { fn(payload); });
  }

  function flash(el) {
    el.classList.add('menu-flashing');
    setTimeout(function () { el.classList.remove('menu-flashing'); }, 600);
  }

  // The first class token on an item IS its action name (e.g. 'add-note-first',
  // 'del-board warn' -> 'del-board'). This keeps the DOM classes that CSS and
  // existing UAT depend on, while routing goes through the registry.
  function actionOf(el) {
    return (el.className || '').trim().split(/\s+/)[0];
  }

  function onItemClick(el) {
    if (el.classList.contains('disabled')) return false;
    var li = el.closest('.has-dropdown');
    if (li && li.classList.contains('disabled')) return false;
    flash(el);
    emit('action', { action: actionOf(el), element: el });
    return false;
  }

  function onMenuHover(li) {
    if (li.getAttribute('data-menu') === 'color') {
      emit('color-open', { menu: 'color' });
    }
  }

  function mkItem(item, isColorMenu) {
    var a = document.createElement('a');
    a.href = '#';
    a.className = item.action + (item.warn ? ' warn' : '');
    if (item.value !== undefined) a.setAttribute('data-color', item.value);

    if (isColorMenu && item.value !== undefined) {
      var sw = document.createElement('span');
      sw.className = 'color-swatch';
      sw.setAttribute('data-color', item.value);
      a.appendChild(sw);
      a.appendChild(document.createTextNode(item.label));
    } else {
      a.textContent = item.label;
    }
    return a;
  }

  function mkMenu(menu) {
    var li = document.createElement('li');
    li.className = 'has-dropdown ' + menu.id + '-menu';
    li.setAttribute('data-menu', menu.id);

    var a = document.createElement('a');
    a.href = '#';
    a.textContent = menu.label;
    li.appendChild(a);

    var dd = document.createElement('div');
    dd.className = 'dropdown ' + menu.id + '-dropdown';
    menu.items.forEach(function (item) {
      if (item.divider) {
        var div = document.createElement('div');
        div.className = 'menu-divider';
        dd.appendChild(div);
      } else {
        dd.appendChild(mkItem(item, !!menu.color));
      }
    });
    li.appendChild(dd);
    return li;
  }

  function startClock() {
    var tick = function () {
      var now = new Date();
      var hours = now.getHours();
      var minutes = now.getMinutes().toString().padStart(2, '0');
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      var el = document.getElementById('menubar-clock');
      if (el) el.textContent = hours + ':' + minutes + ampm;
    };
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  }

  MF.menubar.render = function (config) {
    if (typeof document === 'undefined') return null; // node-safe

    var header = document.createElement('header');
    var container = document.createElement('div');
    container.className = 'container';

    // left: apple icon + menus
    var left = document.createElement('nav');
    left.className = 'menu';
    var ul = document.createElement('ul');

    var liIcon = document.createElement('li');
    var iconUrl = config.icon || 'assets/icon-apple.png';
    liIcon.innerHTML = '<a href="#"><img src="' + iconUrl + '" class="icon" alt=""/></a>';
    ul.appendChild(liIcon);

    (config.menus || []).forEach(function (menu) { ul.appendChild(mkMenu(menu)); });
    left.appendChild(ul);
    container.appendChild(left);

    // right: clock + app title
    var right = document.createElement('nav');
    right.className = 'menu right';
    var rUl = document.createElement('ul');
    if (config.clock) {
      var liClock = document.createElement('li');
      liClock.className = 'menubar-clock';
      liClock.innerHTML = '<span id="menubar-clock"></span>';
      rUl.appendChild(liClock);
    }
    var liTitle = document.createElement('li');
    var titleA = document.createElement('a');
    titleA.href = '#';
    titleA.textContent = config.appTitle || '';
    liTitle.appendChild(titleA);
    rUl.appendChild(liTitle);
    right.appendChild(rUl);
    container.appendChild(right);

    header.appendChild(container);

    var old = document.querySelector('header');
    if (old) old.parentNode.replaceChild(header, old);
    else document.body.insertBefore(header, document.body.firstChild);

    header.addEventListener('click', function (ev) {
      var a = ev.target.closest('.dropdown a');
      if (a) { ev.preventDefault(); return onItemClick(a); }
    });
    header.addEventListener('mouseenter', function (ev) {
      var li = ev.target.closest && ev.target.closest('.has-dropdown');
      if (li) onMenuHover(li);
    }, true);

    if (config.clock) startClock();
    return header;
  };

  MF.menubar.on = function (event, fn) {
    (handlers[event] = handlers[event] || []).push(fn);
    return MF.menubar;
  };

  MF.menubar.setMenuEnabled = function (menuId, enabled) {
    if (typeof document === 'undefined') return;
    var li = document.querySelector('header .' + menuId + '-menu');
    if (li) li.classList.toggle('disabled', !enabled);
  };

  MF.menubar.setItemEnabled = function (action, enabled) {
    if (typeof document === 'undefined') return;
    var el = document.querySelector('header .dropdown a.' + action);
    if (el) el.classList.toggle('disabled', !enabled);
  };

  MF.menubar.setActiveColor = function (color) {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('header .color-dropdown a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-color') === color);
    });
  };

  root.MF = MF;
  if (typeof module !== 'undefined' && module.exports) module.exports = MF;
})(typeof window !== 'undefined' ? window : globalThis);
