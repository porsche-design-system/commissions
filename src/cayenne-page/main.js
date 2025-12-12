import './style.css';

// 1. Reset
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger);

// --- DOM ELEMENTS ---
const wrapper = document.getElementById("wrapper-animation");
const canvas = document.getElementById("hero-canvas");
const context = canvas.getContext("2d");
// const loader wurde entfernt
const navbar = document.getElementById('navbar');
const configBar = document.getElementById("config-bar");
const studioContainer = document.getElementById("studio-container");
const hotspotContainer = document.querySelector(".hotspots-container");
const toggleContainer = document.getElementById("mode-toggle");
const modalOverlay = document.getElementById("modal-overlay");
const modalCard = document.querySelector(".modal-card");
const toggleBtns = document.querySelectorAll(".toggle-btn");

// --- HOTSPOTS PARSEN ---
const hotspotElements = document.querySelectorAll('.hotspot');
const hotspotData = Array.from(hotspotElements).map((el, index) => ({
  id: index,
  element: el,
  targetFrame: parseInt(el.dataset.targetFrame, 10),
  title: el.dataset.title,
  desc: el.dataset.desc,
  image: el.dataset.image
}));

// --- CONFIG ---
const totalFrames = 370;
const introLimit = 250;
const idleTime = 100;
const loopTime = 8;

const HOTSPOT_BASE_FRAME = 290;
const MIN_DRAG_FRAME = 270;
const MAX_DRAG_FRAME = 370;
const LOOP_RANGE = MAX_DRAG_FRAME - MIN_DRAG_FRAME;

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
// --- PATH LOGIC (FINAL FIX) ---
const currentFrame = index => {
  // Vite Base URL (z.B. "/" oder "/dein-repo/")
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const paddedIndex = (index + 1).toString().padStart(4, '0');

  // WICHTIG: Kein "public" im Pfad, nur "assets/img/"
  return `${baseUrl}assets/img/${paddedIndex}.png`;
};
const images = [];
let imagesLoaded = 0;

// --- STATE ---
const sequence = { target: 0, current: 0 };
const hotspotState = { val: 0 };

let loopAnimation = null;
let scrollTimeout = null;
let isLooping = false;
let isModalMode = false;
let is360Mode = false;
let isDragging = false;
let startX = 0;
let startFrame = 0;
let currentSpotIndex = 0;

// FLAGS
let introFinished = false;
let configBarVisible = false;
let studioVisible = false;

// --- STICKY NAV ---
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > lastScrollY && window.scrollY > 50) {
    navbar.style.transform = 'translateY(-100%)';
  } else {
    navbar.style.transform = 'translateY(0)';
  }
  lastScrollY = window.scrollY;
});

// --- INTRO ANIMATION ---
function startIntro() {
  const tl = gsap.timeline();
  document.body.classList.add('no-scroll');

  gsap.set(".stack-card, #hero-card", {
    clipPath: "inset(100% 0% 0% 0%)",
    opacity: 1, y: 0, rotation: 0, scale: 0.6
  });

  tl.set("#intro-stack", { autoAlpha: 1 })
    .to("#loader-text, #loader-bar", {
      opacity: 0, duration: 0.5, ease: "power2.out"
    })
    .to(".stack-card", {
      clipPath: "inset(0% 0% 0% 0%)", scale: 1,
      duration: 1.2, stagger: 0.1, ease: "power2.out"
    })
    .to("#hero-card", {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.0,
      ease: "power3.inOut"
    }, "-=0.9")
    .to("#hero-card", {
      width: "100vw",
      height: "100vh",
      scale: 1,
      borderRadius: 0,
      borderWidth: 0,
      duration: 1.8,
      ease: "expo.inOut",
      onStart: () => {
        gsap.set(".stack-card", { opacity: 0 });
      }
    }, "<")

    // --- CLEANUP ---
    .set(wrapper, { autoAlpha: 1 })
    .add(() => {
      document.querySelectorAll('.init-hidden').forEach(el => {
        el.classList.remove('init-hidden');
      });
    })
    .to("#intro-stack", {
      autoAlpha: 0, duration: 0.6,
      onComplete: () => {
        gsap.set("#intro-stack", { display: "none" });
        gsap.set("#loader", { display: "none" });
      }
    })
    .to("#navbar", { autoAlpha: 1, y: 0, duration: 0.8 }, "<")
    .to("#ui-layer", { autoAlpha: 1, duration: 0.8 }, "<")
    .to("#config-bar", { autoAlpha: 1, duration: 0.8 }, "<+=0.1")
    .add(() => {
      introFinished = true;
      document.body.classList.remove('no-scroll');
      startIdleLoop();
    });
}

