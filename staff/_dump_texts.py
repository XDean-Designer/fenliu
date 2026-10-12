# -*- coding: utf-8 -*-
import re, io
src = r'C:\Users\Administrator\.cursor\projects\d-RTB\agent-tools\a3b411dc-8347-4e46-9303-9b4987ec3c66.txt'
lines = open(src, encoding='utf-8').read().splitlines()
pat = re.compile(r'<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"')
targets = set('408:2 409:2 418:2 419:2 421:2 423:2 424:2 425:2'.split())
active = None
texts = {}
maxy = {}
for l in lines:
    indent = len(l) - len(l.lstrip(' '))
    m = pat.search(l)
    if not m:
        continue
    typ, nid, name, x, y, w, h = m.groups()
    depth = indent // 2
    if depth == 1:
        active = nid if nid in targets else None
        if active:
            texts[active] = []
            maxy[active] = 0
        continue
    if not active:
        continue
    try:
        yy = float(y); hh = float(h)
        if yy + hh > maxy[active] and hh > 0:
            maxy[active] = yy + hh
    except ValueError:
        pass
    if typ == 'text' and name.strip():
        texts[active].append(name)

out = io.StringIO()
for t in sorted(targets, key=lambda s: int(s.split(':')[0])):
    out.write('### %s maxBottomY=%.0f\n' % (t, maxy.get(t, 0)))
    out.write('   texts: ' + ' / '.join(texts.get(t, [])) + '\n')
open('_frame_texts.txt', 'w', encoding='utf-8').write(out.getvalue())
print('done')
