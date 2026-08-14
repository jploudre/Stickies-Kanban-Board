# Stickies Kanban Board — build / dev convenience wrapper around build.py
#
#   make          build the single-file index.html from src/
#   make watch    rebuild index.html automatically when src/ changes
#   make dev      serve src/ locally so you can work on the split files
#   make verify   syntax-check the JS and confirm the build is up to date
#
# Everything ultimately delegates to build.py (the actual logic lives there).

PY ?= python3

.PHONY: build watch dev verify clean

build:
	$(PY) build.py

watch:
	$(PY) build.py --watch

dev: ## serve src/ (the split, non-inlined development files)
	@echo "Serving src/  ->  http://localhost:8000/apps/stickies/index.html  (Ctrl-C to stop)"
	cd src && $(PY) -m http.server 8000

verify:
	@set -e; for f in $$(find src -name '*.js' | sort); do node --check "$$f"; done; \
	echo "JS syntax OK"; \
	bash tools/check-css.sh; \
	$(PY) build.py --out /tmp/_verify.html && echo "build OK"; \
	bash tools/build-diff.sh; \
	bash tools/run-tests.sh

clean:
	rm -f /tmp/_verify.html /tmp/_builddiff_*.html
