#!/usr/bin/env python3
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
    """name -> "data:<mime>;base64,<b64>" for every file under src/assets."""
    assets = {}
    for fn in sorted(os.listdir(os.path.join(SRC, 'assets'))):
        path = os.path.join(SRC, 'assets', fn)
        if not os.path.isfile(path):
            continue
        mime = mimetypes.guess_type(fn)[0] or 'application/octet-stream'
        if mime == 'image/svg+xml':
            # SVG may be inlined as plain (readable) text
            assets[fn] = 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())
        else:
            assets[fn] = 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())
    return assets


CSS_LINK = re.compile(r'<link rel="stylesheet" href="css/([^"]+)">')
SCRIPT_SRC = re.compile(r'<script src="js/([^"]+)"></script>')


def build():
    shell = read(os.path.join(SRC, 'index.html'))
    assets = load_assets()

    def inline(s):
        # replace ../assets/NAME (css files) and assets/NAME (html attrs)
        s = re.sub(r'(\.\./)?assets/([A-Za-z0-9._-]+)', lambda m: assets[m.group(2)], s)
        return s

    # --- CSS: concatenate every css file (in <link> order) into ONE <style> ---
    css_links = CSS_LINK.findall(shell)          # e.g. ['01-fonts.css', ...]
    css_all = '\n'.join(inline(read(os.path.join(SRC, 'css', n))) for n in css_links)
    # replace first css link with the combined <style>, drop the rest
    shell = CSS_LINK.sub('', shell, count=len(css_links) - 1)  # remove links 2..n
    shell = CSS_LINK.sub(lambda m: '<style>\n' + css_all + '\n</style>', shell, count=1)

    # --- JS: each <script src> becomes an inline <script> block ---
    def js_repl(m):
        return '<script>\n' + inline(read(os.path.join(SRC, 'js', m.group(1)))) + '\n</script>'
    shell = SCRIPT_SRC.sub(js_repl, shell)

    # --- any remaining asset references in HTML -> data URIs ---
    shell = inline(shell)

    # sanity check: nothing un-inlined should remain
    leftover = re.findall(r'(?:src|href)="(?:\.\./)?assets/[^"]+"', shell)
    if leftover:
        sys.stderr.write('WARNING: unresolvable asset references remain:\n')
        for x in leftover:
            sys.stderr.write('  ' + x + '\n')
    if shell.count('<style>') != shell.count('</style>'):
        sys.stderr.write('WARNING: unbalanced <style> blocks\n')

    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(shell)
    print('Built %s  (%d bytes, %d css files, %d js files, %d assets inlined)'
          % (out, len(shell.encode()), len(css_links),
             len(SCRIPT_SRC.findall(read(os.path.join(SRC, 'index.html')))), len(assets)))


def watch():
    import glob
    paths = [os.path.join(SRC, 'index.html'), *glob.glob(os.path.join(SRC, 'css', '*.css')),
             *glob.glob(os.path.join(SRC, 'js', '*.js')), *glob.glob(os.path.join(SRC, 'assets', '*'))]
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
    ap.add_argument('--out', default=os.path.join(ROOT, 'index.html'))
    args = ap.parse_args()
    if args.watch:
        watch()
    else:
        build()


if __name__ == '__main__':
    main()
