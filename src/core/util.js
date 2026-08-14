// story: e02s01, e05s02

	Number.prototype.clamp = function(min, max)
	{
		return Math.min(Math.max(this, min), max);
	};

	/*
	 *	add a blank line to push 'Prevent this page from opening ...'
	 *	tack-on from the actual message we are trying to display
	 */
	if (typeof window !== 'undefined') {
		var confirm_org = window.confirm;
		var alert_org   = window.alert;
		window.confirm = function(msg) { return confirm_org(msg + "\n "); }
		window.alert   = function(msg) { return alert_org  (msg + "\n "); }
	}

	/*
	 *	shared pure helpers (MF namespace; node-safe so tests can require this)
	 */
	(function (root) {
		var MF = root.MF || (root.MF = {});

		// formatClock(totalSeconds) -> "MM:SS" (leading zeros). Used by any app
		// with a countdown (the Pomodoro timer); was duplicated in tests before
		// being promoted here (e05s02).
		MF.formatClock = function (totalSeconds) {
			var m = Math.floor(totalSeconds / 60);
			var s = totalSeconds % 60;
			return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
		};

		if (typeof module !== 'undefined' && module.exports) module.exports = MF;
	})(typeof window !== 'undefined' ? window : globalThis);
