# -*- coding: utf-8 -*-
import re
src = r'C:\Users\Administrator\.cursor\projects\d-RTB\agent-tools\a3b411dc-8347-4e46-9303-9b4987ec3c66.txt'
lines = open(src, encoding='utf-8').read().splitlines()
pat = re.compile(r'<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"')
targets = {'418:2', '419:2', '421:2'}
active = None
for l in lines:
    indent = len(l) - len(l.lstrip(' '))
    m = pat.search(l)
    if not m:
        continue
    typ, nid, name, x, y, w, h = m.groups()
    depth = indent // 2
    if depth == 1 and nid in targets:
        active = nid
        print('###', nid, 'x='+x, 'y='+y, 'w='+w, 'h='+h)
        continue
    if active and depth == 1 and nid not in targets:
        active = None
    if active and depth in (2, 3, 4):
        # only print summary of non-text structure deep enough to see layout spans
        print('   ' * (depth), nid, typ, name[:14], 'y='+y, 'h='+h)
