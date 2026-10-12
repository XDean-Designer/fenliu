/* 临时冒烟测试（跑完即删）：额外叠加模型 / 旧数据迁移 / 计提口径 */
const path = require('path');

function stubEl() {
  const el = {
    style: {}, dataset: {}, children: [], classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; }
    },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, scrollIntoView() {}, focus() {},
    getContext() { return { measureText: () => ({ width: 10 }) }; }
  };
  return el;
}
global.window = global;
/* 浏览器里 window 自带 addEventListener；Node 全局没有 —— 补一个 no-op，否则 comm2.js 的
   pagehide / beforeunload 接线会在冒烟环境里抛 TypeError（二十九次新增接线后暴露的桩缺口）。 */
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.document = {
  readyState: 'complete',
  addEventListener() {}, removeEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return null; },
  createElement() { return stubEl(); },
  body: stubEl()
};
global.navigator = {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });

require(path.join(__dirname, 'comm2.js'));

const D = window.Comm2Demo;
let fails = 0;
function V(name, ok, extra) {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra !== undefined ? ' | ' + JSON.stringify(extra) : ''));
}
function near(a, b) { return Math.abs(Number(a) - Number(b)) < 0.011; }

const schemes = D.getSchemes();
const fl = schemes.filter(s => s.id === 'c2_flagship')[0];
V('flagship-exists', !!fl);

/* ---- 1. 种子数据：额外（顾客指定）叠加模型 ---- */
const labor = fl.defaults.labor;
V('seed-labor-station', labor.pickMode === 'station', labor.pickMode);
V('seed-labor-extraSplit', labor.rule.extraSplit === true, labor.rule.extraSplit);
V('seed-labor-extraValue-5', near(labor.rule.extraValue, 5), labor.rule.extraValue);
V('seed-labor-extra-keys', labor.rule.extraAmt === 0 && labor.rule.extraValueMode === 'pct' && labor.rule.extraValue != null);
V('seed-no-legacy-keys', labor.rule.designated === undefined && labor.rule.guestSplit === undefined && labor.rule.designatedValueMode === undefined);
V('seed-stations', near(labor.rule.stations.senior.nonDesignated, 12) && near(labor.rule.stations.mid.nonDesignated, 10) && near(labor.rule.stations.junior.nonDesignated, 8), labor.rule.stations);
V('seed-avg-labor', (fl.overrides.filter(o => o.id === 'ov_flagship_hydrate')[0] || {}).rule.extraSplit === true && near(fl.overrides.filter(o => o.id === 'ov_flagship_hydrate')[0].rule.extraValue, 3));
V('seed-card-no-extra', fl.defaults.card.rule.extraSplit === false && fl.defaults.card.rule.extraValue === 0);

/* ---- 2. 计提口径：顾客指定 = 额外叠加 ---- */
const lines = D.getTrialLines();
const lineTl3 = lines.filter(l => l.id === 'tl3')[0];          // 深层补水护理 268 指定
const lineTl6 = lines.filter(l => l.id === 'tl6')[0];          // 洗头 groupBuy 非指定
const lineTl4 = lines.filter(l => l.id === 'tl4')[0];          // 染发 358 指定 station senior

let trial = D.calcStaffTrial('st4', [lineTl3]);
let row = trial.rows[0];
V('calc-hydrate-15pct+3pct', near(row.amount, 268 * 0.18), { amount: row.amount, label: row.winner && row.winner.rateLabel });
V('calc-hydrate-label', /顾客指定/.test(row.winner.rateLabel), row.winner.rateLabel);

trial = D.calcStaffTrial('st4', [lineTl4]);
row = trial.rows[0];
V('calc-dye-15pct+5pct', near(row.amount, 358 * 0.20), { amount: row.amount, label: row.winner.rateLabel });

trial = D.calcStaffTrial('st4', [lineTl6]);
row = trial.rows[0];
V('calc-non-designated-amount-only', near(row.amount, 5), { amount: row.amount, label: row.winner.rateLabel });

/* 指定 + 混合：工位/提成按比例、额外按固定金额（q1-A 允许混合） */
const hyd = fl.overrides.filter(o => o.id === 'ov_flagship_hydrate')[0];
const mixLine = { id: 'mix', name: '混合', cat: 'labor', kind: 'project', refId: 'p21', pay: 'cash', list: 200, paid: 200, designated: true };
hyd.rule.extraValueMode = 'amount';
hyd.rule.extraAmt = 5;
trial = D.calcStaffTrial('st4', [mixLine]);
V('calc-mixed-pct+amt', near(trial.rows[0].amount, 200 * 0.15 + 5), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });
hyd.rule.extraValueMode = 'pct';
hyd.rule.extraAmt = 0;

/* ---- 3. 旧数据迁移：点客值 → 额外值（值不变） ---- */
const legacy = {
  valueMode: 'pct', nonDesignated: 10, designated: 20,
  nonDesignatedValueMode: 'pct', designatedValueMode: 'pct',
  guestSplit: true,
  stations: {
    senior: { nonDesignated: 10, nonDesignatedAmt: 0, valueMode: 'pct' },
    mid: { nonDesignated: 10, nonDesignatedAmt: 0, valueMode: 'pct' },
    junior: { nonDesignated: 10, nonDesignatedAmt: 0, valueMode: 'pct' }
  },
  _vm2: true, _gs2: true
};
const legacyLine = { id: 'lg', name: '旧数据', cat: 'labor', kind: 'project', refId: 'p_legacy_x', pay: 'cash', list: 100, paid: 100, designated: true };
fl.defaults.labor = Object.assign({}, fl.defaults.labor, { pickMode: 'avg', rule: legacy });
trial = D.calcStaffTrial('st4', [legacyLine]);
const mig = fl.defaults.labor.rule;
V('legacy-extraValue-20', near(mig.extraValue, 20), mig.extraValue);
V('legacy-extraSplit-true', mig.extraSplit === true);
V('legacy-keys-removed', mig.designated === undefined && mig.guestSplit === undefined);
V('legacy-calc-10+20', near(trial.rows[0].amount, 30), trial.rows[0].amount);

