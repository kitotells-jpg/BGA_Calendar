// BGA Calendar: the animated sky behind the page.
//
// Built with the Shaders library v4 (shaders.com, MIT licence: vendor/LICENSE-shaders.txt), which draws with WebGPU.
// Dark mode is a night sky with an aurora in BGA blues and twinkling stars; light mode is a
// bright morning sky with sunbeams and a warm glow. Little lights drift across both, and they follow
// the season in Tbilisi: golden dust in autumn, snow in winter, blossom in spring, fireflies in summer.
//
// The still CSS sky from style.css stays instead when the browser has no WebGPU, when "Data saver"
// or "Reduce motion" is on, or on phones with little memory. Nothing here is needed for the
// countdowns, so any failure just leaves that CSS sky in place.

var SHADERS_URL = "./vendor/shaders-4.0.4.js";
var IDLE_MS = 90 * 1000; // freeze the sky after this long without a tap, scroll or key, to save battery

var canvas = document.getElementById("sky");
var root = document.documentElement;
var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var saveData = navigator.connection && navigator.connection.saveData;
var lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;

// ---------- Season (Georgia time) ----------

function season() {
  var m = new Date(Date.now() + 4 * 3600 * 1000).getUTCMonth(); // 0 = January
  if (m >= 8 && m <= 10) return "autumn";
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4) return "spring";
  return "summer";
}

// angle: 90 = rising, 270 = falling. Colours: [night, day].
var SEASONS = {
  autumn: { colors: ["#f2b45a", "#e8a547"], angle: 270, angleVariance: 40, speed: 0.07, count: 70, particleSize: 1.1, softness: 0.55, twinkle: 0.3, randomness: 0.6 },
  winter: { colors: ["#ffffff", "#8fb3ee"], angle: 270, angleVariance: 20, speed: 0.1, count: 130, particleSize: 0.9, softness: 0.7, twinkle: 0.15, randomness: 0.4 },
  spring: { colors: ["#f6b3cf", "#e486ad"], angle: 250, angleVariance: 45, speed: 0.06, count: 70, particleSize: 1.1, softness: 0.5, twinkle: 0.25, randomness: 0.7 },
  summer: { colors: ["#ffd36b", "#e0a526"], angle: 90, angleVariance: 70, speed: 0.04, count: 55, particleSize: 1.0, softness: 0.75, twinkle: 1, randomness: 0.9 }
};

// ---------- Night and day ----------

