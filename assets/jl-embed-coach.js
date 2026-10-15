/**
 * 嵌壳通用点击引导（管店 / 价目 / 员工 / 开单）
 * place: default | beside | center | below | left | label
 * tipSide: 'left' | 'right' | 'below' | 'auto'（默认 auto：随 place；可强制 tip 在手左/右）
 */
(function (g) {
  'use strict';

  var coachEl = null;
  var coachTarget = null;
  var coachRaf = 0;
  var placeMode = 'default';
  var tipSide = 'auto';
  var handSrc = '';
  var dismissAny = false;
  var onDismissCb = null;
  var dismissBound = null;

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
      st.href = handSrc
        ? handSrc.replace(/ic_coach_hand\.svg$/, 'jl-embed-coach.css')
        : 'assets/jl-embed-coach.css';
      document.head.appendChild(st);
    }
    return coachEl;
  }

  function tipSize() {
    var tip = coachEl && coachEl.querySelector('.jl-coach__tip');
    if (!tip || tip.style.display === 'none') return { w: 0, h: 0 };
    var r = tip.getBoundingClientRect();
    return { w: r.width || 140, h: r.height || 30 };
  }

  function place() {
    if (!coachEl || !coachTarget) return;
    var r = coachTarget.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var vw = g.innerWidth || document.documentElement.clientWidth || 390;
    var vh = g.innerHeight || document.documentElement.clientHeight || 844;
    var ts = tipSize();
    var mode = placeMode;
    var x;
    var y;

    if (mode === 'beside') {
      x = r.right + 10;
      y = r.top + r.height * 0.5;
      if (x + Math.max(ts.w, 40) > vw - 8) mode = 'below';
    }
    if (mode === 'left') {
      x = r.left - 18;
      y = r.top + r.height * 0.5;
      if (x < 28) mode = 'below';
    }
    if (mode === 'label') {
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
      if (tipSide !== 'left' && x + ts.w + 28 > vw - 8) mode = 'below';
      if (mode === 'below') {
        x = r.left + r.width * 0.5;
        y = r.bottom + 18;
      }
    }

    var useTipLeft = tipSide === 'left' || mode === 'left';
    var useTipBelow = tipSide === 'below' || (tipSide === 'auto' && mode === 'below' && tipSide !== 'left');
    if (tipSide === 'left') useTipBelow = false;

    /* tip 在左侧时：锚点偏右一点，给灰框留空，并钳制不溢出 */
    if (useTipLeft) {
      var needLeft = Math.max(ts.w + 36, 120);
      x = Math.max(needLeft, Math.min(x, vw - 24));
    }

    var padX = 28;
    var padY = 28;
    if (useTipBelow) {
      padY = 20;
      y = Math.min(y, vh - ts.h - 16);
    }
    x = Math.max(padX, Math.min(x, vw - padX));
    y = Math.max(padY, Math.min(y, vh - padY));

    coachEl.classList.toggle('jl-coach--tip-below', useTipBelow);
    coachEl.classList.toggle('jl-coach--tip-left', useTipLeft && !useTipBelow);
    coachEl.style.left = Math.round(x) + 'px';
    coachEl.style.top = Math.round(y) + 'px';
  }

  function loop() {
    place();
    coachRaf = g.requestAnimationFrame(loop);
  }

  function unbindDismiss() {
    if (!dismissBound) return;
    document.removeEventListener('pointerdown', dismissBound, true);
    document.removeEventListener('touchstart', dismissBound, true);
    dismissBound = null;
  }

  function hide() {
    if (coachRaf) {
      g.cancelAnimationFrame(coachRaf);
      coachRaf = 0;
    }
    unbindDismiss();
    if (coachEl) {
      coachEl.style.display = 'none';
      coachEl.classList.remove('jl-coach--tip-below', 'jl-coach--tip-left');
    }
    coachTarget = null;
    var cb = onDismissCb;
    onDismissCb = null;
    return cb;
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
    placeMode = opts.place === 'beside' || opts.place === 'center' || opts.place === 'below' ||
      opts.place === 'left' || opts.place === 'label'
      ? opts.place
      : (opts.place || 'default');
    tipSide = opts.tipSide === 'left' || opts.tipSide === 'right' || opts.tipSide === 'below'
      ? opts.tipSide
      : 'auto';
    dismissAny = !!opts.dismissAny;
    onDismissCb = typeof opts.onDismiss === 'function' ? opts.onDismiss : null;
    el.style.display = 'block';
    place();
    coachRaf = g.requestAnimationFrame(loop);

    if (dismissAny) {
      dismissBound = function () {
        var cb = hide();
        if (cb) cb();
      };
      setTimeout(function () {
        if (!dismissBound) return;
        document.addEventListener('pointerdown', dismissBound, true);
        document.addEventListener('touchstart', dismissBound, true);
      }, 80);
    }
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
