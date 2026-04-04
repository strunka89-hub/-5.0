/* global gsap */
/**
 * TargetCursor — vanilla порт @react-bits (GSAP).
 * Элементы: класс .cursor-target или авто-пометка интерактивов в initTargetCursorMarking().
 */
(function () {
  'use strict';

  var TARGET_SELECTOR = '.cursor-target';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMobileDevice() {
    var hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    var small = window.innerWidth <= 768;
    var ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
    var mobileRe = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouch && small) || mobileRe.test(ua);
  }

  function markInteractiveElements() {
    var sel =
      'a[href], button, .btn, .lang-switch, .calc-option, .service-card, .social-card, .contact-form, .footer-links a';
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.classList.contains('cursor-target')) el.classList.add('cursor-target');
    });
  }

  function initTargetCursor(options) {
    if (typeof gsap === 'undefined') return;
    if (prefersReducedMotion()) return;
    if (isMobileDevice()) return;

    var spinDuration = options.spinDuration != null ? options.spinDuration : 2;
    var hideDefaultCursor = options.hideDefaultCursor !== false;
    var hoverDuration = options.hoverDuration != null ? options.hoverDuration : 0.2;
    var parallaxOn = options.parallaxOn !== false;

    markInteractiveElements();

    var cursor = document.createElement('div');
    cursor.className = 'target-cursor-wrapper';
    cursor.innerHTML =
      '<div class="target-cursor-dot"></div>' +
      '<div class="target-cursor-corner corner-tl"></div>' +
      '<div class="target-cursor-corner corner-tr"></div>' +
      '<div class="target-cursor-corner corner-br"></div>' +
      '<div class="target-cursor-corner corner-bl"></div>';
    document.body.appendChild(cursor);

    var dotRef = cursor.querySelector('.target-cursor-dot');
    var cornersRef = cursor.querySelectorAll('.target-cursor-corner');
    var spinTl = null;
    var activeStrength = { val: 0 };
    var targetCornerPositionsRef = null;
    var tickerFnRef = null;
    var isActiveRef = false;

    var constants = { borderWidth: 3, cornerSize: 12 };

    var originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) document.body.style.cursor = 'none';

    function moveCursor(x, y) {
      gsap.to(cursor, { x: x, y: y, duration: 0.1, ease: 'power3.out' });
    }

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    function createSpinTimeline() {
      if (spinTl) spinTl.kill();
      spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    }
    createSpinTimeline();

    var activeTarget = null;
    var currentLeaveHandler = null;
    var resumeTimeout = null;

    function cleanupTarget(target) {
      if (currentLeaveHandler && target) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    }

    function tickerFn() {
      if (!targetCornerPositionsRef || !cornersRef.length) return;
      var strength = activeStrength.val;
      if (strength === 0) return;

      var cursorX = gsap.getProperty(cursor, 'x');
      var cursorY = gsap.getProperty(cursor, 'y');
      var corners = Array.prototype.slice.call(cornersRef);

      corners.forEach(function (corner, i) {
        var currentX = gsap.getProperty(corner, 'x');
        var currentY = gsap.getProperty(corner, 'y');
        var targetX = targetCornerPositionsRef[i].x - cursorX;
        var targetY = targetCornerPositionsRef[i].y - cursorY;
        var finalX = currentX + (targetX - currentX) * strength;
        var finalY = currentY + (targetY - currentY) * strength;
        var duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    }
    tickerFnRef = tickerFn;

    function moveHandler(e) {
      moveCursor(e.clientX, e.clientY);
    }

    function scrollHandler() {
      if (!activeTarget) return;
      var mouseX = gsap.getProperty(cursor, 'x');
      var mouseY = gsap.getProperty(cursor, 'y');
      var under = document.elementFromPoint(mouseX, mouseY);
      var still =
        under &&
        (under === activeTarget || (under.closest && under.closest(TARGET_SELECTOR) === activeTarget));
      if (!still && currentLeaveHandler) currentLeaveHandler();
    }

    function mouseDownHandler() {
      if (dotRef) gsap.to(dotRef, { scale: 0.7, duration: 0.3 });
      gsap.to(cursor, { scale: 0.9, duration: 0.2 });
    }
    function mouseUpHandler() {
      if (dotRef) gsap.to(dotRef, { scale: 1, duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    }

    function enterHandler(e) {
      var directTarget = e.target;
      var allTargets = [];
      var current = directTarget;
      while (current && current !== document.body) {
        if (current.matches && current.matches(TARGET_SELECTOR)) allTargets.push(current);
        current = current.parentElement;
      }
      var target = allTargets[0] || null;
      if (!target) return;
      if (activeTarget === target) return;
      if (activeTarget) cleanupTarget(activeTarget);
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      var corners = Array.prototype.slice.call(cornersRef);
      corners.forEach(function (corner) {
        gsap.killTweensOf(corner);
      });

      gsap.killTweensOf(cursor, 'rotation');
      if (spinTl) spinTl.pause();
      gsap.set(cursor, { rotation: 0 });

      var rect = target.getBoundingClientRect();
      var bw = constants.borderWidth;
      var cs = constants.cornerSize;
      var cursorX = gsap.getProperty(cursor, 'x');
      var cursorY = gsap.getProperty(cursor, 'y');

      targetCornerPositionsRef = [
        { x: rect.left - bw, y: rect.top - bw },
        { x: rect.right + bw - cs, y: rect.top - bw },
        { x: rect.right + bw - cs, y: rect.bottom + bw - cs },
        { x: rect.left - bw, y: rect.bottom + bw - cs }
      ];

      isActiveRef = true;
      gsap.ticker.add(tickerFnRef);

      gsap.to(activeStrength, {
        val: 1,
        duration: hoverDuration,
        ease: 'power2.out'
      });

      corners.forEach(function (corner, i) {
        gsap.to(corner, {
          x: targetCornerPositionsRef[i].x - cursorX,
          y: targetCornerPositionsRef[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      function leaveHandler() {
        gsap.ticker.remove(tickerFnRef);
        isActiveRef = false;
        targetCornerPositionsRef = null;
        gsap.killTweensOf(activeStrength);
        activeStrength.val = 0;
        activeTarget = null;

        var corners2 = Array.prototype.slice.call(cornersRef);
        gsap.killTweensOf(corners2);
        var cornerSize = constants.cornerSize;
        var positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
        ];
        var tl = gsap.timeline();
        corners2.forEach(function (corner, index) {
          tl.to(
            corner,
            { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' },
            0
          );
        });

        resumeTimeout = setTimeout(function () {
          if (!activeTarget && cursor && spinTl) {
            var currentRotation = gsap.getProperty(cursor, 'rotation');
            var normalizedRotation = currentRotation % 360;
            spinTl.kill();
            spinTl = gsap
              .timeline({ repeat: -1 })
              .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
            gsap.to(cursor, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: function () {
                if (spinTl) spinTl.restart();
              }
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      }

      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    }

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseover', enterHandler, { passive: true });
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    window.__targetCursorCleanup = function () {
      if (tickerFnRef) gsap.ticker.remove(tickerFnRef);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) cleanupTarget(activeTarget);
      if (spinTl) spinTl.kill();
      document.body.style.cursor = originalCursor;
      isActiveRef = false;
      targetCornerPositionsRef = null;
      activeStrength.val = 0;
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
      window.__targetCursorCleanup = null;
    };
  }

  function boot() {
    initTargetCursor({
      spinDuration: 2,
      hideDefaultCursor: true,
      hoverDuration: 0.2,
      parallaxOn: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
