const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const root = document.documentElement;

/* ---------- Theme ---------- */
document.querySelector(".theme").addEventListener("click", () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
});

/* ---------- Scroll progress, sticky nav, active link ---------- */
const progress = document.querySelector(".progress");
const nav = document.querySelector(".nav");
const navLinks = [...document.querySelectorAll(".nav nav a")];
const timeline = document.querySelector(".timeline");
const timelineItems = [...timeline.children];

function onScroll() {
  const max = root.scrollHeight - innerHeight;
  progress.style.setProperty("--p", max > 0 ? scrollY / max : 0);
  nav.classList.toggle("scrolled", scrollY > 8);

  let current = null;
  for (const a of navLinks) {
    const section = document.querySelector(a.getAttribute("href"));
    if (section && section.getBoundingClientRect().top < innerHeight * 0.4) current = a;
  }
  navLinks.forEach((a) => a.classList.toggle("active", a === current));

  // Timeline line fills as you scroll through it
  if (timeline.offsetParent) {
    const r = timeline.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    timeline.style.setProperty("--tl", t);
    const line = r.top + r.height * t;
    timelineItems.forEach((li) => li.classList.toggle("lit", li.getBoundingClientRect().top + 8 <= line));
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
document.querySelector(".release").addEventListener("toggle", onScroll);
onScroll();

/* ---------- Reveal on scroll (with sibling stagger) ---------- */
const revealer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
    el.classList.add("in");
    revealer.unobserve(el);
  }
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

/* ---------- Rotating word in the hero ---------- */
const word = document.querySelector(".rot-word");
const words = ["REST APIs", "authentication", "role-based access", "database design", "real-time features", "Docker deployments"];
if (!reduceMotion) {
  let i = 0;
  setInterval(() => {
    word.classList.add("out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      word.textContent = words[i];
      word.classList.remove("out");
    }, 350);
  }, 2400);
}

/* ---------- Request-path animation + log ---------- */
const nodes = [...document.querySelectorAll(".flow .node")];
const wires = [...document.querySelectorAll(".flow .wire")];
const logEl = document.querySelector(".log code");
const STEP = 3500 / 5; // packet cycle split across 4 wires + the final node
wires.forEach((w, i) => w.style.setProperty("--wd", `${(i * STEP) / 1000}s`));

const steps = [
  ['<span class="k">cms</span>   PUT /api/menu-items/14', '<span class="dim">editor changes a dish price</span>'],
  ['<span class="k">api</span>   role check · zod schema', '<span class="ok">✓ hy · ru · en validated</span>'],
  ['<span class="k">orm</span>   prisma.$transaction()', '<span class="ok">✓ item + audit entry</span>'],
  ['<span class="k">db</span>    COMMIT', '<span class="ok">✓ 1 row updated</span>'],
  ['<span class="k">ssr</span>   GET /hy/menu', '<span class="ok">✓ new price is live</span>'],
];
const lines = [];
function pushLine(html) {
  lines.push(html);
  if (lines.length > 5) lines.shift();
  logEl.innerHTML = lines.join("\n");
}
if (reduceMotion) {
  logEl.innerHTML = steps.map((s) => `${s[0]}  ${s[1]}`).join("\n");
} else {
  let s = 0;
  const tick = () => {
    nodes.forEach((n, i) => n.classList.toggle("hot", i === s));
    pushLine(`${steps[s][0]}  ${steps[s][1]}`);
    s = (s + 1) % steps.length;
  };
  tick();
  setInterval(tick, STEP);
}

/* ---------- Project screenshots: tabs, autoplay, tilt, spotlight ---------- */
const showcase = document.querySelector(".showcase");
const tabs = [...showcase.querySelectorAll(".tabs button")];
const shots = [...showcase.querySelectorAll(".screens img")];
const CYCLE = 5000;
showcase.style.setProperty("--cycle", `${CYCLE}ms`);
let shot = 0;
let autoplay = null;

function show(n) {
  shot = n;
  tabs.forEach((t, i) => t.setAttribute("aria-selected", String(i === n)));
  shots.forEach((img, i) => img.classList.toggle("is-on", i === n));
}
tabs.forEach((t, i) => t.addEventListener("click", () => {
  clearInterval(autoplay);
  showcase.classList.add("paused");
  show(i);
}));
if (!reduceMotion) {
  autoplay = setInterval(() => show((shot + 1) % shots.length), CYCLE);
} else {
  showcase.classList.add("paused");
}

if (finePointer && !reduceMotion) {
  const browser = showcase.querySelector(".browser");
  showcase.addEventListener("pointermove", (e) => {
    const r = showcase.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    showcase.style.setProperty("--sx", `${x * 100}%`);
    showcase.style.setProperty("--sy", `${y * 100}%`);
    browser.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
    browser.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
  });
  showcase.addEventListener("pointerleave", () => {
    browser.style.removeProperty("--ry");
    browser.style.removeProperty("--rx");
  });
}

/* ---------- Count-up stats ---------- */
const counter = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    counter.unobserve(el);
    if (reduceMotion) continue;
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const run = (now) => {
      const p = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    });
  });
}

/* ---------- Placeholder links: don't jump to the top ---------- */
document.querySelectorAll('a[data-placeholder][href="#"]').forEach((a) => {
  a.addEventListener("click", (e) => e.preventDefault());
});
