# -*- coding: utf-8 -*-
import re
src = r'C:\Users\Administrator\.cursor\projects\d-RTB\agent-tools\a3b411dc-8347-4e46-9303-9b4987ec3c66.txt'
lines = open(src, encoding='utf-8').read().splitlines()
pat = re.compile(r'<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"')
targets = {'418:2', '419:2', '421:2', '406:2', '410:2', '415:2'}
# capture text node contents (name) inside each target, plus deepest y extent
active = None
depth_active = 0
texts = {t: [] for t in targets}
maxy = {t: 0 for t in targets}
for l in lines:
    indent = len(l) - len(l.lstrip(' '))
    m = pat.search(l)
    if not m:
        continue
    typ, nid, name, x, y, w, h = m.groups()
    depth = indent // 2
    if depth == 1:
        active = nid if nid in targets else None
        depth_active = depth
        continue
    if not active:
        continue
    if nid not in targets:
        # inside active subtree
        try:
            yy = float(y); hh = float(h); xx = float(x)
            if yy + hh > maxy[active] and hh > 0:
                maxy[active] = yy + hh
        except ValueError:
            pass
        if typ == 'text' and name.strip():
            texts[active].append(name)
for t in targets:
    print('###', t, 'maxBottomY=', round(maxy[t], 1))
    print('    sampleTexts:', ' / '.join(texts[t][:40]))
