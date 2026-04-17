/* ================================================================
   District Kart Wireframe — App Logic
   Page navigation, dynamic content generation, chart rendering,
   Login/Registration system with role-based access
   ================================================================ */

/* ---------- SUPABASE INITIALIZATION ---------- */
const SUPABASE_URL = 'https://vqjljsactdfykzfksokp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamxqc2FjdGRmeWt6Zmtzb2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzEwODgsImV4cCI6MjA5MTU0NzA4OH0.RA7HCuiHZ49cuPswy-v8DcUufN6qKxSzIjmvwArNRYY';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
  initPageNavigation();
  initSlideshow();
  initTrendingSlider();
  initLocationFilter();
  initShopAllTabs();
  initCategoryShowcase();
  generateShopGrid();
  generateProductGrid();
  generateCharts();
  initFilterInteractions();
  initScrollAnimations();
  initLoginSystem();
  initRegisterSystem();
});

/* ---------- PAGE NAVIGATION (Event Delegation) ---------- */
function initPageNavigation() {
  window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');

    // Update page nav buttons
    document.querySelectorAll('.page-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === pageId);
    });

    // Update navbar links
    document.querySelectorAll('.nav-links a').forEach(l => {
      l.classList.toggle('active', l.dataset.page === pageId);
    });

    // Show/hide header elements depending on page
    const header = document.getElementById('navbar');
    const slideshow = document.getElementById('heroSlideshow');
    const catStrip = document.getElementById('categoryStrip');

    if (pageId === 'login' || pageId === 'register') {
      if (header) header.style.display = 'none';
      if (slideshow) slideshow.style.display = 'none';
    } else {
      if (header) header.style.display = '';
      if (slideshow) slideshow.style.display = pageId === 'home' ? '' : 'none';
      
      // Hide Category Strip and Main Nav Categories on Vendor Profile, Admin and Dashboard pages
      const hideOn = ['shop-detail', 'vendor', 'admin', 'dashboard'];
      const shouldHide = hideOn.includes(pageId);
      
      if (catStrip) {
        catStrip.style.display = shouldHide ? 'none' : 'block';
      }
      
      const navMain = document.querySelector('.header-nav-main');
      if (navMain) {
        navMain.style.display = shouldHide ? 'none' : 'flex';
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mobile Toggle Handler
  const mobileToggle = document.getElementById('mobileToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      showPage('mobile');
    });
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-page]');
    if (trigger) {
      e.preventDefault();
      showPage(trigger.dataset.page);
    }
  });

  // Handle Main Nav Category Clicks
  document.addEventListener('click', e => {
    const catLink = e.target.closest('.nav-link-cat');
    if (catLink) {
      e.preventDefault();
      const cat = catLink.dataset.cat;
      showPage('home');
      setTimeout(() => {
        if (window.updateCategoryShowcase) window.updateCategoryShowcase(cat);
        const el = document.getElementById('sample-showcase');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update header strip active state if it's visible
        const catItems = document.querySelectorAll('.cat-item');
        catItems.forEach(i => i.classList.toggle('active', i.dataset.cat === cat));
      }, 100);
    }
  });

  // UTILITY BUTTON HANDLERS — interactive feedback for buttons without navigation
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn || btn.dataset.page || btn.type === 'submit') return;
    
    const text = btn.textContent.trim();
    
    // Skip buttons that already have specific handlers
    if (btn.id === 'fillDemoBtn' || btn.closest('#loginRoleTabs') || btn.closest('#registerRoleTabs') || btn.closest('#shopallTabs')) return;

    // Handle specific button actions with visual feedback
    const actionMap = {
      'Export': '✓ Exported!',
      'Generate Report': '✓ Report Generated!',
      '+ Add Product': '✓ Opening Editor...',
      '+ Add User': '✓ Form Opening...',
      'Apply Filters': '✓ Filters Applied!',
      'Send Message': '✓ Message Sent!',
      'Contact': '✓ Contact Info Copied!',
      'Follow': '✓ Following!',
      'Add to Cart': '✓ Added!',
    };

    // Check for matching action
    for (const [label, feedback] of Object.entries(actionMap)) {
      if (text.includes(label)) {
        const origText = btn.textContent;
        const origBg = btn.style.background;
        btn.textContent = feedback;
        btn.style.background = '#22C55E';
        btn.style.color = '#fff';
        btn.style.pointerEvents = 'none';
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.background = origBg;
          btn.style.color = '';
          btn.style.pointerEvents = '';
        }, 1200);
        return;
      }
    }

    // Generic "View All →" and similar navigation-style buttons
    if (text.includes('View All') || text.includes('View Report') || text.includes('View Shop')) {
      const origText = btn.textContent;
      btn.textContent = '✓ Loading...';
      btn.style.opacity = '0.7';
      setTimeout(() => {
        btn.textContent = origText;
        btn.style.opacity = '';
        // If it has data-page it will be handled by delegation above
        // Otherwise just give feedback
      }, 800);
    }
  });
}

