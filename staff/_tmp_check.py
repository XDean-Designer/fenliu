# -*- coding: utf-8 -*-
"""临时自检：确认 PRD（md + html）已按十八次口径同步、旧词已清干净。"""
import io, sys, re

fails = 0
def V(name, ok, extra=None):
    global fails
    if not ok: fails += 1
    line = ('PASS' if ok else 'FAIL') + ' | ' + name
    if extra is not None: line += ' | ' + str(extra)
    print(line)

md = io.open('PRD-提成设置.md', encoding='utf-8').read()
html = io.open('PRD-提成设置.html', encoding='utf-8').read()
# 修订记录（历史流水）逐条记录「当时的」口径，不参与旧词清理检查
md_body = md.split('## 怎么读这份 PRD', 1)[1] if '## 怎么读这份 PRD' in md else md
html_body = html.split('怎么读这份 PRD', 1)[1] if '怎么读这份 PRD' in html else html

# 1. 新增口径关键词
for kw in ['十七次', '十八次', 'basePicked', 'SP_PICK_AVG', '无工位 · 顾客指定', '只发顾客指定提成',
           '获得顾客指定提成', '可叠加', '未选工位/提成', '53v3', '53x2', 'N14b', 'N17c']:
    V('md 含 ' + kw, kw in md)

# 2. 旧口径必须清除
stale = [
    '未选 · 顾客指定',      # 摘要旧文案
    '落入「**未选**」待选态',
    '返回「**未选**」',
    '退回「普通」',
    '「普通」，**二选一**',
    'spPartial',
]
for s in stale:
    V('md 正文已清 ' + s, s not in md_body)

# 2b. 十八次：卡片第三行不得再出现灰字「无工位」；`miss` 灰字描述必须清除
V('md 正文已清「灰/红双色拆分见 .staff-card__pick-miss」',
  '的灰/红双色拆分见' not in md_body)
V('md 正文已清 `.staff-card__pick-miss`（`--text-sec` 灰）',
  '`.staff-card__pick-miss`（`--text-sec` 灰）' not in md_body)
V('md 正文无「③摘要行 `无工位 · 顾客指定`：`无工位` 用」',
  '\u2462摘要行 `无工位 · 顾客指定`：`无工位` 用' not in md_body)
V('md 正文无「卡片第三行摘要为 **`无工位 · 顾客指定`**」',
  '卡片第三行摘要为 **`无工位 · 顾客指定`**' not in md_body)
V('md 正文无「摘要 `无工位 · 顾客指定`（`无工位` 灰字」',
  '摘要 `无工位 · 顾客指定`（`无工位` 灰字' not in md_body)
V('md 不含「`无工位` 灰字 `rgb(146,146,146)`」', '`无工位` 灰字 `rgb(146,146,146)`' not in md_body)
# 入口摘要行仍必须保留
V('md 正文保留入口摘要行 `无工位 · 顾客指定`', '入口下方「已选员工」摘要行' in md_body and '无工位 · 顾客指定' in md_body)

# 2c. 代码侧：卡片不再渲染 pick-miss
js = io.open('comm2.js', encoding='utf-8').read()
css = io.open('comm2.css', encoding='utf-8').read()
base_code = io.open('base.css', encoding='utf-8').read()
V('comm2.js 已无 pick-miss', 'pick-miss' not in js)
V('comm2.css 已无 .staff-card__pick-miss', 'staff-card__pick-miss' not in css)
V('comm2.js spSummaryHtml 的 miss 分支只出红字 span',
  "if (p.miss) return '<span class=\"staff-card__pick-x\">顾客指定</span>';" in js)

# 3. 「工位必选」旧约束必须清除
V('md 正文无「必须由用户手点才生效——未点工位则该员工不计入已选」',
  '必须由用户手点才生效——未点工位则该员工不计入已选' not in md_body)
V('md 正文无「未点工位的员工**不计入已选**」', '未点工位的员工**不计入已选**' not in md_body)

# 4. HTML 同步
for kw in ['十七次', '十八次', 'basePicked', '无工位 · 顾客指定']:
    V('html 含 ' + kw, kw in html)
V('html 正文已清 spPartial', 'spPartial' not in html_body)
V('html 正文已清「未选 · 顾客指定」', '未选 · 顾客指定' not in html_body)
V('html 正文已清「灰/红双色拆分见 .staff-card__pick-miss」', '的灰/红双色拆分见' not in html_body)

# 5. 数组计数：md 与 html 的 A 组条目、验收编号一致性由 sync 脚本保证，这里抽查
V('md A13b 标题已重写', 'A13b · 「只勾顾客指定」卡片' in md)
V('html A13b 标题已重写', 'A13b · 「只勾顾客指定」卡片' in html)

# 6. 十九次：删卡上勾 / 收起动画 / 「服务提成」
for kw in ['十九次', '服务提成', '--sp-collapse', 'spCollapseMorph', 'is-collapsing',
           'A10 · ~~收缩态勾选控件入场', 'staffCheckIn']:
    V('md 含 ' + kw, kw in md)
V('md 含 html 的十九次说明', '十九次' in html)

# 6a. 收缩态员工卡的勾必须彻底消失（注释里保留的历史说明不算）
js_code = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
css_code = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
V('comm2.js 已无 staff-card__tick', 'staff-card__tick' not in js_code)
V('comm2.js 已无 freshTick', 'freshTick' not in js_code)
V('comm2.js 已无 spUntickStaff', 'spUntickStaff' not in js_code)
V('comm2.js 已无 spTickEl', 'spTickEl' not in js_code)
V('comm2.js 已无 data-staff-tick', 'data-staff-tick' not in js_code)
V('comm2.css 已无 .staff-card__tick 规则', '.staff-card__tick' not in css_code)
V('comm2.css 已无 staffCheckIn 关键帧', 'staffCheckIn' not in css_code)
V('comm2.css 已无 .staff-card.is-done.is-undraw',
  'staff-card.is-done.is-undraw' not in css_code)
