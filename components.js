// Define custom elements for site components

// Site Header Component
class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Create link to external stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'styles.css');
    
    this.shadowRoot.innerHTML = `
      <div class="header-content">
        <a href="#top" class="logo" id="logo">
          <span class="row">
            <span class="slash">/</span><span class="brand">KINETRONIKA</span>
          </span>
          <span class="tagline">Forward to threshold</span>
        </a>
        
        <nav class="nav-links">
          <a href="#section1">Section&nbsp;1</a>
          <a href="#section2">Section&nbsp;2</a>
          <a href="#after">After</a>
        </nav>
      </div>
    `;
    
    // Add external stylesheet to shadow DOM
    this.shadowRoot.prepend(linkElem);
    
    // Set up event listeners
    const logo = this.shadowRoot.getElementById('logo');
    logo.addEventListener('click', e => {
      e.preventDefault();
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: 0, autoKill: false },
        onComplete: () => gsap.core.globals().ScrollTrigger && ScrollTrigger.refresh()
      });
    });
    
    const links = this.shadowRoot.querySelectorAll('.nav-links a');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
    
        gsap.to(window, {
          duration: 1,
          scrollTo: { y: target, autoKill: false },
          overwrite: true,
          onComplete: () => ScrollTrigger.refresh()
        });
      });
    });
    
    // Trigger logo animation after a short delay
    setTimeout(() => {
      this.shadowRoot.querySelector('.logo').classList.add('logo-loaded');
    }, 500);
  }
}

// Scroll Animation Section Component
class ScrollSection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['section-id', 'video-path', 'frame-count'];
  }
  
  connectedCallback() {
    this.render();
    this.setupAnimation();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  render() {
    const sectionId = this.getAttribute('section-id') || '';
    
    // Create link to external stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'styles.css');
    
    this.shadowRoot.innerHTML = `
      <div class="frame-container">
        <img id="frame" src="${this.getAttribute('video-path')}0001.jpg" alt="">
      </div>
      <div class="section-content">
        <div class="text-content" id="text-content">
          <slot></slot>
        </div>
      </div>
    `;
    
    // Add external stylesheet to shadow DOM
    this.shadowRoot.prepend(linkElem);
  }
  
  setupAnimation() {
    // This will be handled by the main animation script
  }
}

// Loading Indicator Component
class LoadingIndicator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    // Create link to external stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'styles.css');
    
    this.shadowRoot.innerHTML = `
      <h3>Loading First Animation</h3>
      <div class="progress-bar">
        <div class="progress" id="progress"></div>
      </div>
      <div class="loading-text" id="loading-text">0%</div>
    `;
    
    // Add external stylesheet to shadow DOM
    this.shadowRoot.prepend(linkElem);
  }
  
  updateProgress(percent) {
    this.shadowRoot.getElementById('progress').style.width = `${percent}%`;
    this.shadowRoot.getElementById('loading-text').textContent = `${percent}%`;
  }
  
  hide() {
    this.style.opacity = '0';
    setTimeout(() => {
      this.style.display = 'none';
    }, 500);
  }
}

// Register custom elements
customElements.define('site-header', SiteHeader);
customElements.define('scroll-section', ScrollSection);
customElements.define('loading-indicator', LoadingIndicator); 