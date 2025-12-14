import './style.css';

// GSAP Register
gsap.registerPlugin(ScrollTrigger);

// --- CONFIG ---
const totalFrames = 370;
const introLimit = 248;
const loopDuration = 8;

// --- DOM ELEMENTS ---
const wrapper = document.getElementById("hero-wrapper");
const canvas = document.getElementById("hero-canvas");
const context = canvas.getContext("2d");
const loaderBar = document.getElementById("loader-bar");
const loaderContainer = document.getElementById("loader");

// --- PFAD LOGIK ---
const currentFrame = index => {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const paddedIndex = (index + 1).toString().padStart(4, '0');
  return `${baseUrl}assets/img/${paddedIndex}.webp`;
};

// --- STATE ---
const images = [];
const sequence = { frame: 0 };
let imagesLoaded = 0;

let idleAnimation = null;
let isLooping = false;
let restartTimer = null;
let mainScrollTrigger = null;
let loopStartLock = false;

// --- RESPONSIVE CANVAS SETUP ---
let dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;

  // 1. Fenstermaße holen
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 2. Interne Auflösung (Schärfe)
  canvas.width = vw * dpr;
  canvas.height = vh * dpr;
}

// Initialer Aufruf
resizeCanvas();

// WICHTIG: Event Listener
window.addEventListener('resize', () => {
  // Erst Größe anpassen
  resizeCanvas();
  // DANN GSAP sagen: "Berechne alles neu!"
  ScrollTrigger.refresh();
});


// --- 1. PRELOADER ---
function preloadImages() {
  for (let i = 0; i < totalFrames; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    img.onload = () => { imagesLoaded++; updateLoader(); };
    img.onerror = () => { imagesLoaded++; updateLoader(); };
    images.push(img);
  }
}

function updateLoader() {
  const percent = Math.round((imagesLoaded / totalFrames) * 100);
  if (loaderBar) gsap.set(loaderBar, { scaleX: percent / 100 });
  if (imagesLoaded === totalFrames) {
    startApp();
  }
}

// --- 2. RENDER LOOP ---
function renderFrame() {
  const f = Math.round(sequence.frame) % totalFrames;
  if (images[f] && images[f].complete && images[f].naturalWidth > 0) {
    const img = images[f];

    // Wir nutzen canvas.width (High-DPI) für die Berechnung
    const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Beste Qualität
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
    );
  }
}

// --- 3. HELPER: SYNC SCROLLBAR ---
function syncScrollToFrame() {
  if (!mainScrollTrigger) return;
  const progress = sequence.frame / (totalFrames - 1);
  const scrollPos = mainScrollTrigger.start + (mainScrollTrigger.end - mainScrollTrigger.start) * progress;
  window.scrollTo(0, scrollPos);
}

// --- 4. ANIMATION CONTROL ---
function startIdleLoop() {
  if (isLooping) return;

  let currentStartFrame = sequence.frame;
  if (currentStartFrame >= introLimit) currentStartFrame = 0;

  isLooping = true;
  loopStartLock = true;
  setTimeout(() => { loopStartLock = false; }, 200);

  const framesLeft = introLimit - currentStartFrame;
  const timeForRest = (framesLeft / introLimit) * loopDuration;

  idleAnimation = gsap.to(sequence, {
    frame: introLimit,
    duration: timeForRest,
    ease: "none",
    overwrite: true,
    onUpdate: syncScrollToFrame,
    onComplete: () => {
      idleAnimation = gsap.fromTo(sequence,
        { frame: 0 },
        {
          frame: introLimit,
          duration: loopDuration,
          ease: "none",
          repeat: -1,
          yoyo: false,
          onUpdate: syncScrollToFrame
        }
      );
    }
  });
}

function killLoop() {
  if (!isLooping || loopStartLock) return;

  isLooping = false;
  if (idleAnimation) {
    idleAnimation.kill();
    idleAnimation = null;
  }
}

function initUserListeners() {
  // Wir hören hier NICHT auf 'resize', da Resize oft fälschlicherweise Scroll-Events triggert.
  const killEvents = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'];
  killEvents.forEach(evt => {
    window.addEventListener(evt, () => {
      if (isLooping) killLoop();
    }, { passive: true });
  });
}

function initScrollLogic() {
  initUserListeners();

  mainScrollTrigger = ScrollTrigger.create({
    trigger: wrapper,
    start: "top top",
    end: "+=4000",
    pin: true,
    scrub: 0.5,
    onUpdate: (self) => {
      if (!isLooping) {
        let targetFrame = self.progress * (totalFrames - 1);
        if (targetFrame < 0) targetFrame = 0;
        if (targetFrame > totalFrames - 1) targetFrame = totalFrames - 1;

        sequence.frame = targetFrame;

        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          if (sequence.frame < introLimit - 2 && !isLooping) {
            startIdleLoop();
          }
        }, 100);
      }
    }
  });

  gsap.ticker.add(renderFrame);
}

// --- BORDER RADIUS ANIMATION ---
function initBorderRadiusAnim() {
  gsap.to(wrapper, {
    scrollTrigger: {
      trigger: "#content-section",
      start: "top 100%",
      end: "top 50%",
      scrub: true,
    },
    borderBottomLeftRadius: "60px",
    borderBottomRightRadius: "60px",
    scale: 0.9,
    transformOrigin: "center top",
    ease: "power2.inOut"
  });
}

// --- 5. START ---
function startApp() {
  gsap.to(loaderContainer, {
    autoAlpha: 0,
    duration: 0.8,
    ease: "power2.inOut",
    onComplete: () => {
      loaderContainer.style.display = "none";
      document.body.classList.remove("no-scroll");
      window.scrollTo(0, 0);
    }
  });

  initScrollLogic();
  initBorderRadiusAnim();
  ScrollTrigger.refresh();
  startIdleLoop();
}

preloadImages();