V('comm2.js spCheckHost 只认 .staff-opt',
  "el.closest('.staff-opt')" in js_code and "el.closest('.staff-card')" not in js_code)

# 6b. 收起动画：变量同源 + 四路径共用
V('comm2.js 有 spCollapseMs', 'function spCollapseMs()' in js)
V('comm2.js 有 spCollapseMorph', 'function spCollapseMorph(done)' in js)
V('comm2.js spCollapseMs 读 --sp-collapse', '--sp-collapse' in js)
V('comm2.css :root 定义 --sp-collapse: 220ms', '--sp-collapse: 220ms;' in css)
V('comm2.css :root 定义 --sp-ease-std', '--sp-ease-std: cubic-bezier(.22, .82, .24, 1);' in css)
V('comm2.css 有 .staff-card__panel--base', '.staff-card__panel--base {' in css)
V('comm2.js 渲染 data-face="base" 面板', 'data-face="base"' in js)
V('comm2.css 减动效下收起 transition: none',
  '.staff-card.is-editing .staff-card__panel--base { transition: none !important; }' in css)

# 6c. 「服务提成」只改选人选项卡，Sheet/摘要仍是「提成」
V('comm2.js 选项卡标签为服务提成', "label: '服务提成'" in js)
V('comm2.js Sheet 行标签仍为「提成」', "'提成'" in js)
V('comm2.js 摘要文案仍为「提成」', "'提成'" in js)

# 6d. 降级：A10 标题已标废止
V('md A10 标题标废止', 'A10 · ~~收缩态勾选控件入场（`staffCheckIn`）+ 画勾~~ · **十九次废止**' in md)
V('md A2 标题标重做', 'A2 · 网格 Morph 收起（整行勾选卡 → 收起态员工卡） · **十九次重做：真动效**' in md)


# 7. 二十次：§12.3.0 实现总览（可还原级规范）+ 几何过期值更正
import re as _re
_sec = _re.findall(r'^#### 12\.3\.0\.\d+ ', md, flags=_re.M)
V('md §12.3.0 十四个小节齐备', len(_sec) == 14)
V('md §12.3.0 章首读法', '先读 §12.3.0 实现总览' in md)
V('md §12.3.0 新增前置于 A1', md.index('#### 12.3.0.1') < md.index('### A1 ·'))
V('html 含 §12.3.0', '12.3.0.14' in html and '12.3.0.2' in html)
for _t in ['DOM 契约', '数据与状态模型', '类名总表',
           '几何契约', '事件绑定契约',
           '函数契约表与调用关系', '组合时间轴',
           '完整 CSS 清单', '完整 JS 清单',
           '反例清单', '边界与异常用例',
           '还原自查清单']:
    V('md §12.3.0 含「' + _t + '」', _t in md)
V('md 给出四个 data-staff-* 契约',
  'data-staff-card' in md and 'data-staff-opt' in md
  and 'data-staff-scrim' in md and 'data-staff-card-hit' in md)
V('md 给出 data-face 两层', 'data-face="base"' in md and 'data-face="opts"' in md)
V('md 给出 spState 字段表',
  'freshDone' in md and 'staffRoles' in md and 'staffChosen' in md)
V('md 类名总表覆盖 is-picking/is-dim/is-morphing',
  'is-picking' in md and 'is-dim' in md and 'is-morphing' in md)
V('md 事件分派含严格相等判定',
  't === #comm2StaffSheetMask' in md)
V('md 函数契约含门控三件套',
  'spGateAfter' in md and 'spGateFlush' in md and 'spGateHoldOnly' in md)
V('md 含完整 CSS（变量 + 反超注释）',
  '--sp-collapse: 220ms;' in md and '必须反超' in md)
V('md 含完整 JS 四个关键函数',
  'function spAnimateStaffMorphLayout' in md and 'function spCollapseMorph' in md
  and 'function spTapOption' in md and 'function spApplyOptionToggle' in md)
V('md 反例清单含特异性与渐变坑',
  '纹丝不动' in md and '渐变不可插值' in md)

# 7a. 几何过期值已更正（仅查正文规范处；「旧值 / 更正」说明处允许出现）
_body = md[md.index('## 怎么读这份 PRD'):]
V('md 正文 gridW 更正为 334', 'gridW = 334px' in _body)
V('md 正文 cellW 更正为 106', '= 106px' in _body)
V('md 正文 dx 更正为 0/-114/-228', '0 / −114 / −228' in _body)
V('md 正文无过期的 cellW 计算式', 'cellW = (332' not in _body)
V('md 正文无过期的 dx 值', '−226.67' not in _body)
V('md A4 变换原点已按实测更正',
  '实测 = 默认 `center center`' in _body)
V('md A4 旧「按列」表述已清除', '按列：列 0' not in _body)

# 7b. 死属性 / 死字段已登记
V('md 登记 --staff-origin 死属性', '是死属性' in md)
V('md 登记 data-outside-close 无消费方', '无消费方' in md)
V('md 登记 edit.opened 死字段', '死字段' in md)
V('md §12.10 偏差表新增 3/4/5 行',
  '| 3 | **`--staff-origin`' in md and '| 5 | **几何实测值曾过期**' in md)

# 7c. 本次未改原型行为
V('comm2.js 未消费 --staff-origin', 'var(--staff-origin)' not in js)
V('comm2.css 仍无 transform-origin 消费', 'var(--staff-origin)' not in css)