function isDark() {
  var set = root.getAttribute("data-theme");
  if (set) return set === "dark";
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function stops(list) {
  return list.map(function (c, i) { return { color: c, position: i / (list.length - 1) }; });
}

// Everything that changes between night and day. Layers one theme doesn't use are switched
// off with `visible`, so they cost nothing while hidden.
function look(dark) {
  return dark ? {
    sky: { stops: stops(["#04060c", "#081329", "#102a5c", "#1a438c"]) },
    rays: { rayColor: "#2d5fae", intensity: 0.3 },
    leak: { visible: false },
    aurora: { visible: true },
    stars: { visible: true },
    shade: { intensity: 0.6 }
  } : {
    sky: { stops: stops(["#e9f1fd", "#c4d9f7", "#9dbdee", "#7fa6e3"]) },
    rays: { rayColor: "#ffffff", intensity: 0.45 },
    leak: { visible: true },
    aurora: { visible: false },
    stars: { visible: false },
    shade: { intensity: 0 }
  };
}

function preset() {
  var dark = isDark(), l = look(dark), s = SEASONS[season()];
  function mix(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  return { components: [
    { type: "MeshGradient", id: "sky", props: mix({ count: 4, smoothness: 2.5, drift: 0.35, swirl: 0.2, speed: 0.3 }, l.sky) },
    { type: "Godrays", id: "rays", props: mix({ center: { x: 0.5, y: 0 }, density: 0.22, speed: 0.2, backgroundColor: "transparent" }, l.rays) },
    { type: "LightLeak", id: "leak", props: mix({ position: { x: 0.92, y: 0.05 }, spread: 0.6, intensity: 0.16, streaks: 0.4, colorHot: "#fff6dc", colorMid: "#ffc978", colorFringe: "#c9daf3", flicker: 0.2, speed: 0.4 }, l.leak) },
    { type: "Aurora", id: "aurora", props: mix({ colorA: "#1b4380", colorB: "#8fbaff", colorC: "#3b6fd0", intensity: 85, curtainCount: 3, speed: 1, height: 110, waviness: 55, rayDensity: 16, blendMode: "screen" }, l.aurora) },
    { type: "FloatingParticles", id: "stars", props: mix({ count: 160, particleColor: "#dfe8ff", particleSize: 0.55, softness: 0.2, speed: 0.01, angle: 90, angleVariance: 10, twinkle: 0.9, randomness: 0.05 }, l.stars) },
    { type: "FloatingParticles", id: "season", props: { count: s.count, particleColor: s.colors[dark ? 0 : 1], particleSize: s.particleSize, softness: s.softness, speed: s.speed, angle: s.angle, angleVariance: s.angleVariance, twinkle: s.twinkle, randomness: s.randomness, cursorStrength: 0.4 } },
    { type: "Vignette", id: "shade", props: mix({ color: "#02040a", radius: 0.5, falloff: 0.9 }, l.shade) }
  ] };
}

// ---------- Running the sky ----------

var lib = null, gpu = null, shader = null, shownDark = null, shownSeason = null, idleTimer = 0;

function build() {
  if (shader) { shader.destroy(); shader = null; }
  shownDark = isDark(); shownSeason = season();
  return lib.createShader(canvas, preset(), {
    gpu: gpu || undefined,
    disableTelemetry: true,
    onReady: function () { root.classList.add("sky-ready"); wake(); },
    onError: function () { root.classList.remove("sky-ready"); }
  }).then(function (s) {
    shader = s;
    sync(); // catch up if the theme changed while the sky was starting
    wake();
  });
}

// Theme switch: change the running sky. A new season (rare) rebuilds it.
function sync() {
  if (!shader) return;
  if (season() !== shownSeason) { build().catch(function () {}); return; }
  var dark = isDark();
  if (dark === shownDark) return;
  shownDark = dark;
  var l = look(dark), id;
  for (id in l) shader.update(id, l[id]);
  shader.update("season", { particleColor: SEASONS[shownSeason].colors[dark ? 0 : 1] });
  wake();
}

// Keep moving while someone is using the page; freeze (the picture stays) when they stop.
function wake() {
  if (!shader) return;
  shader.resume();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(function () { if (shader) shader.pause(); }, IDLE_MS);
}

function start() {
  import(SHADERS_URL).then(function (mod) {
    lib = mod;
    if (!lib.isWebGPUSupported()) return;
    // A low-power GPU is plenty for a background (laptops keep their big GPU asleep).
    return lib.createSharedDevice({ powerPreference: "low-power" }).then(function (shared) {
      gpu = shared;
      return build();
    }).then(function () {
      new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", sync);
      ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"].forEach(function (type) {
        window.addEventListener(type, wake, { passive: true });
      });
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) { sync(); wake(); }
      });
      setInterval(sync, 60 * 60 * 1000);
    });
  }).catch(function (err) {
    root.classList.remove("sky-ready");
    if (window.console) console.warn("Animated background unavailable:", err);
  });
}

if (canvas && navigator.gpu && !saveData && !reduceMotion && !lowMemory) {
  // Load after the countdowns are on screen, so the sky never slows them down.
  var later = function (fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 4000 });
    else setTimeout(fn, 1500);
  };
  if (document.readyState === "complete") later(start);
  else window.addEventListener("load", function () { later(start); });
}
