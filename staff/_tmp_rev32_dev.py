# -*- coding: utf-8 -*-
import io
p = 'PRD-提成设置-开发版.md'
t = io.open(p, encoding='utf-8').read()
row = ('| 09-20 三十二 | **改动重算弹窗提示行改水平居中**：`.comm2-recalc__note` 加 `justify-content: center` + `text-align: center`'
       '（图标 + 文字作为**整体**居中）；实测弹窗内容宽 `284px`、左右留白各 `30px`、偏离中心 `0px`、单行不折行 | §6.13.3 |')
i = t.index('| 09-20 三十一 |')
j = t.index('\n', i)
assert t.count('| 09-20 三十一 |') == 1
t = t[:j] + '\n' + row + t[j:]
io.open(p, 'w', encoding='utf-8', newline='').write(t)
print('OK dev summary row inserted')
