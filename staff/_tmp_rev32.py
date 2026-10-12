# -*- coding: utf-8 -*-
import io
p = 'PRD-提成设置.md'
t = io.open(p, encoding='utf-8').read()

row = ('| 修订（2026-09-20 三十二次） | **改动重算弹窗的提示行改为水平居中**。`§6.13.3` 的提示（ⓘ + 「已经手工改过的订单，金额不受影响。」）'
       '原为**左对齐**，改为**水平居中** —— `.comm2-recalc__note` 增 `justify-content: center`（图标 + 文字**作为一个整体**居中，'
       '不是只居中文字、图标留在左侧）+ `text-align: center`（万一在更窄屏折行，两行文字各自居中）。'
       '实测（Edge headless 390×880）：弹窗内容宽 `284px`、提示行**左右留白各 `30px`**、整体**偏离中心 `0px`**、单行不折行。'
       '同步 §6.13.3 / 开发版 PRD。 |')

anchor = '| 修订（2026-09-20 三十一次） |'
i = t.index(anchor)
j = t.index('\n', i)
assert t.count(anchor) == 1
t = t[:j] + '\n' + row + t[j:]
io.open(p, 'w', encoding='utf-8', newline='').write(t)
print('OK rev inserted')
