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

  // First animation timeline
  const obj1 = { frame: 0 };
  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: "#section1",
      start: "top top",
      end: "+=250%",
      scrub: 0.5, // Smoother scrubbing
      pin: true,
      anticipatePin: 0, // Disable anticipatePin to prevent jiggling
      fastScrollEnd: true, // Improve performance
      preventOverlaps: true, // Help prevent jiggling between ScrollTriggers
      onUpdate: (self) => {
        // Smooth progress to prevent jiggling at key points
        if (Math.abs(self.getVelocity()) > 0) {
          // Only update when actually scrolling
          const progress = self.progress;
          // Use rounded progress to prevent jiggling at certain decimal points
          self.scroll(Math.round(self.start + (self.end - self.start) * progress));
        }
      }
    }
  });

  // Frame animations
  tl1.to(obj1, {
    frame: 59,
    duration: 3,
    ease: "none",
    onUpdate: function () {
      const frameIndex = Math.round(obj1.frame);
      const src = `video1/${String(frameIndex + 1).padStart(4, '0')}.jpg`;
      if (imageCache.has(src)) {
        frame1.src = src;
      }
    }
  }, 0);

  tl1.to(obj1, {
    frame: 239,
    duration: 4,
    ease: "none",
    onUpdate: function () {
      const frameIndex = Math.round(obj1.frame);
      const src = `video1/${String(frameIndex + 1).padStart(4, '0')}.jpg`;
      if (imageCache.has(src)) {
        frame1.src = src;
      }
    }
  }, 6);

  // Text animations for section 1 - Apple-style with vertical sliding
  // Set initial position for all paragraphs - off screen at the top
  tl1.set("#section1 .text-content p", { 
    opacity: 0,
    y: -70, // Start above the center
  }, 0);
  
  // First paragraph
  tl1.to("#section1 .text-content p:nth-child(1)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 0.5);
  
  tl1.to("#section1 .text-content p:nth-child(1)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 2.5);
  
  // Second paragraph
  tl1.to("#section1 .text-content p:nth-child(2)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 3.0);
  
  tl1.to("#section1 .text-content p:nth-child(2)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 5.0);
  
  // Third paragraph
  tl1.to("#section1 .text-content p:nth-child(3)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 5.5);
  
  tl1.to("#section1 .text-content p:nth-child(3)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 7.5);
  
  // Fourth paragraph
  tl1.to("#section1 .text-content p:nth-child(4)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 8.0);
  
  tl1.to("#section1 .text-content p:nth-child(4)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 9.3);
  
  tl1.totalDuration(10);

  // Second animation timeline
  const obj2 = { frame: 0 };
  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: "#section2",
      start: "top top",
      end: "+=200%",
      scrub: 0.5, // Smoother scrubbing
      pin: true,
      anticipatePin: 0, // Disable anticipatePin to prevent jiggling
      fastScrollEnd: true, // Improve performance
      preventOverlaps: true, // Help prevent jiggling between ScrollTriggers
      onEnter: () => {
        // When entering section 2, ensure we start preloading if not already
        if (!window.section2Loading) {
          new FrameLoader().preloadBackgroundAnimation('video2/', 180);
          window.section2Loading = true;
        }
      },
      onUpdate: (self) => {
        // Smooth progress to prevent jiggling at key points
        if (Math.abs(self.getVelocity()) > 0) {
          // Only update when actually scrolling
          const progress = self.progress;
          // Use rounded progress to prevent jiggling at certain decimal points
          self.scroll(Math.round(self.start + (self.end - self.start) * progress));
        }
      }
    }
  });

  tl2.to(obj2, {
    frame: 179,
    duration: 5,
    ease: "none",
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

  // Text animations for section 2 - Apple-style with vertical sliding
  // Initialize all paragraphs - off screen at the top
  tl2.set("#section2 .text-content p", { 
    opacity: 0,
    y: -70, // Start above the center
  }, 0);
  
  // First paragraph
  tl2.to("#section2 .text-content p:nth-child(1)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 0.5);
  
  tl2.to("#section2 .text-content p:nth-child(1)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 2.5);
  
  // Second paragraph
  tl2.to("#section2 .text-content p:nth-child(2)", { 
    opacity: 1, 
    y: 0, // Center position
    duration: 0.8,
    ease: "power2.out"
  }, 3.0);
  
  tl2.to("#section2 .text-content p:nth-child(2)", { 
    opacity: 0, 
    y: 70, // Exit below the center
    duration: 0.7,
    ease: "power1.in"
  }, 4.3);
  
  tl2.totalDuration(5);

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