# -*- coding: utf-8 -*-
import io, subprocess, sys

def read(p):
    return io.open(p, encoding='utf-8').read()

head = subprocess.run(['git', 'show', 'HEAD:PRD-\u63d0\u6210\u8bbe\u7f6e-\u5f00\u53d1\u7248.md'],
                      capture_output=True).stdout.decode('utf-8')
new = read('PRD-\u63d0\u6210\u8bbe\u7f6e-\u5f00\u53d1\u7248.md')
hl = head.split('\n')
nl = set(new.split('\n'))
missing = [l for l in hl if l.strip() and l not in nl]
print('HEAD 行数', len(hl), ' 新版行数', len(new.split('\n')))
print('=== HEAD 中消失的行 (%d) ===' % len(missing))
for l in missing:
    print('  |', l[:150])
