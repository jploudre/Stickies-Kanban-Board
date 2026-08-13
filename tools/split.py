#!/usr/bin/env python3
"""
ONE-OFF splitter: converts the single-file index.html into a maintainable src/ tree.

This script exists so the refactor is reproducible from the original artifact.
After running it, you edit files under src/ and rebuild with build.py.

Split output:
  src/index.html          dev shell (links css/js, references assets/ by path)
  src/css/01-fonts.css    @font-face (fonts referenced as ../assets/*.woff2)
  src/css/02-layout.css   base reset, body, transitions, header, menu
  src/css/03-board.css    board / window
  src/css/04-lists.css    list titlebar, list editing
  src/css/05-notes.css    sticky notes
  src/css/06-dragster.css dragster, adjusting, print, etc.
  src/js/01-07.js         logical JS groups (see js/README or names below)
  src/assets/*            decoded binaries (fonts, images, sound)
"""

import re, hashlib, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

# content-hash -> (filename, mime)
ASSETS = {
    '4e1ab3880c': ('favicon-16.png',         'image/png'),
    '6e28d9574b': ('favicon-32.png',         'image/png'),
    '9e7c2b39a6': ('font-espy-regular.woff2', 'font/woff2'),
    'cdfd23bd6b': ('font-espy-bold.woff2',   'font/woff2'),
    '2e609645cf': ('bg-desktop.gif',         'image/gif'),
    '10eecbe1c0': ('window-stripe.png',      'image/png'),
    '595c965771': ('btn-menu-a.png',         'image/png'),
    '4fe79767d8': ('btn-menu-b.png',         'image/png'),
    'd23b47614c': ('icon-apple.png',         'image/png'),
    '0779b1572f': ('sound-pop.wav',          'audio/wav'),
}

uri_pat = re.compile(r'data:[a-zA-Z0-9/+-]+(?:;charset=[^;]+)?;base64,[A-Za-z0-9+/=]+')

def hash_of(uri):
    return hashlib.md5(uri.encode()).hexdigest()[:10]

def find_blocks(src, tag):
    """Return ordered list of (start, end, open_tag, content) for real tags only.
    Skips look-alikes inside script/CSS content by jumping over each block."""
    out = []
    i = 0
    while True:
        m = re.search(r'<%s\b[^>]*>' % tag, src[i:])
        if not m:
            break
        start = i + m.start()
        open_tag = m.group(0)
        content_start = start + len(open_tag)
        close = src.find('</%s>' % tag, content_start)
        if close < 0:
            break
        end = close + len('</%s>' % tag)
        out.append((start, end, open_tag, src[content_start:close]))
        i = end
    return out


def main():
    original = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    for d in ('css', 'js', 'assets'):
        os.makedirs(os.path.join(SRC, d), exist_ok=True)

    def asset_uri(uri):
        return 'data:%s;base64,%s' % (ASSETS[hash_of(uri)][1],
                                      uri.partition(';base64,')[2].rstrip(')=\'"'))

    def to_css_asset(s):
        return uri_pat.sub(lambda m: '../assets/' + ASSETS[hash_of(m.group(0))][0], s)

    def to_html_asset(s):
        return uri_pat.sub(lambda m: 'assets/' + ASSETS[hash_of(m.group(0))][0], s)

    css_spans = find_blocks(original, 'style')
    js_spans = find_blocks(original, 'script')
    print('css blocks:', len(css_spans), ' js blocks:', len(js_spans))
    assert len(css_spans) == 2, 'expected 2 style blocks'
    assert len(js_spans) == 7, 'expected 7 script blocks'

    # ---- CSS files ----------------------------------------------------
    # 01-fonts.css stays separate (needs its own @font-face inlining);
    # all other styles are small enough to live in one app.css.
    css_files = [
        ('01-fonts.css', css_spans[0][3]),   # block A: @font-face only
        ('app.css',      css_spans[1][3]),   # block B: all app styles
    ]

    for name, content in css_files:
        content = to_css_asset(content)
        open(os.path.join(SRC, 'css', name), 'w', encoding='utf-8').write(content)
        print('wrote css/%-16s %6d bytes' % (name, len(content)))

    # ---- JS files ------------------------------------------------------
    js_names = ['01-lib.js', '02-util.js', '03-state.js', '04-model.js',
                '05-drag.js', '06-varadjust.js', '07-app.js']
    for i, (*_, content) in enumerate(js_spans):
        open(os.path.join(SRC, 'js', js_names[i]), 'w', encoding='utf-8').write(content)
        print('wrote js/%-17s %6d bytes' % (js_names[i], len(content)))

    # ---- shell (src/index.html) --------------------------------------
    # Collect ALL structural edits (CSS + JS) in ORIGINAL coordinates, then
    # apply in a single right-to-left pass so earlier offsets stay valid.
    css_links = [f'<link rel="stylesheet" href="css/{n}">' for n, _ in css_files]
    edits = [
        (css_spans[0][0], css_spans[0][1], '\n'.join(css_links[:1])),
        (css_spans[1][0], css_spans[1][1], '\n'.join(css_links[1:])),
    ]
    for jspan, name in zip(js_spans, js_names):
        edits.append((jspan[0], jspan[1], f'<script src="js/{name}"></script>'))

    shell = original
    for a, b, text in sorted(edits, key=lambda e: -e[0]):
        shell = shell[:a] + text + shell[b:]

    # remaining data URIs live only in HTML attributes now -> assets/ paths
    shell = to_html_asset(shell)

    open(os.path.join(SRC, 'index.html'), 'w', encoding='utf-8').write(shell)
    print('wrote src/index.html (%d bytes)' % len(shell))


if __name__ == '__main__':
    main()