/* ---------- DASHBOARD SIDEBAR NAVIGATION ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Make sidebar nav items interactive (active state toggle)
  document.addEventListener('click', e => {
    const navItem = e.target.closest('.dash-nav-item');
    if (!navItem) return;
    
    // Find parent sidebar
    const sidebar = navItem.closest('.dash-sidebar');
    if (!sidebar) return;
    
    // Clear all active states in this sidebar
    sidebar.querySelectorAll('.dash-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Set clicked item as active
    navItem.classList.add('active');
    
    // Visual feedback
    navItem.style.transform = 'scale(0.97)';
    setTimeout(() => { navItem.style.transform = ''; }, 150);
  });

  // Make vendor "View Shop →" buttons work (trending slider cards)
  document.addEventListener('click', e => {
    const shopBtn = e.target.closest('.view-shop-btn');
    if (shopBtn && shopBtn.dataset.page) {
      e.preventDefault();
      showPage(shopBtn.dataset.page);
    }
  });

  // "Back to Home" / logout from dashboard sidebar headers
  document.addEventListener('click', e => {
    const sidebarHeader = e.target.closest('.dash-sidebar-header');
    if (sidebarHeader) {
      // Double click to go home (single click just selects)
      if (sidebarHeader._clickTimer) {
        clearTimeout(sidebarHeader._clickTimer);
        sidebarHeader._clickTimer = null;
        showPage('home');
      } else {
        sidebarHeader._clickTimer = setTimeout(() => {
          sidebarHeader._clickTimer = null;
        }, 300);
      }
    }
  });
});

/* ---------- LOGIN SYSTEM ---------- */
function initLoginSystem() {
  const tabs = document.querySelectorAll('.login-role-tab');
  if (!tabs.length) return;

  let currentRole = 'user';

  const roleConfig = {
    user:   { icon: '◉', label: 'User Account',   color: '#22C55E', btnLabel: 'Sign In as User',   placeholder: 'Enter user email',   dashboard: 'home' },
    vendor: { icon: '◆', label: 'Vendor Account',  color: '#F59E0B', btnLabel: 'Sign In as Vendor',  placeholder: 'Enter vendor email', dashboard: 'vendor' },
    admin:  { icon: '○', label: 'Admin Account',   color: '#EF4444', btnLabel: 'Sign In as Admin',   placeholder: 'Enter admin email',  dashboard: 'admin' }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentRole = tab.dataset.role;

      // Update tab styles
      tabs.forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'var(--gray-500)';
      });
      tab.style.background = 'var(--gray-900)';
      tab.style.color = '#fff';

      // Update role badge
      const cfg = roleConfig[currentRole];
      const badge = document.getElementById('loginRoleBadge');
      if (badge) {
        badge.innerHTML = `<span style="font-size: 13px; font-weight: 700; color: ${cfg.color};">${cfg.icon} ${cfg.label}</span>`;
      }

      // Update button text
      const btn = document.getElementById('loginSubmitBtn');
      if (btn) btn.textContent = cfg.btnLabel;

      // Update email placeholder
      const emailInput = document.getElementById('loginEmail');
      if (emailInput) emailInput.placeholder = cfg.placeholder;

      // Clear fields
      if (emailInput) emailInput.value = '';
      const passInput = document.getElementById('loginPassword');
      if (passInput) passInput.value = '';
    });
  });

  // Store role for global access
  window._loginCurrentRole = () => currentRole;
}