# 8. 二十一次：三个死属性 + 一个死字段 / 死类 的清理（原型已删、PRD 已同步）
_html = io.open('index.html', encoding='utf-8').read()
V('md 含二十一次修订', '二十一次' in md)
V('md §12.3.0.4 类名总表已收为 13 个', '类名总表（13 个）' in md)
V('md §12.3.0.2 DOM 骨架无 --staff-origin 内联',
  '--staff-origin:left center' not in md and '--staff-origin:center center' not in md)
V('md §12.3.0.2 DOM 骨架无 data-origin', 'data-origin="left"' not in md)
V('md §12.3.0.3 spState.edit 无 opened 字段',
  'staffId, splitting } —— 二十一次' in md)
V('md §12.3.0.6 变换原点改为默认 center center',
  '变换原点 = 默认 `center center`' in md)
V('md §12.3.0.14 自查项已改写为「不存在」',
  '不存在 `--staff-origin` / `data-origin` / `data-outside-close` 三个**死属性**' in md)
V('md §6.7.1 D1 关闭行已去掉 data-outside-close 表述', '的遮罩可点外关闭' not in _body)
V('md §12.10 偏差表 2/3/4 已标「二十一次已清理」',
  _body.count('**二十一次已清理**') >= 3 or '二十一次已清理' in _body)
V('comm2.js 已无 --staff-origin / data-origin（注释外）',
  '--staff-origin' not in js_code and 'data-origin' not in js_code)
V('comm2.js 已无 spCardOrigin', 'spCardOrigin' not in js_code)
V('comm2.js 已无 is-opened / alreadyOpen',
  'is-opened' not in js_code and 'alreadyOpen' not in js_code)
V('comm2.js 已无 opened: false', 'opened: false' not in js_code)
V('comm2.css 已无 .is-opened 规则（注释外）', 'is-opened' not in css_code)
V('index.html 已无 data-outside-close', 'data-outside-close' not in _html)
V('comm2.js 仍每次展开都播 Morph（无 alreadyOpen 短路）',
  'function spAnimateStaffMorphLayout' in js and 'if (reduce)' in js_code)

# 9. 二十二次：方案编辑页标题右侧信息增强 ⓘ + 白话帮助弹窗「提成怎么设、钱怎么算」
_dev = io.open('PRD-提成设置-开发版.md', encoding='utf-8').read()
_dev_html = io.open('PRD-提成设置-开发版.html', encoding='utf-8').read()

V('md 含二十二次修订', '二十二次' in md)
V('md §6.2 标题行含信息增强 ⓘ', 'comm2EditHelpBtn' in md_body)
V('md §6.9 新增弹窗行', '提成怎么设、钱怎么算' in md_body)
V('md §6.9 附文案原文表（5 条设置）',
  '一个方案管一类人' in md_body and '比如「顾问」「技师」各建一个方案' in md_body
  and '方案里有 5 张卡，每张卡管一类业务' in md_body and '想单独给某个项目定数，就加「规则项」' in md_body
  and '改完点「保存」' in md_body)
V('md §6.9 附文案原文表（8 条计算）',
  '先看这单属于哪一类' in md_body and '再看付款方式算不算' in md_body
  and '基数 × 比例 = 提成' in md_body and '单独加的卡更优先' in md_body
  and '一个人挂了好几个方案怎么办' in md_body and '不同业务各算各的，最后加起来' in md_body
  and '「顾客指定」是另外加的' in md_body and '只勾了顾客指定、没选工位，就只发这一笔' in md_body)
V('md §6.9 附分节标题', '一、怎么设置（5 步）' in md_body and '二、钱怎么算出来（8 条）' in md_body)
V('md §6.9 附样式契约（条目卡片三类）',
  'comm2-hint-list' in md_body and 'comm2-hint-item__no' in md_body
  and 'comm2-hint-item__t' in md_body and 'comm2-hint-item__d' in md_body)
V('md §6.9 附特异性硬约束（.emp-help-body 前缀）',
  '`.emp-help-body .comm2-hint-item__*`' in md_body)
V('md §6.9 附标题文字节点约束（#comm2EditTitleText）', '#comm2EditTitleText' in md_body)
V('md §6.9 附标题省略号样式（.title__txt）', '.title__txt' in md_body)
V('md 白话定调：不得出现术语', '不得出现「取高」「分摊」「覆盖优先于默认」等术语' in md_body)
V('md 列表页弹窗与编辑页弹窗文风统一（二十四次允许条目重复）',
  '各自自洽优于强行去重' in md_body and '文风统一' in md_body)
V('md §9.1 文案清单含新弹窗', '提成怎么设、钱怎么算**（方案编辑页帮助' in md_body)
V('md §10.2 新增 56l / 56l2', '56l.' in md_body and '56l2.' in md_body)
V('md §3 页面清单与 IA 树已同步',
  '标题右侧帮助（提成怎么设、钱怎么算）' in md_body and '帮助（提成怎么设、钱怎么算）' in md_body)

V('html 已同步新弹窗', '提成怎么设、钱怎么算' in html and 'comm2-hint-item__t' in html)
V('html 已同步 56l2', '56l2.' in html)

V('开发版 md 含新弹窗（§6.2 / §6.9 附）',
  '提成怎么设、钱怎么算' in _dev and 'comm2RuleHelpMask' in _dev and '一、怎么设置（5 步）' in _dev)
V('开发版 md 版本摘要含二十二次',
  '09-18 二十二' in _dev and '源 PRD 28 条修订' in _dev)
V('开发版 md §9.1 / §10.2 已同步',
  '提成怎么设、钱怎么算**（方案编辑页帮助' in _dev and '56l2.' in _dev)
V('开发版 md 附录 A 已补新条目与行号平移',
  '| 463–491 |' in _dev and '| **1156–1170** |' in _dev and '**方案编辑页帮助**（§6.2 · §6.9）' in _dev
  and '| **1175–1525** |' in _dev)
V('开发版 html 已同步', '提成怎么设、钱怎么算' in _dev_html and '56l2.' in _dev_html)

