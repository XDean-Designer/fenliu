/**
 * 管店承接 · 点击引导编排（由 index.html 主脚本挂到 window.JlRtbShell）
 */
(function (g) {
  'use strict';

  var STEP_KEY = 'jl_rtb_guide_step';
  var OWNER_KEY = 'jl_rtb_owner_only';
  var DONE_KEY = 'jl_rtb_guide_done';
  var QUIET_KEY = 'jl_rtb_guide_quiet';

  function ssGet(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function ssSet(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }
  function ssDel(k) {
    try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ }
  }

  function setStep(step) {
    if (step) ssSet(STEP_KEY, step);
    else ssDel(STEP_KEY);
  }
  function getStep() { return ssGet(STEP_KEY); }

  function isQuiet() {
    return ssGet(QUIET_KEY) === '1' || ssGet(DONE_KEY) === '1';
  }

  function markDone() {
    ssSet(DONE_KEY, '1');
    ssSet(QUIET_KEY, '1');
    ssDel(STEP_KEY);
    ssDel(OWNER_KEY);
  }

  function resetGuide() {
    [STEP_KEY, OWNER_KEY, DONE_KEY, QUIET_KEY].forEach(ssDel);
  }

  function handUrl() {
    return (g.JlShellLocalUrl ? g.JlShellLocalUrl('assets/ic_coach_hand.svg') : 'assets/ic_coach_hand.svg');
  }
  function coachJsUrl() {
    return (g.JlShellLocalUrl ? g.JlShellLocalUrl('assets/jl-embed-coach.js') : 'assets/jl-embed-coach.js');
  }
  function coachCssUrl() {
    return (g.JlShellLocalUrl ? g.JlShellLocalUrl('assets/jl-embed-coach.css') : 'assets/jl-embed-coach.css');
  }

  function ensureCoachIn(doc, w) {
    if (!doc || !w) return false;
    if (!doc.getElementById('jlEmbedCoachCssLink')) {
      var link = doc.createElement('link');
      link.id = 'jlEmbedCoachCssLink';
      link.rel = 'stylesheet';
      link.href = coachCssUrl();
      doc.head.appendChild(link);
    }
    if (!w.JlEmbedCoach) {
      var s = doc.createElement('script');
      s.id = 'jlEmbedCoachJs';
      s.src = coachJsUrl();
      doc.body.appendChild(s);
      return false;
    }
    w.JlEmbedCoach.setHand(handUrl());
    return true;
  }

  function showInEmbed(iframe, sel, opts) {
    opts = opts || {};
    try {
      var doc = iframe.contentDocument;
      var w = iframe.contentWindow;
      if (!doc || !w) return;
      var ready = ensureCoachIn(doc, w);
      var run = function () {
        if (!w.JlEmbedCoach) return;
        w.JlEmbedCoach.setHand(handUrl());
        var el = typeof sel === 'string' ? doc.querySelector(sel) : sel;
        if (!el) return;
        w.JlEmbedCoach.show(el, opts);
      };
      if (ready) run();
      else setTimeout(run, 80);
    } catch (e) { /* ignore */ }
  }

  function hideInEmbed(iframe) {
    try {
      var w = iframe.contentWindow;
      if (w && w.JlEmbedCoach) w.JlEmbedCoach.hide();
    } catch (e) { /* ignore */ }
  }

  /** 按当前 step 在嵌壳内点引导 */
  function applyStepCoach(iframe, key) {
    if (isQuiet()) return;
    var step = getStep();
    if (!step || !iframe) return;
    if (key === 'price' && step === 'price-add') {
      showInEmbed(iframe, '#btnProjTitleAdd', {
        text: '点这里添加项目',
        place: 'center',
        tipSide: 'left'
      });
      return;
    }
    if (key === 'staff' && step === 'staff-list') {
      showInEmbed(iframe, '.emp-row[data-staff-id]', {
        text: '点开店主资料',
        place: 'below'
      });
      return;
    }
    if (key === 'staff' && (step === 'staff-detail-tip' || step === 'staff-detail-edit')) {
      showInEmbed(iframe, '#screen-emp-detail [data-detail-edit="gender"]', {
        text: '点右侧可改资料',
        place: 'center',
        tipSide: 'left',
        dismissAny: true
      });
      return;
    }
    if (key === 'bill') {
      var doc = null;
      try { doc = iframe.contentDocument; } catch (eDoc) { doc = null; }
      var s15 = doc && doc.getElementById('s15');
      var onS15 = !!(s15 && s15.classList.contains('active'));
      /* 已在开单成功页：强制看流水，避免残留「确认支付」 */
      if (onS15 || step === 'bill-flow') {
        if (step !== 'bill-flow') setStep('bill-flow');
        showInEmbed(iframe, '#s15 .suc-act[data-suc-act="flow"]', {
          text: '点这里看流水',
          place: 'center',
          tipSide: 'left'
        });
        return;
      }
      if (step === 'bill-cust') {
        showInEmbed(iframe, '#s1 .guest-card .btn, #s1 button.btn', { text: '先选一位顾客', place: 'below' });
      } else if (step === 'bill-add') {
        showInEmbed(iframe, '#s1 .proj-card[data-cat="proj"] .add', { text: '点加号加入项目', place: 'center' });
      } else if (step === 'bill-staff') {
        showInEmbed(iframe, '#addSheetMask .staff-card, #addSheetMask .comm2-sp-card__cell, #addSheetMask [data-staff-id], #addSheetMask .detail-item__staff-card', {
          text: '选第一位服务员工',
          place: 'center'
        });
      } else if (step === 'bill-staff-ok') {
        showInEmbed(iframe, '#addSheetMask .btn-confirm, .addsheet__foot .btn-confirm', { text: '点确定', place: 'center' });
      } else if (step === 'bill-next') {
        showInEmbed(iframe, '#s1 .btn-next, #s1 [data-next]', { text: '点下一步', place: 'center' });
      } else if (step === 'bill-checkout') {
        showInEmbed(iframe, '#s6 .btn-c, #s6 button.btn-c', { text: '点结账', place: 'center' });
      } else if (step === 'bill-pay') {
        showInEmbed(iframe, '#paySheetMask .btn, #paySheetMask button.btn', { text: '确认支付', place: 'center' });
      }
    }
  }

  g.JlRtbShell = {
    STEP_KEY: STEP_KEY,
    setStep: setStep,
    getStep: getStep,
    isQuiet: isQuiet,
    markDone: markDone,
    resetGuide: resetGuide,
    applyStepCoach: applyStepCoach,
    hideInEmbed: hideInEmbed,
    armOwnerOnly: function () { ssSet(OWNER_KEY, '1'); },
    clearOwnerOnly: function () { ssDel(OWNER_KEY); }
  };
})(typeof window !== 'undefined' ? window : this);
