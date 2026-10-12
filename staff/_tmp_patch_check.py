# -*- coding: utf-8 -*-
"""把「二十次（§12.3.0 实现总览）」的自检断言追加进 _tmp_check.py（幂等）。"""
import io

p = '_tmp_check.py'
s = io.open(p, encoding='utf-8').read()

BLOCK = u"""
# 7. 二十次：§12.3.0 实现总览（可还原级规范）+ 几何过期值更正
import re as _re
_sec = _re.findall(r'^#### 12\\.3\\.0\\.\\d+ ', md, flags=_re.M)
V('md \u00a712.3.0 \u5341\u56db\u4e2a\u5c0f\u8282\u9f50\u5907', len(_sec) == 14)
V('md \u00a712.3.0 \u7ae0\u9996\u8bfb\u6cd5', '\u5148\u8bfb \u00a712.3.0 \u5b9e\u73b0\u603b\u89c8' in md)
V('md \u00a712.3.0 \u65b0\u589e\u524d\u7f6e\u4e8e A1', md.index('#### 12.3.0.1') < md.index('### A1 \u00b7'))
V('html \u542b \u00a712.3.0', '12.3.0.14' in html and '12.3.0.2' in html)
for _t in ['DOM \u5951\u7ea6', '\u6570\u636e\u4e0e\u72b6\u6001\u6a21\u578b', '\u7c7b\u540d\u603b\u8868',
           '\u51e0\u4f55\u5951\u7ea6', '\u4e8b\u4ef6\u7ed1\u5b9a\u5951\u7ea6',
           '\u51fd\u6570\u5951\u7ea6\u8868\u4e0e\u8c03\u7528\u5173\u7cfb', '\u7ec4\u5408\u65f6\u95f4\u8f74',
           '\u5b8c\u6574 CSS \u6e05\u5355', '\u5b8c\u6574 JS \u6e05\u5355',
           '\u53cd\u4f8b\u6e05\u5355', '\u8fb9\u754c\u4e0e\u5f02\u5e38\u7528\u4f8b',
           '\u8fd8\u539f\u81ea\u67e5\u6e05\u5355']:
    V('md \u00a712.3.0 \u542b\u300c' + _t + '\u300d', _t in md)
V('md \u7ed9\u51fa\u56db\u4e2a data-staff-* \u5951\u7ea6',
  'data-staff-card' in md and 'data-staff-opt' in md
  and 'data-staff-scrim' in md and 'data-staff-card-hit' in md)
V('md \u7ed9\u51fa data-face \u4e24\u5c42', 'data-face="base"' in md and 'data-face="opts"' in md)
V('md \u7ed9\u51fa spState \u5b57\u6bb5\u8868',
  'freshDone' in md and 'staffRoles' in md and 'staffChosen' in md)
V('md \u7c7b\u540d\u603b\u8868\u8986\u76d6 is-picking/is-dim/is-morphing',
  'is-picking' in md and 'is-dim' in md and 'is-morphing' in md)
V('md \u4e8b\u4ef6\u5206\u6d3e\u542b\u4e25\u683c\u76f8\u7b49\u5224\u5b9a',
  't === #comm2StaffSheetMask' in md)
V('md \u51fd\u6570\u5951\u7ea6\u542b\u95e8\u63a7\u4e09\u4ef6\u5957',
  'spGateAfter' in md and 'spGateFlush' in md and 'spGateHoldOnly' in md)
V('md \u542b\u5b8c\u6574 CSS\uff08\u53d8\u91cf + \u53cd\u8d85\u6ce8\u91ca\uff09',
  '--sp-collapse: 220ms;' in md and '\u5fc5\u987b\u53cd\u8d85' in md)
V('md \u542b\u5b8c\u6574 JS \u56db\u4e2a\u5173\u952e\u51fd\u6570',
  'function spAnimateStaffMorphLayout' in md and 'function spCollapseMorph' in md
  and 'function spTapOption' in md and 'function spApplyOptionToggle' in md)
V('md \u53cd\u4f8b\u6e05\u5355\u542b\u7279\u5f02\u6027\u4e0e\u6e10\u53d8\u5751',
  '\u7eb9\u4e1d\u4e0d\u52a8' in md and '\u6e10\u53d8\u4e0d\u53ef\u63d2\u503c' in md)

# 7a. \u51e0\u4f55\u8fc7\u671f\u503c\u5df2\u66f4\u6b63\uff08\u4ec5\u67e5\u6b63\u6587\u89c4\u8303\u5904\uff1b\u300c\u65e7\u503c / \u66f4\u6b63\u300d\u8bf4\u660e\u5904\u5141\u8bb8\u51fa\u73b0\uff09
_body = md[md.index('## \u600e\u4e48\u8bfb\u8fd9\u4efd PRD'):]
V('md \u6b63\u6587 gridW \u66f4\u6b63\u4e3a 334', 'gridW = 334px' in _body)
V('md \u6b63\u6587 cellW \u66f4\u6b63\u4e3a 106', '= 106px' in _body)
V('md \u6b63\u6587 dx \u66f4\u6b63\u4e3a 0/-114/-228', '0 / \u2212114 / \u2212228' in _body)
V('md \u6b63\u6587\u65e0\u8fc7\u671f\u7684 cellW \u8ba1\u7b97\u5f0f', 'cellW = (332' not in _body)
V('md \u6b63\u6587\u65e0\u8fc7\u671f\u7684 dx \u503c', '\u2212226.67' not in _body)
V('md A4 \u53d8\u6362\u539f\u70b9\u5df2\u6309\u5b9e\u6d4b\u66f4\u6b63',
  '\u5b9e\u6d4b = \u9ed8\u8ba4 `center center`' in _body)
V('md A4 \u65e7\u300c\u6309\u5217\u300d\u8868\u8ff0\u5df2\u6e05\u9664', '\u6309\u5217\uff1a\u5217 0' not in _body)

# 7b. \u6b7b\u5c5e\u6027 / \u6b7b\u5b57\u6bb5\u5df2\u767b\u8bb0
V('md \u767b\u8bb0 --staff-origin \u6b7b\u5c5e\u6027', '\u662f\u6b7b\u5c5e\u6027' in md)
V('md \u767b\u8bb0 data-outside-close \u65e0\u6d88\u8d39\u65b9', '\u65e0\u6d88\u8d39\u65b9' in md)
V('md \u767b\u8bb0 edit.opened \u6b7b\u5b57\u6bb5', '\u6b7b\u5b57\u6bb5' in md)
V('md \u00a712.10 \u504f\u5dee\u8868\u65b0\u589e 3/4/5 \u884c',
  '| 3 | **`--staff-origin`' in md and '| 5 | **\u51e0\u4f55\u5b9e\u6d4b\u503c\u66fe\u8fc7\u671f**' in md)

# 7c. \u672c\u6b21\u672a\u6539\u539f\u578b\u884c\u4e3a
V('comm2.js \u672a\u6d88\u8d39 --staff-origin', 'var(--staff-origin)' not in js)
V('comm2.css \u4ecd\u65e0 transform-origin \u6d88\u8d39', 'var(--staff-origin)' not in css)

"""

anchor = "print('FAILED ' + str(fails) if fails else 'ALL PASS')"
assert anchor in s, 'anchor not found'
if u'\u00a712.3.0 \u5341\u56db\u4e2a\u5c0f\u8282\u9f50\u5907' in s:
    print('already patched, skip')
else:
    s = s.replace(anchor, BLOCK + anchor)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', p)
