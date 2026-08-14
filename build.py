#!/usr/bin/env python3
# story: e04s01
"""
Assemble the single-file production artifact `index.html` from the `src/` tree.

The repo ships as ONE self-contained index.html (CSS + JS + binaries inlined as
data: URIs), but is developed as small, logically-grouped files under src/.
This script is the only step that turns those source files back into the single
distribution file.

Usage:
    python3 build.py                 # write index.html at repo root
    python3 build.py --out FILE       # write to a specific path
    python3 build.py --watch          # rebuild automatically on change

Or via the Makefile:   make        (build)      make watch    make dev
"""

import argparse
import base64
import mimetypes
import os
import re
import sys
import time


ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def load_assets():
    """name -> "data:<mime>;base64,<b64>" for every file under src (recursive).

    Walks the whole src/ tree so core/theme/assets and future app assets are all
    inlinable; assets are keyed by basename. A duplicate basename across dirs is
    a warning, not a failure (first one wins deterministically by walk order).
    """
    assets = {}
    for dirpath, _, fns in os.walk(SRC):
        for fn in sorted(fns):
            path = os.path.join(dirpath, fn)
            if not os.path.isfile(path):
                continue
            mime = mimetypes.guess_type(fn)[0] or 'application/octet-stream'
            data = base64.b64encode(open(path, 'rb').read()).decode()
            if fn in assets:
                sys.stderr.write('WARNING: duplicate asset name %r (keeping first)\n' % fn)
            assets[fn] = 'data:%s;base64,%s' % (mime, data)
    return assets


CSS_LINK = re.compile(r'<link rel="stylesheet" href="([^"]+\.css)">')
SCRIPT_SRC = re.compile(r'<script src="([^"]+\.js)"></script>')


# Every asset reference resolves to a basename that load_assets() knows, so the
# reference's path prefix (relative to its file) is irrelevant: any number of
# ../ or directory segments before assets/NAME collapses to the inlined data URI.
ASSET_REF = re.compile(r'(?:\.\./|[\w.-]+/)*assets/([A-Za-z0-9._-]+)')


def app_shell(app):
    """Path to the app's shell index.html (composes core + app files)."""
    return os.path.join(SRC, 'apps', app, 'index.html')


def build(out=None, app='stickies'):
    if out is None:
        out = os.path.join(ROOT, 'index.html')
    shell_path = app_shell(app)
    shell_dir = os.path.dirname(shell_path)
    shell = read(shell_path)
    assets = load_assets()

    def inline(s):
        # replace any assets/NAME reference (any path prefix) with its data URI
        s = re.sub(ASSET_REF, lambda m: assets[m.group(1)], s)
        return s

    def read_rel(rel):
        # hrefs/srcs are relative to the shell file (e.g. '../core/theme/fonts.css')
        return read(os.path.normpath(os.path.join(shell_dir, rel)))

    # --- CSS: concatenate every css file (in <link> order) into ONE <style> ---
    css_links = CSS_LINK.findall(shell)          # e.g. ['../core/theme/fonts.css', ...]
    css_all = '\n'.join(inline(read_rel(n)) for n in css_links)
    # replace first css link with the combined <style>, drop the rest
    shell = CSS_LINK.sub('', shell, count=len(css_links) - 1)  # remove links 2..n
    shell = CSS_LINK.sub(lambda m: '<style>\n' + css_all + '\n</style>', shell, count=1)

    # --- JS: each <script src> becomes an inline <script> block ---
    def js_repl(m):
        return '<script>\n' + inline(read_rel(m.group(1))) + '\n</script>'
    shell = SCRIPT_SRC.sub(js_repl, shell)

    # --- any remaining asset references in HTML -> data URIs ---
    shell = inline(shell)

    # sanity check: nothing un-inlined should remain
    leftover = re.findall(r'(?:src|href)="[^"]*assets/[^"]+"', shell)
    if leftover:
        sys.stderr.write('WARNING: unresolvable asset references remain:\n')
        for x in leftover:
            sys.stderr.write('  ' + x + '\n')
    if shell.count('<style>') != shell.count('</style>'):
        sys.stderr.write('WARNING: unbalanced <style> blocks\n')

    with open(out, 'w', encoding='utf-8') as f:
        f.write(shell)
    print('Built %s  (%d bytes, %d css files, %d js files, %d assets inlined)'
          % (out, len(shell.encode()), len(css_links),
             len(SCRIPT_SRC.findall(read(shell_path))), len(assets)))


def watch():
    import glob
    shell = app_shell('stickies')
    paths = [shell, *glob.glob(os.path.join(SRC, '**', '*'), recursive=True)]
    mtimes = {p: os.path.getmtime(p) for p in paths}
    print('Watching src/ — Ctrl-C to stop')
    try:
        while True:
            time.sleep(0.8)
            changed = False
            for p in paths:
                if not os.path.exists(p):
                    continue
                t = os.path.getmtime(p)
                if t != mtimes[p]:
                    mtimes[p] = t
                    changed = True
            if changed:
                build()
    except KeyboardInterrupt:
        print('\nstopped')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--watch', action='store_true', help='rebuild on change')
    ap.add_argument('--app', default='stickies', help='which app under src/apps/ to build')
    ap.add_argument('--out', default=os.path.join(ROOT, 'index.html'))
    args = ap.parse_args()
    if args.watch:
        watch()
    else:
        build(args.out, app=args.app)


if __name__ == '__main__':
    main()
