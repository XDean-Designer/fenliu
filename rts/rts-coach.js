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
    cardDone: 'jl_rts_guide_mine_card',
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
      KEYS.cardDone,
      KEYS.quiet,
      KEYS.needPlazaModal,
      KEYS.needMineCoach
    ].forEach(ssDel);
  }

  var coachEl = null;
  var coachTarget = null;
  var coachRaf = 0;
  var onDismissCb = null;
  var coachPlaceMode = 'default';
  var dismissBound = null;

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

  function tipSize() {
    var tip = coachEl && coachEl.querySelector('.jl-coach__tip');
    if (!tip || tip.style.display === 'none') return { w: 0, h: 0 };
    var r = tip.getBoundingClientRect();
    return { w: r.width || 140, h: r.height || 30 };
  }

  function placeCoach() {
    if (!coachEl || !coachTarget) return;
    var r = coachTarget.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var vw = g.innerWidth || document.documentElement.clientWidth || 390;
    var vh = g.innerHeight || document.documentElement.clientHeight || 844;
    var ts = tipSize();
    var mode = coachPlaceMode;
    var x;
    var y;

    if (mode === 'beside') {
      x = r.right + 10;
      y = r.top + r.height * 0.5;
      if (x + Math.max(ts.w, 40) > vw - 8) mode = 'below';
    }
    if (mode === 'label') {
      /* Tab/标签文字：落在宽度约 65%（偏「活动」二字） */
      x = r.left + r.width * 0.65;
      y = r.top + r.height * 0.55;
    } else if (mode === 'below') {
      x = r.left + r.width * 0.5;
      y = r.bottom + 18;
    } else if (mode === 'center') {
      x = r.left + r.width * 0.5;
      y = r.top + r.height * 0.5;
    } else if (mode === 'default') {
      x = r.left + Math.min(r.width * 0.72, r.width - 12);
      y = r.top + Math.min(r.height * 0.55, r.height - 8);
      if (x + ts.w + 28 > vw - 8) {
        mode = 'below';
        x = r.left + r.width * 0.5;
        y = r.bottom + 18;
      }
    }

    x = Math.max(28, Math.min(x, vw - 28));
    y = Math.max(28, Math.min(y, vh - 28));
    coachEl.classList.toggle('jl-coach--tip-below', mode === 'below');
    coachEl.style.left = Math.round(x) + 'px';
    coachEl.style.top = Math.round(y) + 'px';
  }

  function loopPlace() {
    placeCoach();
    coachRaf = g.requestAnimationFrame(loopPlace);
  }

  function unbindDismiss() {
    if (!dismissBound) return;
    document.removeEventListener('pointerdown', dismissBound, true);
    document.removeEventListener('touchstart', dismissBound, true);
    dismissBound = null;
  }

  function hideCoach() {
    if (coachRaf) {
      g.cancelAnimationFrame(coachRaf);
      coachRaf = 0;
    }
    unbindDismiss();
    if (coachEl) {
      coachEl.style.display = 'none';
      coachEl.classList.remove('jl-coach--tip-below');
    }
    coachTarget = null;
    var cb = onDismissCb;
    onDismissCb = null;
    return cb;
  }

  /**
   * @param {Element} target
   * @param {{ text?: string, place?: string, dismissAny?: boolean, onDismiss?: function }} opts
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
    coachPlaceMode = opts.place === 'beside' || opts.place === 'center' || opts.place === 'below' || opts.place === 'label'
      ? opts.place
      : 'default';
    onDismissCb = typeof opts.onDismiss === 'function' ? opts.onDismiss : null;
    el.style.display = 'block';
    placeCoach();
    coachRaf = g.requestAnimationFrame(loopPlace);
    g.addEventListener('resize', placeCoach);
    g.addEventListener('scroll', placeCoach, true);

    if (opts.dismissAny) {
      dismissBound = function () {
        dismissCoach();
      };
      setTimeout(function () {
        if (!dismissBound) return;
        document.addEventListener('pointerdown', dismissBound, true);
        document.addEventListener('touchstart', dismissBound, true);
      }, 80);
    }
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
