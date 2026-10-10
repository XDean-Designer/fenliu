# -*- coding: utf-8 -*-
import io
p = 'PRD-提成设置-开发版.md'
t = io.open(p, encoding='utf-8').read()
bad = t[t.index('> \u4f9d\u8d56\uff1a'):]
bad = bad[:bad.index('\n')]
good = ('> \u4f9d\u8d56\uff1a\u672c\u6587\u53ea\u7528\u5230\u5458\u5de5\u85aa\u8d44\u4fa7\u7684 2 \u4e2a**\u53ea\u8bfb**\u63a5\u53e3'
        '\uff08`getPeriodInfo` / `getCurrentPeriodInfo`\uff1b\u4e8c\u5341\u516b\u6b21\u8d77 `countEffectiveCommLines` '
        '\u5df2\u968f\u5f71\u54cd\u9762\u5c55\u793a\u5220\u9664\uff0c\u4e09\u5341\u4e00\u6b21\u8d77 `nextPeriodInfo` '
        '\u5df2\u968f `next` \u53e3\u5f84\u5220\u9664\uff09\uff0c\u7ed3\u7b97\u5468\u671f\u672c\u8eab\u7684\u5b9a\u4e49\u89c1 '
        '**\u6e90 PRD \u00a76.12.3**\u3002')
assert t.count(bad) == 1, t.count(bad)
t = t.replace(bad, good, 1)
io.open(p, 'w', encoding='utf-8', newline='').write(t)
print('OK')