// --- LOADER & PRELOAD ---
function onImageLoaded() {
  imagesLoaded++;
  const percent = Math.round((imagesLoaded / totalFrames) * 100);
  const textEl = document.getElementById("loader-text");
  if(textEl) textEl.innerText = `${percent}%`;
  const barEl = document.getElementById("loader-bar");
  if(barEl) gsap.set(barEl, { scaleX: percent / 100 });

  if (imagesLoaded === totalFrames) {
    init();
    setTimeout(startIntro, 500);
  }
}

for (let i = 0; i < totalFrames; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  img.onload = onImageLoaded;

  // FIX: Error Handling falls Pfad falsch ist
  img.onerror = () => {
    console.error(`Bild konnte nicht geladen werden: ${img.src}`);
    onImageLoaded(); // Trotzdem weiterzählen, damit App nicht hängt
  };

  images.push(img);
}

// --- RENDER ---
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    canvas.width = entry.contentRect.width;
    canvas.height = entry.contentRect.height;
    render();
  }
});
resizeObserver.observe(wrapper);

function render() {
  sequence.current += (sequence.target - sequence.current) * 0.1;
  context.clearRect(0, 0, canvas.width, canvas.height);

  let f;
  if (is360Mode) {
    let rel = sequence.current - MIN_DRAG_FRAME;
    let wrappedRel = ((rel % LOOP_RANGE) + LOOP_RANGE) % LOOP_RANGE;
    f = MIN_DRAG_FRAME + wrappedRel;
  } else {
    f = Math.round(sequence.current) % totalFrames;
  }

  // --- BACKGROUND LOGIC ---
  if (f >= 250 && !studioVisible) {
    studioVisible = true;
    studioContainer.classList.add("is-visible");
  } else if (f < 250 && studioVisible) {
    studioVisible = false;
    studioContainer.classList.remove("is-visible");
  }

  // --- CONFIG BAR LOGIC ---
  if (introFinished && configBar) {
    const shouldShow = (f <= 250) && !isModalMode && !is360Mode;
    if (shouldShow !== configBarVisible) {
      configBarVisible = shouldShow;
      if (shouldShow) {
        gsap.to(configBar, { autoAlpha: 1, y: 0, duration: 0.5 });
      } else {
        gsap.to(configBar, { autoAlpha: 0, y: 50, duration: 0.5 });
      }
    }
  }

  f = Math.round(f);
  if (f < 0) f = 0;

  // FIX: ABSTURZ-SCHUTZ
  // Wir prüfen: Gibt es das Bild? Ist es fertig geladen? Hat es eine Breite?
  // Wenn nein, brechen wir ab, statt drawImage aufzurufen.
  if(images[f] && images[f].complete && images[f].naturalWidth > 0) {
    const img = images[f];
    const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;
    context.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  }
}
gsap.ticker.add(render);

