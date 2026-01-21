import './style.css';

gsap.registerPlugin(ScrollTrigger);

// --- CONFIG ---
const totalFrames = 370;
const introLimit = 248;
const loopDuration = 8;

// --- DOM ELEMENTS ---
const wrapper = document.getElementById("hero-wrapper");
const proxy = document.getElementById("scroll-proxy");
const canvas = document.getElementById("hero-canvas");
const navbar = document.getElementById('navbar');
const configBar = document.getElementById("config-bar");
const loaderBar = document.getElementById("loader-bar");
const loaderContainer = document.getElementById("loader");
const hotspots = document.getElementById("hotspots");
const context = canvas.getContext("2d");

// --- OPTIMIERUNG: CANVAS SETUP ---
context.imageSmoothingEnabled = true;
context.imageSmoothingQuality = "medium"; // "medium" ist performanter für Animationen

// --- STATE ---
const images = [];
const frameBrightness = []; // NEU: Speichert Helligkeit pro Frame (Cache)
const sequence = { frame: 0 };
let imagesLoaded = 0;
let idleAnimation = null;
let isLooping = false;
let restartTimer = null;
let loopStartLock = false;
let lastScrollY = window.scrollY;

// --- RESIZE ---
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  // Performance-Cap: Max DPR 2 (Retten von Frames auf neuen iPhones)
  const targetDpr = Math.min(dpr, 2);

  canvas.width = window.innerWidth * targetDpr;
  canvas.height = window.innerHeight * targetDpr;
  context.scale(targetDpr, targetDpr);
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); ScrollTrigger.refresh(); });

// --- PATH LOGIC ---
const currentFrame = index => {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const paddedIndex = (index + 1).toString().padStart(4, '0');
  return `${baseUrl}assets/img/${paddedIndex}.webp`;
};

// --- PRELOADER & ANALYSIS (OPTIMIERT) ---
function preloadImages() {
  // Kleiner Offscreen-Canvas für einmalige Helligkeits-Analyse
  const analysisCanvas = document.createElement('canvas');
  analysisCanvas.width = 1;
  analysisCanvas.height = 1;
  const analysisCtx = analysisCanvas.getContext('2d');

  for (let i = 0; i < totalFrames; i++) {
    const img = new Image();
    img.src = currentFrame(i);

    img.onload = () => {
      images[i] = img;

      // Helligkeit SOFORT berechnen und speichern (nicht beim Scrollen!)
      analysisCtx.drawImage(img, 0, 0, 1, 1);
      const p = analysisCtx.getImageData(0, 0, 1, 1).data;
      // Luminanz Formel (Wahrgenommene Helligkeit)
      const brightness = (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
      frameBrightness[i] = brightness;

      imagesLoaded++;
      updateLoader();
    };

    img.onerror = () => {
      imagesLoaded++;
      frameBrightness[i] = 0.5; // Fallback
      updateLoader();
    };
  }
}

function updateLoader() {
  const percent = Math.round((imagesLoaded / totalFrames) * 100);
  if (loaderBar) gsap.set(loaderBar, { scaleX: percent / 100 });
  if (imagesLoaded === totalFrames) startApp();
}

// --- RENDER ENGINE ---
function renderFrame() {
  const f = Math.round(sequence.frame) % totalFrames;
  const img = images[f];

  if (img && img.complete && img.naturalWidth > 0) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Cover Logic
    const ratio = Math.max(width / img.width, height / img.height);
    const centerShift_x = (width - img.width * ratio) / 2;
    const centerShift_y = (height - img.height * ratio) / 2;

    context.clearRect(0, 0, width, height);
    context.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

    // Theme Update (Liest nur aus dem Array -> 0 Performance Kosten)
    updateThemeFromCache(f);
  }
}

// --- THEME LOGIC (OPTIMIERT) ---
function updateThemeFromCache(frameIndex) {
  if (!navbar) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const isCanvasVisible = wrapperRect.bottom > 0;

  let brightness = 0.5;

  if (isCanvasVisible) {
    // Lookup aus dem Cache
    brightness = frameBrightness[frameIndex] !== undefined ? frameBrightness[frameIndex] : 0.5;
  } else {
    // Content Bereich ist hell (#fdf6e3)
    brightness = 0.9;
  }

  const shouldBeDark = brightness > 0.5; // Helles Bild = Dark Theme (Schwarze Schrift)
  const theme = shouldBeDark ? 'light' : 'dark';

  // Klasse umschalten (nur wenn nötig)
  if (shouldBeDark && navbar.classList.contains('dark')) {
    navbar.classList.replace('dark', 'light');
    updateIcons(theme);
  } else if (!shouldBeDark && navbar.classList.contains('light')) {
    navbar.classList.replace('light', 'dark');
    updateIcons(theme);
  }
}

