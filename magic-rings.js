/* global THREE */
/**
 * MagicRings — vanilla порт @react-bits (Three.js + шейдеры).
 * Цвета под палитру сайта (терракота / мята).
 */
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var vertexShader = [
    'void main() {',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var fragmentShader = [
    'precision highp float;',
    '',
    'uniform float uTime, uAttenuation, uLineThickness;',
    'uniform float uBaseRadius, uRadiusStep, uScaleRate;',
    'uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;',
    'uniform float uFadeIn, uFadeOut;',
    'uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;',
    'uniform vec2 uResolution, uMouse;',
    'uniform vec3 uColor, uColorTwo;',
    'uniform int uRingCount;',
    '',
    'const float HP = 1.5707963;',
    'const float CYCLE = 3.45;',
    '',
    'float fade(float t) {',
    '  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);',
    '}',
    '',
    'float ring(vec2 p, float ri, float cut, float t0, float px) {',
    '  float t = mod(uTime + t0, CYCLE);',
    '  float r = ri + t / CYCLE * uScaleRate;',
    '  float d = abs(length(p) - r);',
    '  float a = atan(abs(p.y), abs(p.x)) / HP;',
    '  float th = max(1.0 - a, 0.5) * px * uLineThickness;',
    '  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;',
    '  d += pow(cut * a, 3.0) * r;',
    '  return h * exp(-uAttenuation * d) * fade(t);',
    '}',
    '',
    'void main() {',
    '  float px = 1.0 / min(uResolution.x, uResolution.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;',
    '  float cr = cos(uRotation), sr = sin(uRotation);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p -= uMouse * uMouseInfluence;',
    '  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;',
    '  p /= sc;',
    '  vec3 c = vec3(0.0);',
    '  float rcf = max(float(uRingCount) - 1.0, 1.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    if (i >= uRingCount) break;',
    '    float fi = float(i);',
    '    vec2 pr = p - fi * uParallax * uMouse;',
    '    vec3 rc = mix(uColor, uColorTwo, fi / rcf);',
    '    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));',
    '  }',
    '  c *= 1.0 + uBurst * 2.0;',
    '  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (n - 0.5) * uNoiseAmount;',
    '  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);',
    '}'
  ].join('\n');

  var CONFIG = {
    color: '#c45c3e',
    colorTwo: '#5a9b86',
    ringCount: 6,
    speed: 1,
    attenuation: 10,
    lineThickness: 2,
    baseRadius: 0.35,
    radiusStep: 0.1,
    scaleRate: 0.1,
    opacity: 0.55,
    blur: 0,
    noiseAmount: 0.1,
    rotation: 0,
    ringGap: 1.5,
    fadeIn: 0.7,
    fadeOut: 0.5,
    followMouse: false,
    mouseInfluence: 0.2,
    hoverScale: 1.2,
    parallax: 0.05,
    clickBurst: false
  };

  function init() {
    if (prefersReducedMotion()) return;
    if (typeof THREE === 'undefined') return;

    var mount = document.getElementById('heroMagicRings');
    if (!mount) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    var uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 }
    };

    var material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      transparent: true
    });
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    var mouseRef = [0, 0];
    var smoothMouseRef = [0, 0];
    var hoverAmountRef = 0;
    var isHoveredRef = false;
    var burstRef = 0;

    function resize() {
      var w = mount.clientWidth;
      var h = mount.clientHeight;
      if (w < 1 || h < 1) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    }

    resize();
    window.addEventListener('resize', resize);
    var ro = new ResizeObserver(resize);
    ro.observe(mount);

    function onMouseMove(e) {
      var rect = mount.getBoundingClientRect();
      mouseRef[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    }
    function onMouseEnter() {
      isHoveredRef = true;
    }
    function onMouseLeave() {
      isHoveredRef = false;
      mouseRef[0] = 0;
      mouseRef[1] = 0;
    }
    function onClick() {
      burstRef = 1;
    }

    if (CONFIG.followMouse || CONFIG.clickBurst) {
      mount.addEventListener('mousemove', onMouseMove);
      mount.addEventListener('mouseenter', onMouseEnter);
      mount.addEventListener('mouseleave', onMouseLeave);
      if (CONFIG.clickBurst) mount.addEventListener('click', onClick);
    }

    if (CONFIG.blur > 0) {
      mount.style.filter = 'blur(' + CONFIG.blur + 'px)';
    }

    var frameId;
    function animate(t) {
      frameId = requestAnimationFrame(animate);

      smoothMouseRef[0] += (mouseRef[0] - smoothMouseRef[0]) * 0.08;
      smoothMouseRef[1] += (mouseRef[1] - smoothMouseRef[1]) * 0.08;
      hoverAmountRef += ((isHoveredRef ? 1 : 0) - hoverAmountRef) * 0.08;
      burstRef *= 0.95;
      if (burstRef < 0.001) burstRef = 0;

      uniforms.uTime.value = t * 0.001 * CONFIG.speed;
      uniforms.uAttenuation.value = CONFIG.attenuation;
      uniforms.uColor.value.set(CONFIG.color);
      uniforms.uColorTwo.value.set(CONFIG.colorTwo);
      uniforms.uLineThickness.value = CONFIG.lineThickness;
      uniforms.uBaseRadius.value = CONFIG.baseRadius;
      uniforms.uRadiusStep.value = CONFIG.radiusStep;
      uniforms.uScaleRate.value = CONFIG.scaleRate;
      uniforms.uRingCount.value = CONFIG.ringCount;
      uniforms.uOpacity.value = CONFIG.opacity;
      uniforms.uNoiseAmount.value = CONFIG.noiseAmount;
      uniforms.uRotation.value = (CONFIG.rotation * Math.PI) / 180;
      uniforms.uRingGap.value = CONFIG.ringGap;
      uniforms.uFadeIn.value = CONFIG.fadeIn;
      uniforms.uFadeOut.value = CONFIG.fadeOut;
      uniforms.uMouse.value.set(smoothMouseRef[0], smoothMouseRef[1]);
      uniforms.uMouseInfluence.value = CONFIG.followMouse ? CONFIG.mouseInfluence : 0;
      uniforms.uHoverAmount.value = hoverAmountRef;
      uniforms.uHoverScale.value = CONFIG.hoverScale;
      uniforms.uParallax.value = CONFIG.parallax;
      uniforms.uBurst.value = CONFIG.clickBurst ? burstRef : 0;

      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);

    window.__heroMagicRingsCleanup = function () {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('mouseenter', onMouseEnter);
      mount.removeEventListener('mouseleave', onMouseLeave);
      mount.removeEventListener('click', onClick);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
      window.__heroMagicRingsCleanup = null;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
