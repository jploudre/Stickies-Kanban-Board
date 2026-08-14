// story: e02s01
// core/shell.js — MF namespace + app-registration API.
// Every Mac Fantasy App module publishes under the single `window.MF` namespace
// so shared core (theme, sound, menubar, window) can be composed without globals
// colliding across apps. Load this file before any other core module.
(function (root) {
  'use strict';

  var MF = root.MF || {};

  // Apps registered by name (a later desktop/icon layer may consume this).
  MF.apps = MF.apps || {};

  // register(meta) -> stored metadata. Each app calls this once at startup.
  // meta: { name, title, defaultWidth, defaultHeight }
  MF.register = function (meta) {
    if (!meta || !meta.name) {
      throw new Error('MF.register requires a meta object with a name');
    }
    MF.apps[meta.name] = Object.assign({}, meta);
    return MF.apps[meta.name];
  };

  root.MF = MF;
  if (typeof module !== 'undefined' && module.exports) module.exports = MF;
})(typeof window !== 'undefined' ? window : globalThis);
