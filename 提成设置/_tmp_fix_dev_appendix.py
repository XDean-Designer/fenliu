# -*- coding: utf-8 -*-
"""把开发版 PRD 附录 A 的行号索引按本轮改动（comm2.js +1/+6、comm2.css +17、index.html +31）平移，并补新增条目。"""
import io, sys, re

P = r'd:\RTB打补丁工程\提成设置\PRD-提成设置-开发版.md'
s = io.open(P, encoding='utf-8').read()
orig = s

def rep(old, new, cnt=1):
    global s
    if old not in s:
        print('  MISS:', old[:70])
        return
    s = s.replace(old, new, cnt)
    print('  ok  :', new[:70].replace('\n', ' '))

print('--- A.3 comm2.js 行号平移 (+1 / +6) ---')
rep('| 编辑页 / Sheet 开关 | 1244–1421 |', '| 编辑页 / Sheet 开关 | 1244–1422 |')
rep('| **计提引擎**（§8 · §8.1） | 1422–1665 |', '| **计提引擎**（§8 · §8.1） | 1423–1666 |')
rep('| 方案菜单 / 命名 / 复制 / 删除 | 1666–1740 |', '| 方案菜单 / 命名 / 复制 / 删除 | 1667–1741 |')
rep('| **分配员工 Sheet**（§6.6） | 1741–1857 |', '| **分配员工 Sheet**（§6.6） | 1742–1858 |')
rep('| 规则设置 Sheet 渲染 | 1858–2200 |', '| 规则设置 Sheet 渲染 | 1859–2201 |')
rep('| **添加规则项**（§6.5） | 2202–2480 |', '| **添加规则项**（§6.5） | 2203–2481 |')
rep('| **覆盖删除 / 左滑**（§5.5 · §12.4 B1） | 2484–2760 |', '| **覆盖删除 / 左滑**（§5.5 · §12.4 B1） | 2485–2761 |')
rep('| 工位改名 | 2553–2585 · 2763–2830 |', '| 工位改名 | 2554–2586 · 2764–2831 |')

# 新增一行：方案编辑页帮助
anchor = '| 工位改名 | 2554–2586 · 2764–2831 | `applyStationsGlobal`'
i = s.find(anchor)
if i >= 0:
    j = s.find('\n', i)
    add = ('\n| **方案编辑页帮助**（§6.2 · §6.9） | `renderEdit` 1355 · `wire` 2845–2851 | '
           '`renderEdit`（标题写入 **`#comm2EditTitleText`**，别写 `#comm2EditTitle`）· `wire` 里 '
           '`#comm2EditHelpBtn` / `#comm2RuleHelpOk` / `#comm2RuleHelpMask` 三个绑定（打开 / 关闭 / 遮罩关闭） |')
    s = s[:j] + add + s[j:]
    print('  ok  : 新增 A.3 方案编辑页帮助行')
else:
    print('  MISS: A.3 工位改名锚点')

print('--- A.4 comm2.css：选人段起止 +17 ---')
rep('| **1158–1509** | **选择服务员工 Sheet（§12.3 全套动效）** —— 见下表细分 |',
    '| **1156–1170** | **方案编辑页标题 ⓘ + 帮助弹窗条目卡片**（`.title__txt` 省略号 · `.comm2-hint-list` / `.comm2-hint-item` / `__no` / `__t` / `__d`，§6.2 / §6.9） |\n'
    '| **1175–1525** | **选择服务员工 Sheet（§12.3 全套动效）** —— 见下表细分 |')

shifts = [
    ('| 1159–1200 |', '| 1176–1217 |'),
    ('| 1186–1201 |', '| 1203–1218 |'),
    ('| 1202–1232 |', '| 1219–1249 |'),
    ('| 1233–1245 |', '| 1250–1262 |'),
    ('| 1246–1262 |', '| 1263–1279 |'),
    ('| 1263–1272 |', '| 1280–1289 |'),
    ('| **1273–1308** |', '| **1290–1325** |'),
    ('| 1309–1340 |', '| 1326–1357 |'),
    ('| **1341–1400** |', '| **1358–1417** |'),
    ('| 1401–1405 |', '| 1418–1422 |'),
    ('| 1406–1414 |', '| 1423–1431 |'),
    ('| 1415–1442 |', '| 1432–1459 |'),
    ('| 1443–1446 |', '| 1460–1463 |'),
    ('| 1447–1509 |', '| 1464–1525 |'),
]
for a, b in shifts:
    rep(a, b)

print('--- A.5 index.html 行号平移 (+31 after 462) ---')
rep('| 463–530 | 未分配名单 · 方案菜单 · 方案命名 / 重命名 · 删除确认 · **分配员工 Sheet `#comm2AssignMask`**',
    '| 463–491 | **方案编辑页帮助**「提成怎么设、钱怎么算」`#comm2RuleHelpMask`（`comm2-hint-list` 两节 5 + 8 条序号卡片，§6.9） |\n'
    '| 492–559 | 未分配名单 · 方案菜单 · 方案命名 / 重命名 · 删除确认 · **分配员工 Sheet `#comm2AssignMask`**')
rep('| 532–545 | 「多方案规则」帮助弹窗 |', '| 561–574 | 「多方案规则」帮助弹窗（**列表页**，内容与触发均未改） |')

print('--- A.6 定位技巧新增一行 ---')
tail = '| 旧数据迁移不对 | `comm2.js` → `migrateExtraFields` / `migratePerValueModes` / `applyExtraSplitFlag`（§6.3） |'
i = s.find(tail)
if i >= 0:
    j = s.find('\n', i)
    add = ('\n| 方案编辑页标题的 ⓘ 不见了 / 方案名不截断 | `index.html` → `#comm2EditTitle`（外层）＋ `#comm2EditTitleText`（文字）＋ `#comm2EditHelpBtn`；'
           '`comm2.js:1355` `renderEdit`（**只写内层 span**）；`comm2.css:1156–1170`（`.title__txt` 省略号） |'
           '\n| 帮助弹窗文案 / 条目样式不对 | `index.html` → `#comm2RuleHelpMask`（**文案原文见 §6.9 附表**）；`comm2.css:1156–1170`（`.comm2-hint-item*`，'
           '两条规则须写 `.emp-help-body .comm2-hint-item__*` 才不被 `.emp-help-body p` 覆盖） |')
    s = s[:j] + add + s[j:]
    print('  ok  : 新增 A.6 两行')
else:
    print('  MISS: A.6 锚点')

io.open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('\nchanged:', s != orig, '| 行数', len(s.splitlines()))