function updateIcons(theme) {
  const icons = navbar.querySelectorAll('p-icon, p-wordmark');
  icons.forEach(icon => {
    if (icon.theme !== undefined) {
      icon.theme = theme;
    } else {
      icon.setAttribute('theme', theme);
    }
  });
}

// --- PARALLAX TUNNEL (Vollständig wiederhergestellt) ---
function initParallaxTunnel() {
  const section = document.querySelector("#content-section");
  const cameraRig = document.querySelector("#camera-rig");
  const items = gsap.utils.toArray(".tunnel-item");

  const scrollExtension = document.createElement('div');
  scrollExtension.id = 'tunnel-scroll-extension';
  scrollExtension.style.height = '600vh';
  scrollExtension.style.width = '1px';
  scrollExtension.style.position = 'relative';
  document.body.appendChild(scrollExtension);

  const settings = {
    zSpacing: 350,
    startZ: -300,
    blurStrength: 20
  };

  const deepestZ = settings.startZ - ((items.length - 1) * settings.zSpacing);
  const endZ = 100;
  const totalMovement = Math.abs(deepestZ) + endZ + 200;

  // Tunnel Items Setup (Initial State)
  items.forEach((item, i) => {
    const img = item.querySelector("img, video");
    const startPos = settings.startZ - (i * settings.zSpacing);

    gsap.set(item, {
      z: startPos + "vh",
      opacity: 0,
      filter: `blur(${settings.blurStrength}px)`
    });
    if(img) {
      gsap.set(img, {
        scale: 1,
        transformOrigin: "center center"
      });
    }
  });

  // Tunnel Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollExtension,
      start: "top bottom",
      end: "bottom bottom",
      scrub: 1,
    }
  });

  // === PHASE 1: TEXT REVEAL ===
  tl.to(".reveal-text", {
    opacity: 1,
    duration: 1,
    stagger: 0.2
  }, 0);

  // === PHASE 2: TUNNEL ITEMS ===
  items.forEach((item, i) => {
    const img = item.querySelector("img, video");
    const startPos = settings.startZ - (i * settings.zSpacing);

    const sharpZ = -600;
    let sharpProgress = (sharpZ - startPos) / totalMovement;
    if (sharpProgress < 0.05) sharpProgress = 0.05;
    if (sharpProgress > 0.9) sharpProgress = 0.9;

    tl.to(item, {
      z: `+=${totalMovement}vh`,
      ease: "none",
      duration: 6,
      keyframes: {
        "0%": { opacity: 0, filter: `blur(${settings.blurStrength}px)` },
        [`${sharpProgress * 100}%`]: { opacity: 1, filter: "blur(0px)" },
        "100%": { opacity: 1, filter: "blur(0px)" }
      }
    }, 0);

    if (img) {
      tl.to(img, {
        scale: 1.3,
        ease: "none",
        duration: 6,
        force3D: true
      }, 0);
    }
  });

  // === PHASE 3 & 4: TEXT SPLIT + FINAL HERO ===
  gsap.set("#final-hero", {
    xPercent: -50,
    yPercent: -50,
    width: "0vw",
    height: "0vh",
    opacity: 1,
    borderRadius: "50vw"
  });

  const transitionStart = 5;
  const transitionDuration = 3;
  const transitionEase = "power4.inOut";

  tl.addLabel("transitionStart", transitionStart);

  tl.to(".split-text-up", {
    y: "-50vh",
    opacity: 0,
    ease: transitionEase,
    duration: transitionDuration
  }, "transitionStart");

  tl.to(".split-text-down", {
    y: "50vh",
    opacity: 0,
    ease: transitionEase,
    duration: transitionDuration
  }, "transitionStart");

  tl.to("#final-hero", {
    width: "100vw",
    height: "100vh",
    borderRadius: "0px",
    ease: transitionEase,
    duration: transitionDuration
  }, "transitionStart");
}