/* ---------- DEMO CREDENTIALS ---------- */
window.fillDemoCredentials = function() {
  const role = window._loginCurrentRole ? window._loginCurrentRole() : 'user';
  const demos = {
    user:   { email: 'ravi@email.com',     password: 'user123'   },
    vendor: { email: 'vendor1@email.com',  password: 'vendor123' },
    admin:  { email: 'admin@email.com',    password: 'admin123'  }
  };

  const cred = demos[role] || demos.user;
  const emailEl = document.getElementById('loginEmail');
  const passEl  = document.getElementById('loginPassword');
  if (emailEl) emailEl.value = cred.email;
  if (passEl)  passEl.value = cred.password;

  // Flash the button
  const btn = document.getElementById('fillDemoBtn');
  if (btn) {
    btn.style.background = 'var(--gray-50)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    setTimeout(() => {
      btn.style.background = '#fff';
      btn.style.borderColor = 'var(--gray-150)';
      btn.style.color = 'var(--gray-600)';
    }, 600);
  }
}

/* ---------- LOGIN HANDLER ---------- */
window.handleLogin = function(e) {
  e.preventDefault();
  const role = window._loginCurrentRole ? window._loginCurrentRole() : 'user';
  const dashboardMap = { user: 'home', vendor: 'vendor', admin: 'admin' };
  const target = dashboardMap[role] || 'home';

  // Show success flash
  const btn = document.getElementById('loginSubmitBtn');
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = '✓ Authenticated!';
    btn.style.background = '#22C55E';
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.background = '';
      showPage(target);
    }, 800);
  } else {
    showPage(target);
  }
}

/* ---------- REGISTER SYSTEM ---------- */
function initRegisterSystem() {
  const tabs = document.querySelectorAll('.register-role-tab');
  if (!tabs.length) return;

  let currentRegRole = 'user';

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentRegRole = tab.dataset.role;

      // Update tab styles
      tabs.forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'var(--gray-500)';
      });
      tab.style.background = 'var(--gray-900)';
      tab.style.color = '#fff';

      // Show/hide vendor shop name field
      const vendorField = document.getElementById('vendorShopField');
      if (vendorField) {
        vendorField.style.display = currentRegRole === 'vendor' ? 'flex' : 'none';
      }

      // Update submit button
      const btn = document.getElementById('registerSubmitBtn');
      if (btn) {
        btn.textContent = currentRegRole === 'vendor' ? 'Create Vendor Account' : 'Create User Account';
      }
    });
  });

  window._registerCurrentRole = () => currentRegRole;
}

/* ---------- REGISTER HANDLER ---------- */
window.handleRegister = function(e) {
  e.preventDefault();
  const btn = document.getElementById('registerSubmitBtn');
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = '✓ Account Created!';
    btn.style.background = '#22C55E';
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.background = '';
      showPage('login');
    }, 1000);
  } else {
    showPage('login');
  }
}

/* ---------- HERO BANNER SLIDESHOW ---------- */
function initSlideshow() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  const wrapper = document.getElementById('heroSlideshow');

  if (!slides.length) return;

  let current = 0;
  let autoplayInterval;
  const INTERVAL = 3000; // 3 seconds

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    autoplayInterval = setInterval(next, INTERVAL);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Arrow controls
  if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); prev(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); next(); startAutoplay(); });

  // Dot controls
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goTo(parseInt(dot.dataset.index));
      startAutoplay();
    });
  });

  // Pause on hover
  if (wrapper) {
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
  }

  // Start autoplay
  startAutoplay();
}

