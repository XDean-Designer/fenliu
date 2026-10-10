# -*- coding: utf-8 -*-
import io
ht = io.open('PRD-提成设置.html', encoding='utf-8').read()
md = io.open('PRD-提成设置.md', encoding='utf-8').read()
keys = ['--sp-uncheck-red: 30ms;', 'function spCollapseMorph(done)',
        'function spAnimateStaffMorphLayout(grid)', 'staff-card__panel--base',
        'data-face="base"', 't === mask', 'data-staff-card-hit']
for k in keys:
    print('%-45s html=%d md=%d' % (k, ht.count(k), md.count(k)))
print('html <pre blocks:', ht.count('<pre'))
print('md fenced blocks:', md.count('```') // 2)
print('md lines:', md.count('\n') + 1, '| html lines:', ht.count('\n') + 1)
