// story: e05s01
// Pomodoro Timer — second Mac Fantasy App, built from core/ alone (e05).
// Uses MF namespace, theme, menubar (config), window, and sound. Anything it
// needed that core lacked was promoted into core (see core-gaps.md).
(function (root) {
  'use strict';

  var MF = root.MF || {};

  // Register the app so a future desktop layer can discover it.
  MF.register({ name: 'pomodoro', title: 'Pomodoro Timer', defaultWidth: 320, defaultHeight: 220 });

  // Shared chime (core/sound asset; same retro pop used by Stickies).
  MF.sound.register('chime', '../../core/sound/assets/sound-pop.wav');

  var WORK_SECONDS = 25 * 60;

  var state = {
    total: WORK_SECONDS,
    left: WORK_SECONDS,
    running: false,
    timer: null,
  };

  function renderTime() {
    var el = root.document.getElementById('pomo-time');
    if (el) el.textContent = MF.formatClock(state.left);
    var btn = root.document.getElementById('pomo-toggle');
    if (btn) btn.textContent = state.running ? 'Pause' : 'Start';
  }

  function tick() {
    if (state.left > 0) {
      state.left -= 1;
      renderTime();
      return;
    }
    pause();
    MF.sound.play('chime');
  }

  function start() {
    if (state.running) return;
    state.running = true;
    state.timer = setInterval(tick, 1000);
    renderTime();
  }

  function pause() {
    state.running = false;
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    renderTime();
  }

  function reset() {
    pause();
    state.left = state.total;
    renderTime();
  }

  // Menubar actions route through the core registry.
  MF.menubar.on('action', function (payload) {
    if (payload.action === 'pomo-start') start();
    else if (payload.action === 'pomo-pause') pause();
    else if (payload.action === 'pomo-reset') reset();
  });

  MF.menubar.render({
    appTitle: 'Pomodoro Timer',
    icon: '../../core/menubar/assets/icon-apple.png',
    clock: true,
    menus: [
      {
        id: 'file',
        label: 'File',
        items: [
          { label: 'Start', action: 'pomo-start' },
          { label: 'Pause', action: 'pomo-pause' },
          { divider: true },
          { label: 'Reset', action: 'pomo-reset' },
        ],
      },
    ],
  });

  var win = new MF.Window({
    title: 'Pomodoro Timer',
    width: 320,
    height: 220,
    x: 90,
    y: 70,
    content: '<div class="pomo">'
      + '<div class="pomo-time" id="pomo-time"></div>'
      + '<div class="pomo-controls">'
      + '  <button class="pomo-btn" id="pomo-toggle">Start</button>'
      + '  <button class="pomo-btn" id="pomo-reset">Reset</button>'
      + '</div>'
      + '</div>',
  });

  win.contentEl.querySelector('#pomo-toggle').addEventListener('click', function () {
    if (state.running) pause(); else start();
  });
  win.contentEl.querySelector('#pomo-reset').addEventListener('click', reset);

  renderTime();
})(typeof window !== 'undefined' ? window : globalThis);