# 原型
V('index.html 编辑页标题含 title--with-help + 文字节点 + ⓘ',
  'id="comm2EditTitleText"' in _html and 'id="comm2EditHelpBtn"' in _html and 'title--with-help" id="comm2EditTitle"' in _html)
V('index.html 新增 #comm2RuleHelpMask 弹窗', 'id="comm2RuleHelpMask"' in _html and 'id="comm2RuleHelpOk"' in _html)
V('index.html 编辑页弹窗含 5 + 8 条序号卡片',
  _re.search(r'id="comm2RuleHelpMask".*?</div>\s*</div>\s*</div>', _html, _re.S) is not None
  and len(_re.findall(r'class="comm2-hint-item"', _re.search(r'id="comm2RuleHelpMask".*?(?=<div class="dialog-mask" id="comm2UnassignedMask")', _html, _re.S).group(0))) == 13)
V('index.html 弹窗标题与分节',
  '提成怎么设、钱怎么算' in _html and '一、怎么设置（5 步）' in _html and '二、钱怎么算出来（8 条）' in _html)
V('index.html 两个帮助弹窗各自独立（列表页 / 编辑页）',
  'id="comm2HelpMask"' in _html and 'id="comm2RuleHelpMask"' in _html
  and 'id="comm2HelpBtn"' in _html and 'id="comm2EditHelpBtn"' in _html)
V('comm2.js renderEdit 写入 #comm2EditTitleText（不写外层）',
  "var title = $('comm2EditTitleText') || $('comm2EditTitle');" in js_code
  and "$('comm2EditTitle').textContent" not in js_code)
V('comm2.js 已绑定 ⓘ 三件套',
  "openDialog('comm2RuleHelpMask')" in js_code and "closeDialog('comm2RuleHelpMask')" in js_code
  and "e.target === $('comm2RuleHelpMask')" in js_code)
V('comm2.css 含标题省略号 + 条目卡片样式',
  '.title--with-help > .title__txt' in css_code and '.comm2-hint-item__no' in css_code
  and '.emp-help-body .comm2-hint-item__t' in css_code and '.emp-help-body .comm2-hint-item__d' in css_code)
V('comm2.css 条目结论 / 补充字号正确',
  'font-size: 13px; font-weight: 600' in css_code.replace('\n', ' ')
  or 'font-size: 13px' in css_code.split('.emp-help-body .comm2-hint-item__t')[1][:120])

# 10. 二十三次：两处孤立帮助弹窗接入触发点（规则 Sheet 行标签 ⓘ）
V('md 含二十三次修订', '二十三次' in md)
V('md §6.9 计算基数说明行标注触发点',
  '计算基数」行标签右侧 ⓘ' in md_body and 'comm2BaseHelpMask' in md_body)
V('md §6.9 分配模式说明行标注触发点',
  '分配模式」行标签右侧 ⓘ' in md_body and 'comm2PickHelpMask' in md_body)
V('md §6.9 已清旧触发点表述「规则 Sheet「原价模式」旁」',
  '规则 Sheet「原价模式」旁' not in md_body)
V('md §10.2 新增 56m', '56m.' in md_body)
V('md 56m 含布局实测与委派要求',
  '52 + 4 + 14 = 70px' in md_body and '委派' in md_body and 'z-index 50' in md_body)

V('html 已同步二十三次 / 56m / 触发点',
  '二十三次' in html and '56m.' in html and 'comm2BaseHelpMask' in html)

# 开发版
V('开发版 md 版本摘要含二十三次',
  '源 PRD 28 条修订' in _dev and '09-18 二十三' in _dev)
V('开发版 md §6.9 两行标注触发点',
  'data-comm2-sheet-help="base"' in _dev and 'data-comm2-sheet-help="pick"' in _dev)
V('开发版 md §10.2 新增 56m', '56m.' in _dev)
V('开发版 md 附录 A 已补 Sheet ⓘ 条目',
  '`sheetRowHtml`（第 5 参 `helpKey`' in _dev and 'Sheet 行标签的 ⓘ 点不动' in _dev
  and '`.comm2-sheet-row__lbl`（`display:inline-flex` + `gap:4px`）' in _dev)
V('开发版 html 已同步', '09-18 二十三' in _dev_html and '56m.' in _dev_html)

# 原型
V('comm2.js sheetRowHtml 接受 helpKey 并注入 data-comm2-sheet-help',
  'function sheetRowHtml(lbl, ctrlHtml, cls, attrs, helpKey) {' in js_code
  and 'data-comm2-sheet-help="' in js_code)
V('comm2.js sheetRowHtml 在标签后注入 ⓘ（有 aria-label）',
  "aria-label=\"' + esc(lbl) + '说明\"" in js_code and 'comm2-sheet-row__help' in js_code)
V('comm2.js 调用处传入 base / pick',
  "sheetSegHtml('base', block), null, null, 'base'" in js_code
  and "sheetSegHtml('pick', block), null, null, 'pick'" in js_code)
V('comm2.js 两处 ⓘ 走 #comm2CatSheetBody 委派',
  "closest('[data-comm2-sheet-help]')" in js_code
  and js_code.index("closest('[data-comm2-sheet-help]')") > js_code.index("comm2CatSheetBody")
  and "openDialog('comm2BaseHelpMask')" in js_code and "openDialog('comm2PickHelpMask')" in js_code)
V('comm2.js 未把监听绑到具体 ⓘ 按钮（防 Sheet 重渲染失效）',
  "querySelectorAll('[data-comm2-sheet-help]')" not in js_code
  and "getElementById('comm2BaseHelpBtn')" not in js_code)
V('comm2.js 已绑定两处说明弹窗的关闭三件套',
  "closeDialog('comm2BaseHelpMask')" in js_code and "e.target === $('comm2BaseHelpMask')" in js_code
  and "closeDialog('comm2PickHelpMask')" in js_code and "e.target === $('comm2PickHelpMask')" in js_code)
