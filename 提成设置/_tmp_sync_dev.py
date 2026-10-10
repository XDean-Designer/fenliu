# -*- coding: utf-8 -*-
"""把源 PRD 的「三十一次」终态逐段搬运到开发版 PRD（只动被改到的段，其余零改动）"""
import io

SRC = 'PRD-提成设置.md'
DEV = 'PRD-提成设置-开发版.md'
src = io.open(SRC, encoding='utf-8').read()
dev = io.open(DEV, encoding='utf-8').read()
changed = []

def cut(s, start, end):
    i = s.index(start)
    j = s.index(end, i)
    return i, j, s[i:j]

def swap(text, start, end, new_block, label):
    i, j, _ = cut(text, start, end)
    changed.append(label)
    return text[:i] + new_block + text[j:]

# 1) §6.13.2 ~ §6.13.7 整段
s, e, blk = cut(src, '### 6.13.2 两种口径', '### 6.13.8 弹窗未回答就退出')
dev = swap(dev, '### 6.13.2 三种口径', '### 6.13.8 弹窗未回答就退出', blk, '§6.13.2–6.13.7')

# 2) §6.13 章首「依赖」注
_, _, dep = cut(dev, '> 依赖：本文只用到员工薪资侧', '\n')
new_dep = dep.replace(' 3 个**只读**接口', ' 2 个**只读**接口').replace(
    '已随影响面展示删除）', '已随影响面展示删除，三十一次起 `nextPeriodInfo` 已随 `next` 口径删除）')
assert new_dep != dep
dev = dev.replace(dep, new_dep, 1); changed.append('§6.13 依赖注')

# 3) §7.1 字段表（4 行 → 3 行）
_, _, rows = cut(src, "| effectiveMode | `'recalc'`", '| _v3 | boolean |')
i, j, _ = cut(dev, "| effectiveMode | `'recalc'`", '| _v3 | boolean |')
dev = dev[:i] + rows + dev[j:]; changed.append('§7.1 字段表')

# 4) §9.1 文案清单（该行）
def line(t, prefix):
    i, j, _ = cut(t, prefix, '\n')
    return t[i:j]
src_l, dev_l = line(src, '**方案改动重算弹窗（§6.13'), line(dev, '**方案改动重算弹窗（§6.13')
dev = dev.replace(dev_l, src_l, 1); changed.append('§9.1 文案清单')

# 5) §10.2 用例 56o2 / 56o3 / 56o4 / 56o5 / 56o6 / 56o7
for pid in ['56o2. ', '56o3. ', '56o4. ', '56o5. ', '56o6. ', '56o7. ']:
    dev = dev.replace(line(dev, pid), line(src, pid), 1)
    changed.append('§10.2 ' + pid.strip())

# 6) §8 规则 33（dev 的 33 是本节最后一条，锚点用 §8.1 标题）
_, _, rb = cut(src, '33. **方案改动后的本期重算口径', '\n\n## 8.1 试算口径')
dev = swap(dev, '33. **方案改动后的本期重算口径', '\n\n## 8.1 试算口径', rb, '§8 规则 33')

# 7) 版本摘要表：在「09-20 三十」行之后插入「09-20 三十一」
row = ('| 09-20 三十一 | **改动重算弹窗「三选一 → 两枚按钮即两个结果」**（领导拍板取消「本期不动，下期换」）：'
       '口径收敛为 `recalc` / `forward` 两种（**删 `next`**）；删除开关与两枚并排按钮，改**两枚竖排按钮** —— '
       '上「本期全部重算」= `recalc`、下「从现在起用新方案」= `forward`（新增 `.dialog__actions--stack`）；'
       '连带清 `schForLine` 的 `next` 分支 / `cmNextPeriod()` / `schemePendingNext()` / 列表页「下期生效」角标 / '
       '`COMM2_EFFECTIVE_LABEL` / `effectiveFrom` 字段 / `EmployeeDemo.nextPeriodInfo()` / `recalcNowLabel()` / '
       '`recalcSyncUi()` / `recalcState.scope`；§7.1 字段 4 → **3 个**；抓取路由 `comm2-recalc-next` / `comm2-recalc-on` → '
       '**`comm2-recalc-all`** / **`comm2-recalc-forward`** | §6.13.2 · §6.13.3 · §6.13.4 · **§6.13.5（作废）** · '
       '§6.13.6 · §6.13.7 · §7.1 · §8 规则 33 · §9.1 · §10.2 |')
anchor = [l for l in dev.split('\n') if l.startswith('| 09-20 三十 |')]
assert len(anchor) == 1, '找不到「09-20 三十」行'
dev = dev.replace(anchor[0], row + '\n' + anchor[0], 1); changed.append('版本摘要 三十一')

io.open(DEV, 'w', encoding='utf-8', newline='').write(dev)
print('OK, changed:', '; '.join(changed))
