import './style.css';

// DO NOT USE IN PRODUCTION!
// EXAMPLE CODE FOR DEMONSTRATION PURPOSE ONLY.

const navDrilldown = document.getElementById('nav-drilldown');
const navButton = document.getElementById('nav-button');

navButton.addEventListener('click', () => {
  navDrilldown.open = true;
});

navDrilldown.addEventListener('dismiss', (e) => {
  e.target.open = false;
});

navDrilldown.addEventListener('update', (e) => {
  e.target.activeIdentifier = e.detail.activeIdentifier;
});

// Scroll-based scaling effect
// Scales based on vertical position in viewport
// IntersectionObserver is used to optimize performance by only updating when the element is in view
// requestAnimationFrame used for the scroll effects itself

// Configuration options:
// scaleFrom: starting scale when the element is at startY
// scaleTo: ending scale when the element is at endY
// startY: vertical position (as fraction of viewport height) where scaling starts
// endY: vertical position (as fraction of viewport height) where scaling ends

function setupScrollScaleForClass(className, config) {
  const elements = document.querySelectorAll(`.${className}`);

  elements.forEach((el) => {
    let active = false;

    const io = new IntersectionObserver(
      ([e]) => {
        active = e.isIntersecting;
      },
      { threshold: 0 }
    );

    io.observe(el);

    function loop() {
      if (active) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;

        const centerY = rect.top + rect.height / 2;
        const frac = centerY / vh;

        let scale;

        if (frac >= config.startY) {
          scale = config.scaleFrom;
        } else if (frac <= config.endY) {
          scale = config.scaleTo;
        } else {
          const t = (config.startY - frac) / (config.startY - config.endY);
          scale = config.scaleFrom + (config.scaleTo - config.scaleFrom) * t;
        }

        el.style.transform = `scale(${scale})`;
      }

      requestAnimationFrame(loop);
    }

    loop();
  });
}

function setupScrollFloatForClass(className, config) {
  const elements = document.querySelectorAll(`.${className}`);

  elements.forEach((el) => {
    let active = false;

    const io = new IntersectionObserver(
      ([e]) => {
        active = e.isIntersecting;
      },
      { threshold: 0 }
    );

    io.observe(el);

    function loop() {
      if (active) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;

        const centerY = rect.top + rect.height / 2;
        const frac = centerY / vh;

        let y;

        if (frac >= config.startY) {
          y = config.translateFrom;
        } else if (frac <= config.endY) {
          y = config.translateTo;
        } else {
          const t = (config.startY - frac) / (config.startY - config.endY);
          y = config.translateFrom + (config.translateTo - config.translateFrom) * t;
        }

        el.style.transform = `translate3d(0, ${y}px, 0)`;
      }

      requestAnimationFrame(loop);
    }

    loop();
  });
}

setupScrollFloatForClass('float-target-1', {
  translateFrom: 100,
  translateTo: -200,
  startY: 1.5,
  endY: -0.5,
});

setupScrollFloatForClass('float-target-2', {
  translateFrom: 30,
  translateTo: -200,
  startY: 1.0,
  endY: 0.4,
});

setupScrollScaleForClass('scale-target', {
  scaleFrom: 1.1,
  scaleTo: 1.0,
  startY: 1.0,
  endY: 0.5,
});