/* ---------- SHOP GRID (Marketplace Page) ---------- */
function generateShopGrid() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  const shops = [
    { name: 'DesignCraft Studio', initials: 'D', cat: 'Design', rating: '4.9', stars: '★★★★★', desc: 'Premium UI kits, design systems, and digital assets for modern product teams.' },
    { name: 'CodeForge Labs', initials: 'C', cat: 'Development', rating: '4.6', stars: '★★★★☆', desc: 'Full-stack templates, SaaS boilerplates, and developer tools built for speed.' },
    { name: 'Artisan Fonts Co.', initials: 'A', cat: 'Typography', rating: '5.0', stars: '★★★★★', desc: 'Curated collection of handcrafted typefaces for branding and editorial design.' },
    { name: 'PixelMotion 3D', initials: 'P', cat: '3D Assets', rating: '4.5', stars: '★★★★☆', desc: 'High-quality 3D models, textures, and motion graphics for professionals.' },
    { name: 'SoundWave Audio', initials: 'S', cat: 'Audio', rating: '4.8', stars: '★★★★★', desc: 'Royalty-free music, sound effects, and audio tools for content creators.' },
    { name: 'WriterFlow HQ', initials: 'W', cat: 'Writing', rating: '4.7', stars: '★★★★★', desc: 'Writing templates, editorial tools, and content frameworks for pros.' },
    { name: 'LensCraft Pro', initials: 'L', cat: 'Photography', rating: '4.7', stars: '★★★★★', desc: 'Lightroom presets, Photoshop actions, and photography guides for creators.' },
    { name: 'MotionLab Studio', initials: 'M', cat: 'Video', rating: '4.4', stars: '★★★★☆', desc: 'After Effects templates, motion graphics, and video editing resources.' },
    { name: 'DataViz Toolkit', initials: 'D', cat: 'Data', rating: '4.3', stars: '★★★★☆', desc: 'Charts, dashboards, and data visualization templates for analysts.' },
    { name: 'BrandBox Agency', initials: 'B', cat: 'Branding', rating: '4.8', stars: '★★★★★', desc: 'Logo templates, brand identity kits, and presentation decks.' },
    { name: 'NoCodeShip', initials: 'N', cat: 'No-Code', rating: '4.6', stars: '★★★★☆', desc: 'Webflow templates, Notion systems, and no-code automation tools.' },
    { name: 'EduCreate Hub', initials: 'E', cat: 'Education', rating: '4.9', stars: '★★★★★', desc: 'Course templates, LMS themes, and educational content frameworks.' },
  ];

  const statuses = ['Active', 'Active', 'Active', 'Active', 'Trending', 'Active', 'New', 'Active', 'Active', 'Active', 'New', 'Active'];

  grid.innerHTML = shops.map((shop, i) => `
    <div class="card">
      <div class="shop-card-img">
        <span>Shop Banner</span>
        <div class="shop-avatar">${shop.initials}</div>
      </div>
      <div class="shop-card-body">
        <h4 class="text-h4">${shop.name}</h4>
        <div class="shop-meta">
          <span class="stars">${shop.stars}</span>
          <span>${shop.rating}</span>
          <span>·</span>
          <span>${shop.cat}</span>
        </div>
        <p>${shop.desc}</p>
      </div>
      <div class="shop-card-footer">
        <span class="badge ${statuses[i] === 'Trending' ? 'badge-accent' : statuses[i] === 'New' ? 'badge-warning' : 'badge-success'}">
          ${statuses[i] === 'Trending' ? '🔥' : statuses[i] === 'New' ? '✨' : '●'} ${statuses[i]}
        </span>
        <button class="btn btn-sm btn-secondary" data-page="shop-detail">View Shop →</button>
      </div>
    </div>
  `).join('');
  // No manual rebinding needed — event delegation handles all [data-page] clicks
}

