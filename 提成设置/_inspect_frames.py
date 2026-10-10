# -*- coding: utf-8 -*-
import re
src = r'C:\Users\Administrator\.cursor\projects\d-RTB\agent-tools\a3b411dc-8347-4e46-9303-9b4987ec3c66.txt'
lines = open(src, encoding='utf-8').read().splitlines()
pat = re.compile(r'<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"')
# find depth-0 frames for target ids and print their direct children summary
targets = {'418:2', '419:2', '421:2', '406:2'}
stack = []
for l in lines:
    indent = len(l) - len(l.lstrip(' '))
    if '<frame ' not in l and '<text ' not in l and '<section ' not in l:
        continue
    m = pat.search(l)
    if not m:
        continue
    typ, nid, name, x, y, w, h = m.groups()
    depth = indent // 2
    if nid in targets and depth == 1:
        print('###', nid, name, 'x='+x, 'y='+y, 'w='+w, 'h='+h)
        continue
    if depth == 2:
        print('   ', nid, name, 'x='+x, 'y='+y, 'w='+w, 'h='+h)