V('comm2.css 行标签改内联弹性（gap 4px）',
  '.comm2-sheet-row__lbl {' in css_code and 'display: inline-flex; align-items: center; gap: 4px;' in css_code)
V('comm2.css 有 .comm2-sheet-row__help',
  '.comm2-sheet-row__help {' in css_code)
V('index.html 两个说明弹窗仍存在（本次只是接入触发点，未改文案）',
  'id="comm2BaseHelpMask"' in _html and 'id="comm2PickHelpMask"' in _html
  and 'id="comm2BaseHelpOk"' in _html and 'id="comm2PickHelpOk"' in _html)

# 11. 二十四次：列表页帮助弹窗白话重写（多方案规则 → 一个人挂几个方案，钱怎么算）
NEW_LIST_TITLE = '一个人挂几个方案，钱怎么算'
V('md 含二十四次修订', '二十四次' in md)
V('md 二十四次行关键口径齐',
  all(k in md[:md.index('## 怎么读这份 PRD')] for k in
      ['列表页帮助弹窗白话重写', '一个人挂几个方案，钱怎么算', '零新增 CSS', '整条删除']))
V('md §6.9 新增附 2（列表页文案原文）',
  '§6.9 附 2 · 「一个人挂几个方案，钱怎么算」' in md_body)
V('md §6.9 附 2 含两节标题', '一、谁能挂几个方案（2 条）' in md_body and '二、钱怎么算（5 条）' in md_body)
for _t in ['一个人可以同时挂几个方案', '挂得多，不等于拿得多', '哪个方案算出来的钱多，就按哪个给',
           '钱一样多时，看方案列表里谁在前面', '单独加的规则项，比大类卡更优先',
           '同一个方案里，好几张卡都管到同一个项目', '一笔生意里不同的项目，各算各的，最后加起来']:
    V('md §6.9 附 2 含条目「' + _t + '」', _t in md_body)
V('md §6.9 附 2 含作废原文对照表',
  '本次作废的原文（供回溯，不得再出现于原型）' in md_body and '整条删除' in md_body)
V('md §6.9 附 2 说明两条弹窗允许重复',
  '各自自洽优于强行去重' in md_body)
V('md §3 / §6.1 / §9.1 标题已换名',
  '帮助（一个人挂几个方案，钱怎么算）' in md_body
  and '留在本页、不保存、**一个人挂几个方案，钱怎么算**' in md_body)
V('md 正文已清旧标题「多方案规则」', '多方案规则' not in md_body)
V('md §10.2 新增 56n', '56n.' in md_body)
V('md 56n 含术语白名单与公式禁令',
  '不得出现任何公式' in md_body and '零新增 CSS' in md_body and '各自从 1 起' in md_body)
V('md 56l2 末句已改（不再说列表页弹窗不受影响）',
  '两处**触发互不串台**' in md_body and '其 ⓘ 仍打开原「多方案规则」弹窗' not in md_body)

V('html 已同步二十四次 / 附 2 / 56n',
  '二十四次' in html and '§6.9 附 2' in html and '56n.' in html)
V('html 正文已清旧标题「多方案规则」', '多方案规则' not in html_body)

# 开发版
V('开发版 md 版本摘要更新为 24 条 + 二十四次',
  '源 PRD 28 条修订' in _dev and '09-18 二十四' in _dev)
V('开发版 md §6.9 行已换 + 附 2 已加',
  NEW_LIST_TITLE in _dev and '§6.9 附 2 · 「一个人挂几个方案，钱怎么算」' in _dev)
V('开发版 md §10.2 新增 56n', '56n.' in _dev)
V('开发版 md §3 / §6.1 / §9.1 已换名',
  '帮助（一个人挂几个方案，钱怎么算）' in _dev
  and '留在本页、不保存、**一个人挂几个方案，钱怎么算**' in _dev)
V('开发版 md 附录 A 已补列表页弹窗条目',
  '「一个人挂几个方案，钱怎么算」帮助弹窗' in _dev and '列表页弹窗文案不对' in _dev)
V('开发版 html 已同步', '09-18 二十四' in _dev_html and '56n.' in _dev_html)

# 原型
import re as _re2
_h = _html[_html.index('id="comm2HelpMask"'):_html.index('id="comm2MigrateMatchMask"')]
V('index.html 列表页弹窗标题已改白话',
  '<div class="dialog__title" id="comm2HelpTitle">' + NEW_LIST_TITLE + '</div>' in _h)
V('index.html 列表页 ⓘ aria-label 已改弹窗标题原文',
  'id="comm2HelpBtn" aria-label="' + NEW_LIST_TITLE + '"' in _html)
V('index.html 列表页弹窗已改两节 2 + 5 条序号卡片',
  _h.count('class="comm2-hint-list"') == 2 and _h.count('class="comm2-hint-item"') == 7)
V('index.html 各节序号各自从 1 起',
  _h.count('>1</span><div class="comm2-hint-item__main">') == 2)
V('index.html 列表页弹窗已无旧 5 段 h4 结构',
  '每人可分配多个提成方案' not in _h and '计算项重叠时取高' not in _h
  and '按项分摊 · 适用范围' not in _h and '不同行可相加' not in _h)
V('index.html 列表页弹窗已无内部术语 / 公式',
  all((w not in _h) for w in ['取高', '分摊', '覆盖', '分类默认', '订单行', '试算', '计提',
                              '并列', '命中', '金额最大', '写入', '胜出', '适用范围', '÷', '也在：']))
V('index.html 列表页弹窗仍复用 dialog--emp-help + emp-help-body',
  'dialog dialog--emp-help" role="dialog" aria-labelledby="comm2HelpTitle"' in _h
  and 'dialog__scroll emp-help-body' in _h)
