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

    const hostStyle = document.createElement('style');
    hostStyle.textContent = `
      :host {
        --header-bg: #1a1a1a;
        --header-text: #ffffff;
        --header-accent: #14d58c;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        display: block;
        z-index: 1000;
        background: var(--header-bg);
      }

      .header-content {
        background: var(--header-bg);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 28px;
      }

      .logo,
      .brand,
      .tagline,
      .nav-links a {
        color: var(--header-text);
      }

      .slash {
        color: var(--header-accent);
      }

      .nav-links a {
        text-decoration: none;
        font-weight: 700;
        padding: 5px 15px;
      }

      .nav-links {
        display: flex;
        align-items: center;
      }

      .slash,
      .brand,
      .tagline {
        opacity: 1;
        transform: none;
        transition: none;
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <div class="header-content">
        <a href="#top" class="logo" id="logo">
          <span class="row">
            <span class="slash">/</span><span class="brand">KINETRONIKA</span>
          </span>
          <span class="tagline">Forward to threshold</span>
        </a>
        
        <nav class="nav-links">
          <a href="#top">AUTOFIBER-5</a>
        </nav>
      </div>
    `;
    
    // Add external stylesheet to shadow DOM
    this.shadowRoot.prepend(linkElem);
    this.shadowRoot.appendChild(hostStyle);
    
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
    
    // Apply default styling to projected content
    const style = document.createElement('style');
    style.textContent = `
      ::slotted(p) {
        margin-bottom: 0.5rem;
      }
      
      ::slotted(.marker) {
        color: #24BA70;
        font-weight: bold;
        margin-right: 0.5rem;
      }
      
      ::slotted(.general-title),
      ::slotted(.section-title) {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        letter-spacing: 0.03em;
      }
      
      ::slotted(.feature-specs) {
        margin-bottom: 0.3rem;
      }
      
      ::slotted(.feature-specs span) {
        display: block;
        margin-bottom: 0.1rem;
      }
    `;
    this.shadowRoot.appendChild(style);
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