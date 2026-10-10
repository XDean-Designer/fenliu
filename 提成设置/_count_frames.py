# -*- coding: utf-8 -*-
import re, collections
src = r'C:\Users\Administrator\.cursor\projects\d-RTB\agent-tools\a3b411dc-8347-4e46-9303-9b4987ec3c66.txt'
lines = open(src, encoding='utf-8').read().splitlines()
tops = [l for l in lines if l.startswith('  <frame ') or l.startswith('  <section ')]
pat = re.compile(r'<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"')
out = []
for l in tops:
    m = pat.search(l)
    if m:
        out.append((m.group(3), m.group(2), m.group(6), m.group(7)))
print('count=', len(out))
for n, i, w, h in out:
    print(n, '|', i, '|', w, 'x', h)
names = [n for n, _, _, _ in out]
dups = [k for k, v in collections.Counter(names).items() if v > 1]
print('dup names:', dups)