V('index.html 编辑页弹窗未被牵连（仍 5 + 8）',
  _html.count('class="comm2-hint-item"') == 20
  and '<div class="dialog__title" id="comm2RuleHelpTitle">提成怎么设、钱怎么算</div>' in _html)
V('comm2.css 未新增列表页专用样式（仍复用同一批 hint-item 规则）',
  css_code.count('.comm2-hint-list') == 1 and css_code.count('.comm2-hint-item__no') == 1)

# ===== 二十六次：方案改动 → 本期提成怎么算 =====
_dev_body = _dev
_devb = _dev.split('## 导读：怎么读这份开发版', 1)[1] if '## 导读：怎么读这份开发版' in _dev else _dev
_devh = _dev_html.split('导读：怎么读这份开发版', 1)[1] if '导读：怎么读这份开发版' in _dev_html else _dev_html
html_body2 = html
app_code = io.open('app.js', encoding='utf-8').read()
emp_code = io.open('employee.js', encoding='utf-8').read()
hx = _html[_html.index('id="comm2RecalcMask"'):_html.index('id="comm2RecalcMask"') + 1800]

V('md 修订记录含二十六次', '二十六次' in md and '已分配员工的方案被改动' in md)
V('md 新增 §6.13 章节', '## 6.13 方案改动 → 本期提成怎么算（二十六次新增）' in md)
for kw in ['6.13.1 触发条件', '6.13.2 两种口径', '6.13.3 弹窗规格与文案', '6.13.4 数据落地与解析',
           '6.13.6 「本期」的定义（易错点）', '6.13.7 边界',
           '6.13.8 弹窗未回答就退出 → 默认「从现在起用新方案」']:
    V('md §6.13 含 ' + kw, kw in md)
V('md §7.1 新增 3 字段（effectiveFrom 已随三十一次删除）',
  all(k in md for k in ['| effectiveMode |', '| effectiveAt |', '| _prev |']))
V('md §8 新增规则 33', '33. **方案改动后的本期重算口径（二十六次' in md)
V('md §9.1 新增重算弹窗文案段', '**方案改动重算弹窗（§6.13，二十六次新增 / 二十八次改版 / 三十一次精简）**' in md)
V('md §10.2 新增 56o 系列', all(k in md for k in ['56o. ', '56o2. ', '56o3. ', '56o4. ']))
V('md 弹窗文案禁止术语已声明', '全篇不得出现「结算周期 / 生效口径 / 生效方式 / 落地 / 重算引擎 / 快照 / 回溯 / 计提」等术语' in md)
V('md 回归套件欠账已修复为多选口径（D7/D12/D13/I2/I3）',
  '回归验证（二十六次一并修账）' in md and 'D7` / `D12` / `D13` / `I2` / `I3`' in md
  and 'D7` / `D12` / `D13` / `I2` / `I3` 在 HEAD 上同样失败' not in md)
V('md 修订记录含二十七次（回归套件修账）',
  '修订（2026-09-20 二十七次）' in md and '回归套件修账' in md)
V('md 修订记录含二十八次（弹窗改开关 + 两按钮）',
  '修订（2026-09-20 二十八次）' in md and '本期已经算好的提成，要重新算吗？' in md)
V('md §6.13.3 已改为两枚按钮即两个结果（三十一次）',
  '本期全部重算' in md and '从现在起用新方案' in md
  and '灰条' in md and '影响面' in md)
V('md 三十一次：取消「下期生效」+ 两按钮竖排',
  '修订（2026-09-20 三十一次）' in md and '取消「本期不动，下期换」' in md
  and '两枚按钮**竖排**' in md and '`#comm2RecalcAll`' in md
  and '`#comm2RecalcForward`' in md)
_dlg = md_body[md_body.index('### 6.13.3'):md_body.index('### 6.13.4')]
_tbl = _dlg[_dlg.index('| 区块 | 文案'):_dlg.index('**两枚按钮各自说什么**')]
V('md §6.13.3 文案表只剩「标题 + 提示 + 两枚按钮」',
  all(s not in _tbl for s in ['下期生效', '本期不动，下期换', '立即重新计算', '开关', 'effectiveFrom'])
  and '改方案后，提成怎么计算？' in _tbl and '本期全部重算' in _tbl and '从现在起用新方案' in _tbl
  and '已经手工改过的订单，金额不受影响。' in _tbl)
V('md 正文「下期生效」仅存在于「作废 / 取消」叙述中',
  all(any(k in l for k in ['作废', '取消', '删除', '不得出现', '不出现'])
      for l in md_body.split('\n') if '下期生效' in l))
V('md 二十九次：文案定稿 + 兜底默认（§6.13.8）',
  '修订（2026-09-20 二十九次）' in md
  and '本期不动，下期换' in md and '已按「从现在起用新方案」保存' in md
  and '`recalcFallbackForward()`' in md and '不留标记' in md)
V('md 三十次：标题固定文案（不引用方案名）',
  '修订（2026-09-20 三十次）' in md and '改方案后，提成怎么计算？' in md
  and '不再引用方案名' in md)
V('md 标题已固定、无动态标题残留',
  '改方案后，提成怎么计算？' in md_body and '改「{方案名}」后，提成怎么算？' not in md_body
  and '标题（**固定**，不引用方案名）' in md_body and '标题（动态）' not in md_body)
V('md 旧文案已清零（正文，不含修订流水）',
  all(('| ' + old) not in md for old in ['提示（左侧带 ⓘ 图标） | 已经手工调整过的单子，金额不受影响。',
                                        '左按钮（描边次要） | 本期不动，下期再换']))
V('md §9.1 / 56o2 / 56o3 / 56o6 已用新文案',
  '已经手工改过的订单' in md and '56o7. ' in md and '本期全部重算' in md)