// --- LOOP & SCROLL CONTROL ---
function startIdleLoop() {
  if (isLooping) return;
  let currentStartFrame = sequence.frame;

  // Bugfix: Loop nicht starten, wenn wir schon im Tunnel/Fluid Bereich sind
  if (currentStartFrame >= introLimit - 2) return;

  if (currentStartFrame >= introLimit) currentStartFrame = 0;
  isLooping = true;
  loopStartLock = true;
  setTimeout(() => { loopStartLock = false; }, 200);

  const framesLeft = introLimit - currentStartFrame;
  const timeForRest = (framesLeft / introLimit) * loopDuration;

  idleAnimation = gsap.to(sequence, {
    frame: introLimit, duration: timeForRest, ease: "none", overwrite: true,
    onComplete: () => {
      idleAnimation = gsap.fromTo(sequence, { frame: 0 }, {
        frame: introLimit, duration: loopDuration, ease: "none", repeat: -1
      });
    }
  });
}

function killLoop() {
  if (!isLooping || loopStartLock) return;
  isLooping = false;
  if (idleAnimation) { idleAnimation.kill(); idleAnimation = null; }
}

function initUserListeners() {
  ['wheel', 'touchstart', 'touchmove'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (window.scrollY < 5) return;
      if (isLooping) killLoop();
    }, { passive: true });
  });
}

// --- HOTSPOTS & MODAL ---
const modal = document.getElementById("detail-modal");
const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalClose = document.getElementById("modal-close");
let isModalOpen = false;
let activeHotspotIndex = 0;
let savedScrollPos = 0;

function initHotspotInteractions() {
  const btns = Array.from(document.querySelectorAll('.hotspot-btn'));
  const btnPrev = document.getElementById('modal-prev');
  const btnNext = document.getElementById('modal-next');

  const switchToHotspot = (index) => {
    if (index < 0) index = btns.length - 1;
    if (index >= btns.length) index = 0;
    activeHotspotIndex = index;
    const btn = btns[index];
    const targetFrame = parseInt(btn.dataset.frame);

    gsap.to([modalTitle, modalText], {
      opacity: 0, duration: 0.2,
      onComplete: () => {
        modalTitle.innerText = btn.dataset.title;
        modalText.innerText = btn.dataset.text;
        gsap.to([modalTitle, modalText], { opacity: 1, duration: 0.3 });
      }
    });

    gsap.to(sequence, { frame: targetFrame, duration: 1.5, ease: "power2.inOut", overwrite: true });
  };

  btns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      savedScrollPos = window.scrollY;
      isModalOpen = true;
      activeHotspotIndex = index;
      document.body.classList.add('no-scroll');

      modalTitle.innerText = btn.dataset.title;
      modalText.innerText = btn.dataset.text;

      gsap.to(hotspots, { opacity: 0, duration: 0.3, pointerEvents: "none" });
      gsap.to(configBar, { autoAlpha: 0, y: 200, duration: 0.5 });
      gsap.to(sequence, { frame: btn.dataset.frame, duration: 1.5, ease: "power2.inOut" });

      modal.style.pointerEvents = "auto";
      gsap.to(modal, { opacity: 1, duration: 0.5 });
      gsap.to(modalContent, { x: "0%", duration: 0.5, ease: "power3.out", delay: 0.1 });
    });
  });

  const closeModalFunc = () => {
    if(!isModalOpen) return;
    gsap.to(modalContent, {
      x: "100%", duration: 0.4, ease: "power3.in",
      onComplete: () => {
        gsap.to(modal, { opacity: 0, duration: 0.3 });
        modal.style.pointerEvents = "none";
      }
    });

    gsap.to(sequence, {
      frame: totalFrames - 1, duration: 1.5, ease: "power2.inOut",
      onComplete: () => {
        document.body.classList.remove('no-scroll');
        if(Math.abs(window.scrollY - savedScrollPos) > 50) {
          window.scrollTo(0, savedScrollPos);
        }
        isModalOpen = false;
        gsap.to(hotspots, { opacity: 1, duration: 0.5, pointerEvents: "auto" });
        if (sequence.frame <= 250) gsap.to(configBar, { autoAlpha: 1, y: 0, duration: 0.5 });
      }
    });
  };

  btnPrev.addEventListener('click', () => switchToHotspot(activeHotspotIndex - 1));
  btnNext.addEventListener('click', () => switchToHotspot(activeHotspotIndex + 1));
  modalClose.addEventListener('click', closeModalFunc);
  modalOverlay.addEventListener('click', closeModalFunc);
}

