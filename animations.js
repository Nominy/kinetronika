// Main animation script with GSAP animations and frame loading

// Cache for image preloading
const imageCache = new Map();

// Utilities for frame loading
class FrameLoader {
  constructor() {
    this.loadingIndicator = document.querySelector('loading-indicator');
  }

  // Load a single image and cache it
  loadImage(src) {
    return new Promise((resolve) => {
      if (imageCache.has(src)) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.set(src, img);
        resolve(src);
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${src}`);
        resolve(src); // Resolve anyway to not block animation
      };
      img.src = src;
    });
  }

  // Create array of frame paths
  createFramePaths(basePath, count) {
    return Array.from({ length: count }, (_, i) => 
      `${basePath}${String(i + 1).padStart(4, '0')}.jpg`
    );
  }

  // Update loading progress
  updateProgress(loadedCount, totalFrames) {
    const pct = Math.round(loadedCount / totalFrames * 100);
    if (this.loadingIndicator) {
      this.loadingIndicator.updateProgress(pct);
    }
  }

  // Preload first animation frames
  async preloadFirstAnimation(basePath, frameCount, initialFramesToLoad = 60) {
    const framePaths = this.createFramePaths(basePath, frameCount);
    let loadedCount = 0;

    // Prevent scrolling until we load enough frames
    document.body.style.overflow = 'hidden';

    // Fire all loads in parallel
    framePaths.forEach(src => {
      this.loadImage(src).then(() => {
        loadedCount++;
        this.updateProgress(loadedCount, frameCount);

        // Once we have enough frames to start, initialize animations
        if (loadedCount === initialFramesToLoad && !window.animationsInitialized) {
          initAnimations();
          window.animationsInitialized = true;
        }

        // When all frames are loaded, finish the loading process
        if (loadedCount === frameCount) {
          this.finishLoading();
        }
      });
    });
  }

  // Preload second animation in the background
  async preloadBackgroundAnimation(basePath, frameCount) {
    const framePaths = this.createFramePaths(basePath, frameCount);
    const batchSize = 20;

    for (let i = 0; i < framePaths.length; i += batchSize) {
      const end = Math.min(i + batchSize, framePaths.length);
      const loadPromises = [];

      for (let j = i; j < end; j++) {
        loadPromises.push(this.loadImage(framePaths[j]));
      }

      // Give the browser some breathing room between batches
      await Promise.all(loadPromises);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Finish the loading process
  finishLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.hide();
    }
    
    // Allow scrolling
    document.body.style.overflow = '';
    
    // Preload second animation in the background
    this.preloadBackgroundAnimation('video2/', 180);
  }
}

// Initialize GSAP animations
function initAnimations() {
  // Allow scrolling
  document.body.style.overflow = '';

  // Configure GSAP defaults for smoother pinning
  ScrollTrigger.config({
    ignoreMobileResize: true
  });

  const section1 = document.querySelector('#section1');
  const section2 = document.querySelector('#section2');
  const frame1 = document.querySelector('#section1 .frame-container img');
  const frame2 = document.querySelector('#section2 .frame-container img');

  // Apply larger font size to paragraphs with less text in section1
  gsap.set("#text1-p1", { fontSize: "2rem" });  // Main title - larger
  gsap.set("#text1-p3", { fontSize: "1.8rem" }); // Workspace specs - larger
  gsap.set("#text1-p4", { fontSize: "1.8rem" }); // Printing speed - larger
  gsap.set("#text1-p5", { fontSize: "1.7rem" }); // Temperature specs - slightly larger
  
  // Enhance section titles and markers
  gsap.set(".section-title", { fontSize: "2.2rem", fontWeight: "800" });
  gsap.set(".marker", { fontSize: "2.2rem" });

  // First animation timeline
  const obj1 = { frame: 0 };
  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: "#section1",
      start: "top top",
      end: "+=250%", // This might need adjustment if 15s feels too short/long for 250% scroll
      scrub: 0.1,
      pin: true,
      anticipatePin: 0,
      fastScrollEnd: true,
      preventOverlaps: true,
    }
  });

  // Frame animation: Play video1 frames 0-239 with pauses at keyframes
  const segmentDuration = 11.95 / 4; // Duration for 60 frames
  const pauseDuration = (15.0 - 11.95) / 3; // Maximize pause duration within 15s total

  const updateFrame1 = function () {
    const frameIndex = Math.round(obj1.frame);
    const src = `video1/${String(frameIndex + 1).padStart(4, '0')}.jpg`;
    if (imageCache.has(src)) {
      frame1.src = src;
    }
  };

  let videoTime = 0; // Tracks the current time for video segments and pauses in tl1

  // Segment 1: Animate frames 0-59 (displays 1st to 60th image)
  tl1.to(obj1, {
    frame: 59, // Target frame index 59 (60th frame)
    duration: segmentDuration,
    ease: 'none', // Linear progression for frames
    onUpdate: updateFrame1
  }, videoTime);
  videoTime += segmentDuration;

  // Pause after 60th frame is reached
  videoTime += pauseDuration;

  // Segment 2: Animate frames 59-119 (displays 60th to 120th image)
  tl1.to(obj1, {
    frame: 119, // Target frame index 119 (120th frame)
    duration: segmentDuration,
    ease: 'none',
    onUpdate: updateFrame1
  }, videoTime);
  videoTime += segmentDuration;

  // Pause after 120th frame is reached
  videoTime += pauseDuration;

  // Segment 3: Animate frames 119-179 (displays 120th to 180th image)
  tl1.to(obj1, {
    frame: 179, // Target frame index 179 (180th frame)
    duration: segmentDuration,
    ease: 'none',
    onUpdate: updateFrame1
  }, videoTime);
  videoTime += segmentDuration;

  // Pause after 180th frame is reached
  videoTime += pauseDuration;

  // Segment 4: Animate frames 179-239 (displays 180th to 240th image)
  tl1.to(obj1, {
    frame: 239, // Target frame index 239 (240th frame)
    duration: segmentDuration,
    ease: 'none',
    onUpdate: updateFrame1
  }, videoTime);
  // End of video animation. Total time taken by video with pauses:
  // 4 * segmentDuration + 3 * pauseDuration = 11.95s + 1.5s = 13.45s.
  // Text animations in tl1 are scheduled independently and will continue.

  // Position text content area 
  tl1.set("#section1 .text-content", {
    paddingTop: "0",
    marginTop: "0px", // Removed -300px as Figma coordinates are absolute
  }, 0);

  // Set initial position for all paragraphs - GSAP should not control static layout here
  tl1.set("#section1 .text-content p", {
    // position: "absolute", // CSS will handle this
    // top: "50%",    // CSS will handle this
    // transform: "translateY(-50%)", // CSS will handle initial, GSAP for animation y
    // width: "100%"  // CSS will handle this
  }, 0); // Ensure this object is not empty if all are commented, pass {} or remove if not needed.
  
  tl1.set("#section1 .text-content p:not(:first-child)", { 
    opacity: 0,
    y: -30, // Start above center
  }, 0);
  
  tl1.set("#section1 .text-content p:first-child", { 
    opacity: 1,
    y: 0, // Already visible at center
  }, 0);
  
  // P1: Visible from 0s. Stays for 1.5s. Exits by 2.2s.
  // (Frame 0 at 0s)
  tl1.to("#section1 .text-content p:nth-child(1)", { 
    opacity: 0, 
    y: 30, // Move down when exiting
    duration: 0.7,
    ease: "power1.in"
  }, 1.5); // Start exit at 1.5s, ends at 2.2s
  
  // P2: Appears at 3.0s (Frame 60). Visible 3.8s-5.3s. Exits by 6.0s.
  tl1.to("#section1 .text-content p:nth-child(2)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 3.0); 
  tl1.to("#section1 .text-content p:nth-child(2)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 3.0 + 0.8 + 1.5); // Starts exit at 5.3s, ends at 6.0s
  
  // P3: Appears at 6.0s (Frame 120). Visible 6.8s-8.3s. Exits by 9.0s.
  tl1.to("#section1 .text-content p:nth-child(3)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 6.0); 
  tl1.to("#section1 .text-content p:nth-child(3)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 6.0 + 0.8 + 1.5); // Starts exit at 8.3s, ends at 9.0s

  // P4: Appears at 9.0s (Frame 180). Visible 9.8s-11.3s. Exits by 12.0s.
  tl1.to("#section1 .text-content p:nth-child(4)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 9.0); 
  tl1.to("#section1 .text-content p:nth-child(4)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 9.0 + 0.8 + 1.5); // Starts exit at 11.3s, ends at 12.0s

  // P5: Appears at 12.0s (Frame 239 is reached at 11.95s). Visible 12.8s-14.3s. Exits by 15.0s.
  tl1.to("#section1 .text-content p:nth-child(5)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 12.0); 
  tl1.to("#section1 .text-content p:nth-child(5)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 12.0 + 0.8 + 1.5); // Starts exit at 14.3s, ends at 15.0s
  
  tl1.totalDuration(15.0); // Total duration for section 1 animations

  // Second animation timeline
  const obj2 = { frame: 0 };
  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: "#section2",
      start: "top top",
      end: "+=200%",
      scrub: 0.1,
      pin: true,
      anticipatePin: 0,
      fastScrollEnd: true,
      preventOverlaps: true,
      onEnter: () => {
        // When entering section 2, ensure we start preloading if not already
        if (!window.section2Loading) {
          new FrameLoader().preloadBackgroundAnimation('video2/', 180);
          window.section2Loading = true;
        }
      },
    }
  });

  tl2.to(obj2, {
    frame: 179,
    duration: 6.6,
    onUpdate: function () {
      const frameIndex = Math.round(obj2.frame);
      const src = `video2/${String(frameIndex + 1).padStart(4, '0')}.jpg`;

      // Try from cache first, otherwise load on demand
      if (imageCache.has(src)) {
        frame2.src = src;
      } else {
        frame2.src = src;
        new FrameLoader().loadImage(src);

        // Also try to load a few frames ahead
        const preloadIndex = frameIndex + 5;
        if (preloadIndex < 180) {
          new FrameLoader().loadImage(`video2/${String(preloadIndex + 1).padStart(4, '0')}.jpg`);
        }
      }
    }
  }, 0);

  // Position text content area for section 2
  tl2.set("#section2 .text-content", {
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: "0",
    marginTop: "0", // Remove negative margin
  }, 0);

  // Text animations for section 2 - Apple-style with vertical sliding
  // Initialize all paragraphs - position for vertical centering
  tl2.set("#section2 .text-content p", { 
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "100%",
    opacity: 0,
    y: -30, // Start above center
  }, 0);
  
  // First paragraph
  tl2.to("#section2 .text-content p:nth-child(1)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 0.5); // Initial start time
  
  tl2.to("#section2 .text-content p:nth-child(1)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 2.8); // P1 IN ends 1.3s, pause 1.5s, P1 OUT starts 2.8s
  
  // Second paragraph
  tl2.to("#section2 .text-content p:nth-child(2)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 3.6); // P1 OUT ends 3.5s, P2 IN starts 3.6s
  
  tl2.to("#section2 .text-content p:nth-child(2)", { 
    opacity: 0, 
    y: 30, // Exit downward
    duration: 0.7,
    ease: "power1.in"
  }, 5.9); // P2 IN ends 4.4s, pause 1.5s, P2 OUT starts 5.9s
  
  tl2.totalDuration(6.6); // Text ends at 6.6s

  // Handle window resize - use debounced refresh for better performance
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.refresh(true); // Force refresh of all ScrollTriggers
    }, 200);
  });
}

// Start the animation process when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const loader = new FrameLoader();
  loader.preloadFirstAnimation('video1/', 240, 60);
}); 

// Use Cases Slider Logic
function initUseCasesSlider() {
  const slidesWrapper = document.querySelector('.use-cases-slides-wrapper');
  const prevButton = document.getElementById('use-case-prev');
  const nextButton = document.getElementById('use-case-next');
  const slides = document.querySelectorAll('.use-case-slide');

  if (!slidesWrapper || !prevButton || !nextButton || slides.length === 0) {
    console.warn('Use cases slider elements not found. Slider not initialized.');
    return;
  }

  let currentSlide = 0;
  const totalSlides = slides.length;

  function updateArrows() {
    if (currentSlide === 0) {
      gsap.to(prevButton, { autoAlpha: 0, display: 'none', duration: 0.3 });
    } else {
      gsap.to(prevButton, { autoAlpha: 1, display: 'flex', duration: 0.3 });
    }

    if (currentSlide === totalSlides - 1) {
      gsap.to(nextButton, { autoAlpha: 0, display: 'none', duration: 0.3 });
    } else {
      gsap.to(nextButton, { autoAlpha: 1, display: 'flex', duration: 0.3 });
    }
  }

  function goToSlide(slideIndex) {
    gsap.to(slidesWrapper, {
      x: `${-slideIndex * 100 / totalSlides}%`,
      duration: 0.7,
      ease: 'power3.inOut'
    });
    currentSlide = slideIndex;
    updateArrows();
  }

  nextButton.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  });

  prevButton.addEventListener('click', () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  });

  // Initial setup
  updateArrows();
}

// Initialize the use cases slider when the DOM is ready
// It should be called after initAnimations or alongside it if GSAP is already loaded.
document.addEventListener('DOMContentLoaded', () => {
  // Ensure GSAP is available or wait for it
  if (window.gsap) {
    initUseCasesSlider();
  } else {
    // Fallback if GSAP isn't loaded yet, though it should be by this point via CDN
    const checkGSAP = setInterval(() => {
      if (window.gsap) {
        clearInterval(checkGSAP);
        initUseCasesSlider();
      }
    }, 100);
  }
}); 