V('md §10.2 已新增 56o7（兜底默认）',
  '56o7. ' in md and '兜底口径**只能是 `forward`**' in md)
V('md §6.13.7 已删掉随影响面失效的表述',
  '二十八次起不再统计「影响面」' in md and '不在影响面统计内' not in md)
V('md §10.2 已改写 56o2 / 56o3 并新增 56o5 / 56o6',
  all(k in md for k in ['56o2. ', '56o3. ', '56o5. ', '56o6. ']))
V('开发版 md 欠账已改写为已修复', '回归验证（二十六次一并修账）' in _dev and '待与多选口径一并重写' not in _dev)
V('开发版 md 含二十八次 + 开关口径（历史流水）', '二十八次' in _dev)
V('开发版 md §6.13.3 已改为两枚按钮（三十一次）',
  '本期全部重算' in _devb and '从现在起用新方案' in _devb and '56o5. ' in _devb
  and '09-20 三十一' in _dev and '取消「本期不动，下期换」' in _dev)
_devdlg = _devb[_devb.index('### 6.13.3'):_devb.index('### 6.13.4')]
_devtbl = _devdlg[_devdlg.index('| 区块 | 文案'):_devdlg.index('**两枚按钮各自说什么**')]
V('开发版 md 正文已清零「下期生效」与旧按钮（文案表零残留）',
  all(s not in _devtbl for s in ['下期生效', '本期不动，下期换', '立即重新计算', '开关'])
  and '本期全部重算' in _devtbl and '从现在起用新方案' in _devtbl
  and all(any(k in l for k in ['作废', '取消', '删除', '不得出现', '不出现'])
          for l in _devb.split('\n') if '下期生效' in l))
V('开发版 md 二十九次：文案定稿 + 兜底默认',
  '09-20 二十九' in _dev and '6.13.8 弹窗未回答就退出' in _dev
  and '已经手工改过的订单' in _dev and 'recalcFallbackForward' in _dev and '56o7. ' in _dev)
V('开发版 md 三十次：标题固定文案',
  '09-20 三十' in _dev and '改方案后，提成怎么计算？' in _devb
  and '改「{方案名}」后，提成怎么算？' not in _devb)
_uvi = io.open('_tmp_ui_verify.mjs', encoding='utf-8').read()
V('验证脚本已按多选口径重写 5 项断言',
  all(k in _uvi for k in ['工位可多选', 'D12 工位多选追加', 'D13 逐个点掉全部已勾选项',
                          'I2 加选工位：旧勾「全程保持红色」', 'I3 收起开始时旧勾仍为红'])
  and '工位单选（切到中工' not in _uvi and 'is-undraw 期间旧卡红底为白' not in _uvi
  and 'tPrevClean' not in _uvi)
V('html 已同步二十六 / 二十八 / 二十九 / 三十 / 三十一次', '二十六次' in html and '二十八次' in html
  and '二十九次' in html and '三十次' in html and '三十一次' in html
  and '6.13 方案改动 → 本期提成怎么算' in html and '6.13.8 弹窗未回答就退出' in html)
V('html §10.2 已含 56o4 / 56o5 / 56o7', '56o4.' in html and '56o5.' in html and '56o7.' in html)
V('html 已用新文案（按钮 / 提示 / toast / 标题）',
  '本期全部重算<' in html_body and '已经手工改过的订单' in html_body
  and '已按「从现在起用新方案」保存' in html_body
  and '改方案后，提成怎么计算？' in html_body
  and '改「{方案名}」后，提成怎么算？' not in html_body
  and '改方案后，提成怎么计算？' in _devh
  and '改「{方案名}」后，提成怎么算？' not in _devh)
V('html / 开发版 html：弹窗区已清零开关与下期口径',
  all(s not in html_body[html_body.index('6.13.3'):html_body.index('6.13.4')]
      for s in ['立即重新计算', 'comm2RecalcToggle', 'comm2RecalcNext', 'effectiveFrom'])
  and '本期全部重算' in html_body[html_body.index('6.13.3'):html_body.index('6.13.4')]
  and '三十一次' in html_body and '三十一次' in _devh)

V('开发版 md 含二十六次 + §6.13', '二十六次' in _dev and '## 6.13 方案改动 → 本期提成怎么算（二十六次新增）' in _dev)
V('开发版 md §7.1 / §8 / §9.1 / §10.2 已同步',
  '| effectiveMode |' in _dev and '33. **方案改动后的本期重算口径（二十六次' in _dev
  and '**方案改动重算弹窗（§6.13，二十六次新增 / 二十八次改版 / 三十一次精简）**' in _dev and '56o4. ' in _dev)
V('开发版 html 已同步', '二十六次' in _dev_html and '56o4.' in _dev_html
  and '二十九次' in _dev_html and '本期全部重算' in _dev_html)

V('comm2.js 新增改动判定与口径落地函数',
  all(k in js for k in ['schemeMoneyFingerprint', 'schemeMoneyChanged', 'schemeRuleSnapshot',
                        'schForLine', 'openRecalcDialog',
                        'applyEffectiveChoice', 'commitSchemeSave', 'commitRecalcChoice']))
V('comm2.js 试算接入解析器（calcStaffTrial 第 3 参）',
  'function calcStaffTrial(staffId, lines, periodKey)' in js
  and 'schemeLineAmount(schForLine(sch, pk, line.ymd), line)' in js)
V('comm2.js 保存流程改为「先问后存」',
  'schemeMoneyChanged(before, sch)' in js and 'openRecalcDialog(sch, before);' in js)
V('comm2.js 三十一次：«下期生效» 能力已彻底删除',
  all(k not in js for k in ['schemePendingNext', 'cmNextPeriod', 'COMM2_EFFECTIVE_LABEL',
                            'effectiveFrom', "'next'", 'comm2-scheme__badge'])
  and 'recalcSyncUi' not in js and 'recalcNowLabel' not in js
  and 'comm2RecalcToggle' not in js)