// --- DRAG ---
function initDrag() {
  const onDown = (e) => {
    if (!is360Mode) return;
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    startFrame = sequence.target;
  };
  const onMove = (e) => {
    if (!is360Mode || !isDragging) return;
    const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = x - startX;
    const sensitivity = 5;
    let rawFrame = startFrame + (deltaX / sensitivity);
    sequence.target = rawFrame;
  };
  const onUp = () => { isDragging = false; };

  wrapper.addEventListener('mousedown', onDown);
  wrapper.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

// --- MODES ---
function setMode(mode, skipAnimation = false) {
  const activateBtn = (idx) => {
    toggleBtns.forEach(b => {
      b.classList.remove("bg-white", "text-black", "shadow-lg");
      b.classList.add("text-white", "hover:bg-white/10");
    });
    toggleBtns[idx].classList.remove("text-white", "hover:bg-white/10");
    toggleBtns[idx].classList.add("bg-white", "text-black", "shadow-lg");
  };

  if (mode === '360') {
    is360Mode = true;
    stopIdleLoop();
    activateBtn(1);
    wrapper.classList.add('is-360-mode');
    gsap.to(hotspotContainer, { autoAlpha: 0, duration: 0.3 });

  } else {
    is360Mode = false;
    activateBtn(0);
    wrapper.classList.remove('is-360-mode');

    let rel = sequence.current - MIN_DRAG_FRAME;
    let wrappedRel = ((rel % LOOP_RANGE) + LOOP_RANGE) % LOOP_RANGE;
    let realVisualFrame = MIN_DRAG_FRAME + wrappedRel;
    sequence.current = realVisualFrame;
    sequence.target = realVisualFrame;

    if (skipAnimation) {
      startIdleLoop();
      return;
    }

    gsap.to(sequence, {
      target: HOTSPOT_BASE_FRAME,
      duration: 1.0,
      ease: "power2.inOut",
      onComplete: () => {
        if (hotspotState.val > 0.01 && hotspotState.val < 0.99) {
          gsap.to(hotspotContainer, { autoAlpha: 1, duration: 0.5 });
          gsap.to(toggleContainer, { autoAlpha: 1, y: 0, duration: 0.5 });
        }
        startIdleLoop();
      }
    });
  }
}
window.setMode = setMode;

function startIdleLoop() {
  if (is360Mode) return;
  if (sequence.target > introLimit + 5) return;
  if (isLooping) return;
  if (isModalMode) return;

  isLooping = true;
  let distToEnd = (introLimit - 1) - sequence.target;
  let duration = (distToEnd / introLimit) * loopTime;

  loopAnimation = gsap.to(sequence, {
    target: introLimit,
    duration: Math.max(0.5, duration),
    ease: "none",
    onComplete: () => {
      sequence.current = 0;
      loopAnimation = gsap.fromTo(sequence, { target: 0 }, {
        target: introLimit,
        duration: loopTime,
        repeat: -1,
        ease: "none",
        onRepeat: () => { sequence.current = 0; }
      });
    }
  });
}

function stopIdleLoop() {
  if (!isLooping) return;
  isLooping = false;
  if (loopAnimation) {
    loopAnimation.kill();
    loopAnimation = null;
  }
}

// --- CLICK ---
function clickHotspot(index) {
  stopIdleLoop();
  isModalMode = true;

  gsap.to(hotspotContainer, { autoAlpha: 0, duration: 0.3 });
  gsap.to(toggleContainer, { autoAlpha: 0, y: 50, duration: 0.3 });

  if (index < 0) index = hotspotData.length - 1;
  if (index >= hotspotData.length) index = 0;
  currentSpotIndex = index;
  const data = hotspotData[index];

  gsap.to(sequence, {
    target: data.targetFrame,
    duration: 1.2,
    ease: "power3.inOut",
    onComplete: () => { openFlyout(index); }
  });
}

function openFlyout(index) {
  const data = hotspotData[index];
  if(!data) return;

  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-desc');
  const imgEl = document.getElementById('modal-img');

  if(titleEl) titleEl.innerText = data.title;
  if(descEl) descEl.innerText = data.desc;
  if(imgEl) imgEl.src = data.image;

  document.body.classList.add('no-scroll');

  gsap.to(modalOverlay, { autoAlpha: 1, duration: 0.5 });
  modalOverlay.style.pointerEvents = "auto";
  modalCard.classList.remove("translate-x-full");
  modalCard.classList.add("translate-x-0");
}

function closeModal() {
  gsap.to(modalOverlay, { autoAlpha: 0, duration: 0.5 });
  modalOverlay.style.pointerEvents = "none";
  modalCard.classList.remove("translate-x-0");
  modalCard.classList.add("translate-x-full");
  document.body.classList.remove('no-scroll');

  gsap.to(sequence, {
    target: HOTSPOT_BASE_FRAME,
    duration: 1.0,
    ease: "power3.inOut",
    onComplete: () => {
      isModalMode = false;
      if (!is360Mode && hotspotState.val > 0.01 && hotspotState.val < 0.99) {
        gsap.to(hotspotContainer, { autoAlpha: 1, duration: 0.5 });
        gsap.to(toggleContainer, { autoAlpha: 1, y: 0, duration: 0.5 });
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(startIdleLoop, idleTime);
    }
  });
}

function updateFlyoutContent(index) {
  const data = hotspotData[index];
  if(!data) return;
  gsap.to(sequence, { target: data.targetFrame, duration: 1.0, ease: "power3.out" });
  document.getElementById('modal-title').innerText = data.title;
  document.getElementById('modal-desc').innerText = data.desc;
  document.getElementById('modal-img').src = data.image;
}

window.nextSpot = () => {
  let nextIndex = (currentSpotIndex + 1) >= hotspotData.length ? 0 : currentSpotIndex + 1;
  currentSpotIndex = nextIndex;
  updateFlyoutContent(nextIndex);
};
window.prevSpot = () => {
  let prevIndex = (currentSpotIndex - 1) < 0 ? hotspotData.length - 1 : currentSpotIndex - 1;
  currentSpotIndex = prevIndex;
  updateFlyoutContent(prevIndex);
};
window.closeModal = closeModal;

// --- INIT ---
function init() {
  initDrag();

  // 1. Definiere Logic
  const checkVisibility = () => {
    const isInsideZone = hotspotState.val > 0.01 && hotspotState.val < 0.99;

    if (introFinished) {
      if (isInsideZone) {
        if (!is360Mode && !isModalMode) {
          gsap.to(hotspotContainer, { autoAlpha: 1, duration: 0.3 });
          hotspotData.forEach(h => {
            h.element.classList.remove("scale-0", "opacity-0");
            h.element.classList.add("scale-100", "opacity-100");
          });
        } else {
          gsap.to(hotspotContainer, { autoAlpha: 0, duration: 0.3 });
        }

        if (!isModalMode) {
          gsap.to(toggleContainer, { autoAlpha: 1, y: 0, duration: 0.3 });
        }
      }
      else {
        gsap.to(hotspotContainer, { autoAlpha: 0, duration: 0.3 });
        hotspotData.forEach(h => {
          h.element.classList.remove("scale-100", "opacity-100");
          h.element.classList.add("scale-0", "opacity-0");
        });

        gsap.to(toggleContainer, { autoAlpha: 0, y: 50, duration: 0.3 });

        if (is360Mode) {
          setMode('features', true);
        }
      }
    }
  };

  // 2. Timeline
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: "top top",
      end: "+=6000",
      pin: true,
      scrub: true,

      onUpdate: () => {
        if (!is360Mode && !isModalMode) {
          stopIdleLoop();
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(startIdleLoop, 100);
        }
      }
    }
  });

  tl.to(sequence, { target: introLimit, duration: 3, ease: "none" });
  tl.to(sequence, { target: 270, duration: 1, ease: "none" });
  tl.to(".info-overlay", { opacity: 1, duration: 0.5 })
    .to({}, { duration: 1 })
    .to(".info-overlay", { opacity: 0, duration: 0.5 });
  tl.to(sequence, { target: HOTSPOT_BASE_FRAME, duration: 1, ease: "none" });

  // Visibility Check
  tl.to(hotspotState, { val: 1, duration: 3, onUpdate: checkVisibility }, "-=2");

  // Outro
  gsap.to(wrapper, {
    scrollTrigger: {
      trigger: ".spacer",
      start: "top 100%",
      end: "top 0%",
      scrub: true,
      immediateRender: false
    },
    scale: 0.85,
    borderRadius: "40px",
    y: 100,
    filter: "brightness(0.6)",
    ease: "power2.out"
  });

  hotspotData.forEach((h) => {
    h.element.addEventListener("click", () => {
      clickHotspot(h.id);
    });
  });
}