// --- MAIN SCROLL ---
function initScrollLogic() {
  initUserListeners();
  gsap.set(configBar, { autoAlpha: 0, y: 200 });
  gsap.to(configBar, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.5, ease: "power3.out" });

  let isBarVisible = true;
  let areHotspotsVisible = false;

  ScrollTrigger.create({
    id: "main-proxy", // ID wieder hinzugefügt für Debugging
    trigger: proxy,
    start: "top top",
    end: "bottom bottom",
    scrub: 0,
    onScrubComplete: () => {
      if (sequence.frame < introLimit - 2 && !isLooping && !isModalOpen) startIdleLoop();
    },
    onUpdate: (self) => {
      if (isModalOpen) return;
      if (!isLooping) {
        let progressMath = self.progress / 0.85;
        let targetFrame = progressMath * (totalFrames - 1);
        sequence.frame = Math.min(Math.max(targetFrame, 0), totalFrames - 1);

        // Bar Logic
        const shouldBarBeVisible = sequence.frame <= 250;
        if (shouldBarBeVisible !== isBarVisible) {
          gsap.to(configBar, { autoAlpha: shouldBarBeVisible ? 1 : 0, y: shouldBarBeVisible ? 0 : 200, duration: 0.5, overwrite: true });
          isBarVisible = shouldBarBeVisible;
        }

        // Hotspots Logic
        const shouldHotspotsShow = sequence.frame >= (totalFrames - 5);
        if (shouldHotspotsShow !== areHotspotsVisible) {
          if (shouldHotspotsShow) {
            gsap.to(hotspots, { opacity: 1, duration: 0.5, overwrite: true });
            hotspots.style.pointerEvents = "auto";
          } else {
            gsap.to(hotspots, { opacity: 0, duration: 0.3, overwrite: true });
            hotspots.style.pointerEvents = "none";
          }
          areHotspotsVisible = shouldHotspotsShow;
        }

        // Loop Restart Logic
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          if (sequence.frame < introLimit - 2 && !isLooping && !isModalOpen) startIdleLoop();
        }, 200);
      }
    }
  });

  gsap.ticker.add(renderFrame);
  initHotspotInteractions();
}

// --- FLUID TRANSITION (Vollständig wiederhergestellt) ---
function initFluidTransition() {
  const overlay = document.createElement('div');
  overlay.id = 'transition-overlay';
  overlay.className = 'fixed inset-0 z-[25] pointer-events-none bg-gradient-to-b from-transparent to-black/40';
  document.body.appendChild(overlay);
  gsap.set(overlay, { opacity: 0 });

  const contentSection = document.getElementById('content-section');
  const cameraRig = document.getElementById('camera-rig');

  gsap.set(contentSection, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100vh',
    zIndex: 10,
    overflow: 'hidden'
  });

  gsap.set(cameraRig, {
    scale: 0.95
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: proxy,
      start: "bottom-=500vh bottom",
      end: "bottom bottom",
      scrub: 0.8,
    }
  });

  tl.to(overlay, { opacity: 1, duration: 1 }, 0);
  tl.to(wrapper, { scale: 0.92, ease: "power1.out", duration: 1.5 }, 0);
  tl.to(cameraRig, { scale: 1, ease: "power2.out", duration: 1.5 }, 0);

  tl.to(wrapper, {
    scale: 0.82,
    borderBottomLeftRadius: "80px",
    borderBottomRightRadius: "80px",
    ease: "power2.out",
    duration: 2
  }, 1.5);

  tl.to({}, { duration: 0.8 }, 3.5);

  tl.to(wrapper, {
    yPercent: -100,
    ease: "expo.in",
    duration: 1.5
  }, 4.3);

  tl.to(overlay, { opacity: 0, duration: 1 }, 5.0);
}

// --- APP START ---
function startApp() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

  initScrollLogic();
  initFluidTransition();
  initParallaxTunnel();

  // Theme Initial prüfen
  updateThemeFromCache(0);

  ScrollTrigger.refresh();

  if (window.scrollY < 100) {
    startIdleLoop();
  } else {
    isLooping = false;
    // Frame grob setzen falls Reload weit unten war
    let progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if(progress > 0.1) sequence.frame = totalFrames - 1;
  }

  gsap.to(loaderContainer, {
    autoAlpha: 0, duration: 0.8, ease: "power2.inOut",
    onComplete: () => {
      loaderContainer.style.display = "none";
      document.body.classList.remove("no-scroll");
    }
  });

  // Sticky Navbar Logic
  window.addEventListener('scroll', () => {
    if (!navbar || isModalOpen) return;
    if (window.scrollY > lastScrollY && window.scrollY > 50) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = window.scrollY;
  });
}

// Start
preloadImages();