/* ---- 4. 关闭顾客指定：额外值归零 ---- */
fl.defaults.labor.rule.extraSplit = false;
trial = D.calcStaffTrial('st4', [legacyLine]);
V('off-extra-zeroed', mig.extraValue === 0 && mig.extraAmt === 0, { v: mig.extraValue, a: mig.extraAmt });
V('off-calc-base-only', near(trial.rows[0].amount, 10), trial.rows[0].amount);

/* ---- 5. 十七次：明确没勾提成侧（basePicked=false）→ 提成侧 0、只发顾客指定 ---- */
/* 5a. 不分工位（默认 labor 块）：规则级 提成 10% + 顾客指定 5% */
fl.defaults.labor = {
  pickMode: 'avg',
  rule: {
    valueMode: 'pct', nonDesignated: 10, nonDesignatedAmt: 0, nonDesignatedValueMode: 'pct',
    extraSplit: true, extraValue: 5, extraAmt: 0, extraValueMode: 'pct', baseMode: 'list',
    stations: {
      senior: { nonDesignated: 12, nonDesignatedAmt: 0, valueMode: 'pct' },
      mid: { nonDesignated: 10, nonDesignatedAmt: 0, valueMode: 'pct' },
      junior: { nonDesignated: 8, nonDesignatedAmt: 0, valueMode: 'pct' }
    },
    _vm2: true, _ex1: true
  }
};
const avgLine = { id: 'p_avg', name: '不分工位口径', cat: 'labor', kind: 'project', refId: 'p_avg_test', pay: 'cash', list: 200, paid: 200, designated: true };
trial = D.calcStaffTrial('st4', [avgLine]);
V('basepicked-absent-avg-10+5', near(trial.rows[0].amount, 200 * 0.15), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });
trial = D.calcStaffTrial('st4', [Object.assign({}, avgLine, { id: 'p_avg2', basePicked: false })]);
V('basepicked-false-avg-extra-only', near(trial.rows[0].amount, 200 * 0.05), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });
V('basepicked-false-avg-label', !/10%|0%/.test(trial.rows[0].winner.rateLabel) && /顾客指定/.test(trial.rows[0].winner.rateLabel), trial.rows[0].winner.rateLabel);
trial = D.calcStaffTrial('st4', [Object.assign({}, avgLine, { id: 'p_avg3', basePicked: false, designated: false })]);
V('basepicked-false-avg-no-extra-0', near(trial.rows[0].amount, 0), { amount: trial.rows[0].amount, label: trial.rows[0].winner && trial.rows[0].winner.rateLabel });

/* 5b. 按工位（深层补水护理 override 块 · 工位 12/10/8 + 顾客指定 5%） */
const hydB = fl.overrides.filter(o => o.id === 'ov_flagship_hydrate')[0];
hydB.pickMode = 'station';
hydB.baseMode = 'list';
hydB.rule.pickMode = 'station';
hydB.rule.extraSplit = true;
hydB.rule.extraValue = 5;
hydB.rule.extraAmt = 0;
hydB.rule.extraValueMode = 'pct';
hydB.rule.stations.senior = { nonDesignated: 12, nonDesignatedAmt: 0, valueMode: 'pct' };
hydB.rule.stations.mid = { nonDesignated: 10, nonDesignatedAmt: 0, valueMode: 'pct' };
hydB.rule.stations.junior = { nonDesignated: 8, nonDesignatedAmt: 0, valueMode: 'pct' };
const stLine = { id: 'p_st', name: '按工位口径', cat: 'labor', kind: 'project', refId: 'p21', pay: 'cash', list: 200, paid: 200, designated: true, station: 'mid' };
trial = D.calcStaffTrial('st4', [stLine]);
V('basepicked-absent-station-10+5', near(trial.rows[0].amount, 200 * 0.15), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });
trial = D.calcStaffTrial('st4', [Object.assign({}, stLine, { id: 'p_st2', basePicked: false })]);
V('basepicked-false-station-extra-only', near(trial.rows[0].amount, 200 * 0.05), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });
V('basepicked-false-station-label', !/10%|12%|0%/.test(trial.rows[0].winner.rateLabel) && /顾客指定/.test(trial.rows[0].winner.rateLabel), trial.rows[0].winner.rateLabel);
trial = D.calcStaffTrial('st4', [Object.assign({}, stLine, { id: 'p_st3', basePicked: false, designated: false })]);
V('basepicked-false-station-no-extra-0', near(trial.rows[0].amount, 0), { amount: trial.rows[0].amount, label: trial.rows[0].winner && trial.rows[0].winner.rateLabel });
trial = D.calcStaffTrial('st4', [Object.assign({}, stLine, { id: 'p_st4', basePicked: true })]);
V('basepicked-true-station-10+5', near(trial.rows[0].amount, 200 * 0.15), { amount: trial.rows[0].amount, label: trial.rows[0].winner.rateLabel });

console.log(fails ? ('FAILED ' + fails) : 'ALL PASS');
process.exit(fails ? 1 : 0);