/* ---------- PRODUCT GRID (Shop Detail Page) ---------- */
function generateProductGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const products = [
    { name: 'Enterprise UI Kit', price: '$49', old: '$79', tag: 'Best Seller' },
    { name: 'Design System Pro', price: '$39', old: '', tag: '' },
    { name: 'Landing Page Templates', price: '$29', old: '$49', tag: 'Sale' },
    { name: 'Icon Pack Bundle', price: '$19', old: '', tag: '' },
    { name: 'Dashboard Components', price: '$59', old: '$89', tag: 'Popular' },
    { name: 'Mobile App Kit', price: '$44', old: '', tag: '' },
    { name: 'E-commerce Theme', price: '$34', old: '$54', tag: '' },
    { name: 'Presentation Deck', price: '$24', old: '', tag: 'New' },
  ];

  grid.innerHTML = products.map(p => `
    <div class="card product-card">
      <div class="product-img">Product Preview</div>
      <div class="card-body" style="padding:16px;">
        <h4 style="font-size:15px; margin-bottom:4px;">${p.name}</h4>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span class="price" style="font-size:16px; font-weight:700; color:var(--accent);">${p.price}</span>
          ${p.old ? `<span style="font-size:13px; color:var(--text-tertiary); text-decoration:line-through;">${p.old}</span>` : ''}
          ${p.tag ? `<span class="badge ${p.tag === 'Sale' ? 'badge-danger' : p.tag === 'New' ? 'badge-accent' : 'badge-success'}" style="margin-left:auto;font-size:10px;">${p.tag}</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span class="stars" style="font-size:12px;">★★★★★</span>
          <button class="btn btn-sm btn-primary" style="font-size:12px; padding:6px 14px;">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ---------- CHART GENERATION ---------- */
function generateCharts() {
  generateBarChart('revenueChart', [40, 65, 55, 80, 72, 90, 85, 95, 70, 88, 92, 78], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  generateBarChart('trafficChart', [60, 45, 80, 35, 50], ['Direct', 'Social', 'Organic', 'Referral', 'Email'], true);
  generateBarChart('adminChart', [30, 42, 55, 48, 62, 75, 68, 82, 90, 85, 95, 88], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
}

function generateBarChart(containerId, data, labels, colorful = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const max = Math.max(...data);
  const colors = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];

  container.innerHTML = data.map((val, i) => {
    const height = (val / max) * 180;
    const color = colorful ? colors[i % colors.length] : 'var(--gray-300)';
    return `
      <div class="chart-bar" style="height:${height}px; background:${color};">
        <span class="chart-bar-label">${labels[i]}</span>
      </div>
    `;
  }).join('');
}

/* ---------- FILTER INTERACTIONS ---------- */
function initFilterInteractions() {
  document.querySelectorAll('.filter-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('active');
    });
  });

  // Shop detail nav tabs
  document.querySelectorAll('.shop-detail-nav a').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.shop-detail-nav a').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

/* ---------- SCROLL ANIMATIONS ---------- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.card, .category-card, .step-card, .testimonial-card, .stat-card, .product-card-v2').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

/* ---------- CUMULATIVE VENDOR FILTERING ---------- */
function applyVendorFilters() {
  const loc = document.getElementById('locationSelect')?.value || 'all';
  const activeTab = document.querySelector('#shopallTabs .shopall-tab.active');
  const cat = activeTab ? activeTab.dataset.cat : 'all';
  const grid = document.getElementById('shopAllGrid');
  const trendingGrid = document.getElementById('vendorShopGrid');

  // Filter main directory
  if (grid) {
    grid.querySelectorAll('.vendor-showcase-card').forEach(card => {
      const cardLoc = card.dataset.location;
      const cardCat = card.dataset.cat;
      const locMatch = (loc === 'all' || cardLoc === loc);
      const catMatch = (cat === 'all' || cardCat === cat);

      if (locMatch && catMatch) {
        card.classList.remove('hidden');
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.classList.add('hidden');
      }
    });
  }

  // Filter trending slider (only by location, usually)
  if (trendingGrid) {
    trendingGrid.querySelectorAll('.vendor-showcase-card').forEach(card => {
      if (loc === 'all' || card.dataset.location === loc) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }
}

/* ---------- LOCATION FILTER ---------- */
function initLocationFilter() {
  const locationSelect = document.getElementById('locationSelect');
  if (!locationSelect) return;

  locationSelect.addEventListener('change', () => {
    applyVendorFilters();
  });
}

/* ---------- SHOP ALL — CATEGORY TABS ---------- */
function initShopAllTabs() {
  const tabs = document.querySelectorAll('#shopallTabs .shopall-tab');
  if (tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyVendorFilters();
    });
  });
}

