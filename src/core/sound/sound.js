// story: e02s03
// core/sound/sound.js — shared sound registry for Mac Fantasy apps.
// Apps register named sounds and play them via MF.sound.play('name'). The audio
// element is created by this module (not hand-placed in markup) and playback
// uses a clone-and-pause-previous pattern so rapid replays never stack.
// No-ops cleanly where Audio/document are unavailable (e.g. a node test env).
(function (root) {
  'use strict';

  var MF = root.MF || {};

  // name -> { url }  (populated via register; app data, not hard-coded here)
  var sounds = MF.sounds = MF.sounds || {};

  // Lazily-created shared source element (browser only).
  var element = null;
  // The currently-playing clone, paused before the next play.
  var lastClone = null;

  MF.sound = MF.sound || {};

  MF.sound.register = function (name, url) {
    if (!name || !url) {
      throw new Error('MF.sound.register requires a name and a url');
    }
    sounds[name] = { url: url };
    return sounds[name];
  };

  MF.sound.get = function (name) {
    if (!sounds[name]) return null;
    return sounds[name].url;
  };

  // play(name) -> bool. Plays the named sound if it can; returns false if the
  // sound is unknown or playback is unavailable (no Audio / not ready yet).
  MF.sound.play = function (name) {
    var s = sounds[name];
    if (!s) return false;
    if (typeof Audio === 'undefined' || typeof document === 'undefined') return false;

    if (!element) {
      element = new Audio();
      element.src = s.url;
      element.preload = 'auto';
    }

    if (lastClone) { lastClone.pause(); lastClone = null; }

    if (element.readyState < 2) return false; // not ready to play yet

    lastClone = element.cloneNode(true);
    lastClone.currentTime = 0;
    lastClone.play().catch(function () { lastClone = null; });
    return true;
  };

  root.MF = MF;
  if (typeof module !== 'undefined' && module.exports) module.exports = MF;
})(typeof window !== 'undefined' ? window : globalThis);
