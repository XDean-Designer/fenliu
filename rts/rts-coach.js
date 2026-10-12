/**
 * 获客承接 · 新手引导（方案 C）与会话标记
 * 与分流壳通过 postMessage / sessionStorage 协作
 */
(function (g) {
  'use strict';

  var KEYS = {
    empty: 'jl_rts_empty',
    publishDone: 'jl_rts_guide_publish',
    plazaModal: 'jl_rts_guide_plaza_modal',
    plazaLater: 'jl_rts_guide_plaza_later',
    mineDone: 'jl_rts_guide_mine',
    quiet: 'jl_rts_guide_quiet',
    needPlazaModal: 'jl_rts_need_plaza_modal',
    needMineCoach: 'jl_rts_need_mine_coach'
  };

  function ssGet(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function ssSet(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }
  function ssDel(k) {
    try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ }
  }

  function isOnboarding() {
    if (ssGet(KEYS.empty) === '1') return true;
    try {
      var q = new URLSearchParams(location.search);
      return q.get('onboarding') === '1' || q.get('empty') === '1';
    } catch (e) {
      return false;
    }
  }

  function isQuiet() {
    return ssGet(KEYS.quiet) === '1';
  }

  function markQuiet() {
    ssSet(KEYS.quiet, '1');
  }

  function clearGuideFlags() {
    [
      KEYS.publishDone,
      KEYS.plazaModal,
      KEYS.plazaLater,
      KEYS.mineDone,
      KEYS.quiet,
      KEYS.needPlazaModal,
      KEYS.needMineCoach
    ].forEach(ssDel);
  }

  var coachEl = null;
  var coachTarget = null;
  var coachRaf = 0;
  var onDismissCb = null;

  function ensureCoachDom() {
    if (coachEl) return coachEl;
    coachEl = document.createElement('div');
    coachEl.className = 'jl-coach';
    coachEl.id = 'jlRtsCoach';
    coachEl.setAttribute('aria-hidden', 'true');
    coachEl.innerHTML =
      '<div class="jl-coach__pulse"></div>' +
      '<div class="jl-coach__hand" aria-hidden="true">' +
      '<img src="assets/ic_coach_hand.svg" width="40" height="40" alt="">' +
      '</div>' +
      '<div class="jl-coach__tip"></div>';
    document.body.appendChild(coachEl);
    return coachEl;
  }

  var coachPlaceMode = 'default';

  function placeCoach() {
    if (!coachEl || !coachTarget) return;
    var r = coachTarget.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var x, y;
    if (coachPlaceMode === 'beside') {
      /* 点在目标文字右侧旁 */
      x = r.right + 10;
      y = r.top + r.height * 0.5;
    } else if (coachPlaceMode === 'center') {
      /* 目标几何中心 */
      x = r.left + r.width * 0.5;
      y = r.top + r.height * 0.5;
    } else {
      x = r.left + Math.min(r.width * 0.72, r.width - 12);
      y = r.top + Math.min(r.height * 0.55, r.height - 8);
    }
    coachEl.style.left = Math.round(x) + 'px';
    coachEl.style.top = Math.round(y) + 'px';
  }

  function loopPlace() {
    placeCoach();
    coachRaf = g.requestAnimationFrame(loopPlace);
  }

  function hideCoach() {
    if (coachRaf) {
      g.cancelAnimationFrame(coachRaf);
      coachRaf = 0;
    }
    if (coachEl) coachEl.style.display = 'none';
    coachTarget = null;
    var cb = onDismissCb;
    onDismissCb = null;
    return cb;
  }

  /**
   * @param {Element} target
   * @param {{ text?: string, onDismiss?: function }} opts
   */
  function showCoach(target, opts) {
    opts = opts || {};
    if (!target) return;
    hideCoach();
    var el = ensureCoachDom();
    var tip = el.querySelector('.jl-coach__tip');
    if (tip) {
      tip.textContent = opts.text || '点这里';
      tip.style.display = opts.text === '' ? 'none' : '';
    }
    coachTarget = target;
    coachPlaceMode = opts.place === 'beside' || opts.place === 'center' ? opts.place : 'default';
    onDismissCb = typeof opts.onDismiss === 'function' ? opts.onDismiss : null;
    el.style.display = 'block';
    placeCoach();
    coachRaf = g.requestAnimationFrame(loopPlace);
    g.addEventListener('resize', placeCoach);
    g.addEventListener('scroll', placeCoach, true);
  }

  function dismissCoach() {
    g.removeEventListener('resize', placeCoach);
    g.removeEventListener('scroll', placeCoach, true);
    var cb = hideCoach();
    if (cb) cb();
  }

  /** 退出获客频道 → 通知分流壳回 APP 首页并出转化弹窗 */
  function exitToAppHome() {
    if (g.parent && g.parent !== g) {
      try {
        g.parent.postMessage({ type: 'jl-rts-exit' }, '*');
        return;
      } catch (e) { /* fall through */ }
    }
    /* 非嵌壳时退回占位页（独立打开 RTS 时） */
    var dir = location.pathname.replace(/[^/]*$/, '');
    location.href = dir + 'b000_home.html';
  }

  g.JlRtsCoach = {
    KEYS: KEYS,
    get: ssGet,
    set: ssSet,
    del: ssDel,
    isOnboarding: isOnboarding,
    isQuiet: isQuiet,
    markQuiet: markQuiet,
    clearGuideFlags: clearGuideFlags,
    show: showCoach,
    hide: dismissCoach,
    exitToAppHome: exitToAppHome
  };
})(typeof window !== 'undefined' ? window : this);