/* ---------- CATEGORY SAMPLE SHOWCASE ---------- */
function initCategoryShowcase() {
  const catItems = document.querySelectorAll('.cat-item');
  const sampleGrid = document.getElementById('sampleGrid');
  const catNameLabel = document.getElementById('sampleCategory-name') || document.getElementById('sample-category-name');
  
  if (!catItems.length || !sampleGrid) return;

  const sampleData = {
    food: [
      { t: 'Authentic Thali', img: 'images/food_sample_1.png' },
      { t: 'Gourmet Burger', p: 'food-v1' },
      { t: 'Artisanal Pizza', p: 'food-v2' },
      { t: 'Sushi Platter', p: 'food-v3' },
      { t: 'Healthy Salad', p: 'food-v1' }
    ],
    cakes: [
      { t: 'Wedding Cake', img: 'images/product_cake1.png' },
      { t: 'Chocolate Lava', p: 'cakes-v1' },
      { t: 'Rainbow Layer', p: 'cakes-v2' },
      { t: 'Red Velvet', p: 'cakes-v3' },
      { t: 'Fruit Tart', p: 'cakes-v1' }
    ],
    clothes: [
      { t: 'Haori Jacket', img: 'images/product_shirt1.png' },
      { t: 'Linen Shirts', img: 'images/product_shirt2.png' },
      { t: 'Street Hoodie', p: 'clothes-v1' },
      { t: 'Evening Gown', p: 'clothes-v2' },
      { t: 'Ethnic Wear', p: 'clothes-v3' }
    ],
    electronics: [
      { t: 'Sleek Phone', img: 'images/product_phone1.png' },
      { t: 'Gaming Laptop', p: 'elec-v1' },
      { t: 'Pro Headphones', p: 'elec-v2' },
      { t: 'Smart Watch', p: 'elec-v3' },
      { t: 'Mirrorless Cam', p: 'elec-v1' }
    ],
    shoes: [
      { t: 'Urbane Kicks', img: 'images/product_shoes1.png' },
      { t: 'Leather Brogues', p: 'shoes-v1' },
      { t: 'Running Shoes', p: 'shoes-v2' },
      { t: 'Designer Heels', p: 'shoes-v3' },
      { t: 'Hiking Boots', p: 'shoes-v1' }
    ]
  };

  window.updateCategoryShowcase = function(cat) {
    const data = sampleData[cat];
    if (!data) return;

    if (catNameLabel) catNameLabel.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

    sampleGrid.style.opacity = '0';
    setTimeout(() => {
      sampleGrid.innerHTML = data.map(item => `
        <div class="sample-card">
          ${item.img ? `<img src="${item.img}" alt="${item.t}" class="sample-img">` : `<div class="sample-placeholder ${item.p}"><span>${item.t}</span></div>`}
          <div class="sample-overlay">
            <span>${item.t}</span>
          </div>
        </div>
      `).join('');
      sampleGrid.style.opacity = '1';
    }, 200);
  }

  catItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = item.dataset.cat;
      if (!cat) return;

      // Update header active state
      catItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      window.updateCategoryShowcase(cat);
      
      // Optionally scroll to showcase
      const target = document.getElementById('sample-showcase');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Handle Main Nav Category Clicks
  document.addEventListener('click', e => {
    const catLink = e.target.closest('.nav-link-cat');
    if (catLink) {
      e.preventDefault();
      const cat = catLink.dataset.cat;
      showPage('home');
      setTimeout(() => {
        if (window.updateCategoryShowcase) window.updateCategoryShowcase(cat);
        const el = document.getElementById('sample-showcase');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update header strip active state if it's visible
        const catItems = document.querySelectorAll('.cat-item');
        catItems.forEach(i => i.classList.toggle('active', i.dataset.cat === cat));
      }, 100);
    }
  });
}

/* ---------- TRENDING SLIDER ---------- */
function initTrendingSlider() {
  const slider = document.getElementById('vendorShopGrid');
  if (!slider) return;

  setInterval(() => {
    const card = slider.querySelector('.vendor-showcase-card');
    if (!card) return;
    
    // Using 24px gap between cards
    const itemWidth = card.offsetWidth + 24; 
    
    // If we've reached the end, snap back to the start
    if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
      slider.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      slider.scrollBy({ left: itemWidth, behavior: 'smooth' });
    }
  }, 5000); // 5 second timing
}

/* ---------- END APP LOGIC ---------- */


