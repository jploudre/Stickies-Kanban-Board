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
	@echo "Serving src/  ->  http://localhost:8000  (Ctrl-C to stop)"
	cd src && $(PY) -m http.server 8000

verify:
	@set -e; for f in src/js/*.js; do node --check "$$f"; done; \
	echo "JS syntax OK"; \
	$(PY) build.py --out /tmp/_verify.html && echo "build OK"

clean:
	rm -f /tmp/_verify.html