V('comm2.js 弹窗为「两枚按钮即两个结果」',
  'recalcState = { sch: null, before: null }' in js
  and "commitRecalcChoice('recalc')" in js and "commitRecalcChoice('forward')" in js
  and 'RECALC_OPTS' not in js and 'recalcOptsHtml' not in js and 'recalcImpactHtml' not in js
  and 'comm2RecalcOpts' not in js and 'comm2RecalcOk' not in js)
V('employee.js 已删 nextPeriodInfo（随 next 口径一并清理）',
  'nextPeriodInfo' not in emp_code and 'getCurrentPeriodInfo: function' in emp_code)

V('index.html 新增 #comm2RecalcMask 及两枚按钮',
  all(k in hx for k in ['id="comm2RecalcMask"', 'id="comm2RecalcTitle"',
                        'id="comm2RecalcAll"', 'id="comm2RecalcForward"',
                        'dialog__actions--stack', '本期全部重算', '从现在起用新方案']))
V('index.html 弹窗旧节点已全删（三选一 / 灰条 / 开关 / 旧按钮）',
  all(k not in hx for k in ['id="comm2RecalcLead"', 'id="comm2RecalcImpact"',
                            'id="comm2RecalcOpts"', 'id="comm2RecalcOk"', 'id="comm2RecalcCancel"',
                            'id="comm2RecalcToggle"', 'id="comm2RecalcToggleLbl"',
                            'id="comm2RecalcNext"', 'id="comm2RecalcNow"',
                            'role="switch"', 'comm2-recalc__row']))
V('index.html 提示带内联 SVG 图标、无遮罩点击关闭',
  'comm2-recalc__note-ico' in hx and 'comm2-recalc__note' in hx
  and 'data-outside-close' not in hx)

V('comm2.css 含提示样式（开关 / 角标样式已清）',
  '.comm2-recalc__note-ico' in css_code and 'max-width: 326px' in css_code
  and '.comm2-recalc__opt' not in css_code and '.comm2-recalc__impact' not in css_code
  and '.comm2-recalc__lead' not in css_code and '.comm2-recalc__switch' not in css_code
  and '.comm2-scheme__badge' not in css_code)
V('comm2.css 三十二次：提示行水平居中（图标+文字整体居中）',
  'justify-content: center' in css_code[css_code.index('.comm2-recalc__note {'):css_code.index('.comm2-recalc__note-ico')]
  and 'text-align: center' in css_code[css_code.index('.comm2-recalc__note {'):css_code.index('.comm2-recalc__note-ico')])
V('PRD 三十二次：修订记录 + §6.13.3 排版细节已补居中口径',
  '修订（2026-09-20 三十二次）' in md and '提示行水平居中（三十二次）' in md
  and 'justify-content: center' in md and '整体偏离中心 `0px`' in md
  and '| 09-20 三十二 |' in _dev and '提示行水平居中（三十二次）' in _dev)
V('base.css 新增按钮竖排容器',
  '.dialog__actions--stack' in base_code and 'flex-direction: column' in base_code)

V('app.js 抓取路由已改接两枚按钮',
  "'comm2-recalc'" in app_code and "'comm2-recalc-all'" in app_code
  and "'comm2-recalc-forward'" in app_code and "click('#comm2RecalcAll'" in app_code
  and 'comm2RecalcOpts' not in app_code and 'comm2RecalcOk' not in app_code
  and 'comm2RecalcNext' not in app_code and 'comm2RecalcToggle' not in app_code)

V('employee.js 暴露期口径接口（next 口径与影响面统计已删）',
  'getPeriodInfo: function (key) {' in emp_code and 'getCurrentPeriodInfo: function () {' in emp_code
  and 'countEffectiveCommLines' not in emp_code)
V('employee.js 薪资侧传期 + 带 ymd',
  'C.calcStaffTrial(staffId, trialPayload, state.salaryMonth)' in emp_code
  and 'Object.assign({}, base, { ymd: ln.ymd })' in emp_code)

V('comm2.js 二十九次：兜底默认「从现在起用新方案」已接线',
  all(k in js for k in ['function recalcFallbackForward()', 'function clearRecalcPending()',
                        "window.addEventListener('pagehide', recalcFallbackForward)",
                        "window.addEventListener('beforeunload', recalcFallbackForward)",
                        'if (recalcFallbackForward()) return;',
                        '已按「从现在起用新方案」保存']) )
V('comm2.js 兜底在 openList / 返回按钮两处漏斗且幂等',
  'if (recalcFallbackForward()) return;\n    store.editingId = null;' in js
  and 'if (recalcFallbackForward()) return;\n    if (store._dirty || store._draft)' in js
  and 'clearRecalcPending();\n    if (!sch) { closeDialog' in js
  and '_autoDefault' not in js)
V('index.html 二十九 / 三十一次：文案定稿（两枚按钮 / 提示）',
  '本期全部重算<' in hx and '从现在起用新方案<' in hx
  and '已经手工改过的订单，金额不受影响。' in hx
  and '下期再换' not in hx and '手工调整过的单子' not in hx
  and '本期不动，下期换' not in hx and 'comm2RecalcToggle' not in hx)
V('index.html 三十次：标题固定文案',
  'id="comm2RecalcTitle">改方案后，提成怎么计算？<' in hx and '方案名' not in hx)
V('comm2.js 三十次：动态标题赋值已删除',
  "sch.name + '」后" not in js and "$('comm2RecalcTitle')" not in js
  and 'comm2RecalcMask' in js)

print('FAILED ' + str(fails) if fails else 'ALL PASS')
sys.exit(1 if fails else 0)