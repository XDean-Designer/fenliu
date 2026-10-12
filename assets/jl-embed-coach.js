/**
 * 嵌壳通用点击引导（管店 / 价目 / 员工 / 开单）
 * 由分流壳 inject 进 iframe；与 shell 用 postMessage 协作
 */
(function (g) {
  'use strict';

  var coachEl = null;
  var coachTarget = null;
  var coachRaf = 0;
  var placeMode = 'default';
  var handSrc = '';

  function ensureDom() {
    if (coachEl) return coachEl;
    coachEl = document.createElement('div');
    coachEl.className = 'jl-coach';
    coachEl.id = 'jlEmbedCoach';
    coachEl.setAttribute('aria-hidden', 'true');
    coachEl.innerHTML =
      '<div class="jl-coach__pulse"></div>' +
      '<div class="jl-coach__hand" aria-hidden="true">' +
      '<img src="' + (handSrc || 'assets/ic_coach_hand.svg') + '" width="40" height="40" alt="">' +
      '</div>' +
      '<div class="jl-coach__tip"></div>';
    document.body.appendChild(coachEl);
    if (!document.getElementById('jlEmbedCoachCss')) {
      var st = document.createElement('link');
      st.id = 'jlEmbedCoachCss';
      st.rel = 'stylesheet';
      st.href = handSrc ? handSrc.replace(/ic_coach_hand\.svg$/, 'jl-embed-coach.css') : 'assets/jl-embed-coach.css';
      /* fallback: inline minimal if css missing */
      document.head.appendChild(st);
    }
    return coachEl;
  }

  function place() {
    if (!coachEl || !coachTarget) return;
    var r = coachTarget.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var x, y;
    if (placeMode === 'beside') {
      x = r.right + 10;
      y = r.top + r.height * 0.5;
    } else if (placeMode === 'center') {
      x = r.left + r.width * 0.5;
      y = r.top + r.height * 0.5;
    } else {
      x = r.left + Math.min(r.width * 0.72, r.width - 12);
      y = r.top + Math.min(r.height * 0.55, r.height - 8);
    }
    coachEl.style.left = Math.round(x) + 'px';
    coachEl.style.top = Math.round(y) + 'px';
  }

  function loop() {
    place();
    coachRaf = g.requestAnimationFrame(loop);
  }

  function hide() {
    if (coachRaf) {
      g.cancelAnimationFrame(coachRaf);
      coachRaf = 0;
    }
    if (coachEl) coachEl.style.display = 'none';
    coachTarget = null;
  }

  function show(target, opts) {
    opts = opts || {};
    if (!target) return;
    hide();
    if (opts.handSrc) handSrc = opts.handSrc;
    var el = ensureDom();
    var tip = el.querySelector('.jl-coach__tip');
    if (tip) {
      tip.textContent = opts.text || '点这里';
      tip.style.display = opts.text === '' ? 'none' : '';
    }
    var img = el.querySelector('.jl-coach__hand img');
    if (img && handSrc) img.src = handSrc;
    coachTarget = target;
    placeMode = opts.place || 'default';
    el.style.display = 'block';
    place();
    coachRaf = g.requestAnimationFrame(loop);
  }

  function showSel(sel, opts) {
    var t = typeof sel === 'string' ? document.querySelector(sel) : sel;
    show(t, opts);
  }

  function post(type, extra) {
    try {
      if (g.parent && g.parent !== g) {
        g.parent.postMessage(Object.assign({ type: type }, extra || {}), '*');
      }
    } catch (e) { /* ignore */ }
  }

  g.JlEmbedCoach = {
    show: show,
    showSel: showSel,
    hide: hide,
    post: post,
    setHand: function (src) { handSrc = src || ''; }
  };
})(typeof window !== 'undefined' ? window : this);
