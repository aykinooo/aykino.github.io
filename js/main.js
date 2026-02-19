/* ============================================================
   CYBERFOLIO — Main JavaScript
   Theme toggle, scroll reveal, mobile menu, filtering
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Theme Toggle (Dark / Light) ---------- */
  const themeToggle = document.querySelector('.theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Load saved theme or use system preference
  function getStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return prefersDark.matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    // Update toggle icon
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  // Initialize theme
  setTheme(getStoredTheme());

  // Toggle on click
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Listen for system preference changes
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });


  /* ---------- Mobile Menu ---------- */
  const burger = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      burger.classList.toggle('active');
      // Prevent body scroll when menu is open
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  /* ---------- Scroll Reveal Animations ---------- */
  const revealElements = document.querySelectorAll('.reveal, .stagger');

  if (revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after revealing (animate only once)
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }


  /* ---------- Active Nav Link ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---------- Homepage Latest Posts (from blog.html) ---------- */
  const latestPostsGrid = document.getElementById('latest-posts-grid');

  async function loadLatestPostsFromBlog() {
    if (!latestPostsGrid) return;
    try {
      const response = await fetch('./blog.html', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch blog page');

      const blogHtml = await response.text();
      const parser = new DOMParser();
      const blogDoc = parser.parseFromString(blogHtml, 'text/html');
      const latestCards = Array.from(blogDoc.querySelectorAll('.posts-grid .card')).slice(0, 3);

      if (latestCards.length === 0) throw new Error('No blog cards found');
      latestPostsGrid.innerHTML = latestCards.map((card) => card.outerHTML).join('');
    } catch (error) {
      latestPostsGrid.innerHTML = '<p class="cve-empty">Unable to load latest articles right now.</p>';
    }
  }

  loadLatestPostsFromBlog();


  /* ---------- Blog Filter Buttons ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.posts-grid .card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          const tags = card.dataset.tags || '';
          if (tags.includes(filter)) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.style.display = 'none';
          }
        }
      });
    });
  });


  /* ---------- Search Functionality ---------- */
  const searchInput = document.querySelector('.search-input');

  if (searchInput && cards.length > 0) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      cards.forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const excerpt = card.querySelector('.card-excerpt')?.textContent.toLowerCase() || '';
        const tags = card.dataset.tags?.toLowerCase() || '';

        const matches = title.includes(query) || excerpt.includes(query) || tags.includes(query);
        card.style.display = matches ? '' : 'none';
      });
    });
  }


  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ---------- Contact Form Handler ---------- */
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Show success message (replace with real backend later)
      const btn = contactForm.querySelector('.btn-primary');
      const originalText = btn.textContent;
      btn.textContent = '✓ Message envoyé !';
      btn.style.background = '#34c759';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        contactForm.reset();
      }, 2500);
    });
  }


  /* ---------- Reading Progress Bar (Article pages) ---------- */
  const progressBar = document.querySelector('.reading-progress');
  const articleContent = document.querySelector('.article-content');

  if (progressBar && articleContent) {
    window.addEventListener('scroll', () => {
      const contentTop = articleContent.offsetTop;
      const contentHeight = articleContent.offsetHeight;
      const scrolled = window.scrollY - contentTop + window.innerHeight / 2;
      const progress = Math.max(0, Math.min(100, (scrolled / contentHeight) * 100));
      progressBar.style.width = progress + '%';
    });
  }


  /* ---------- Latest CVEs Feed (Home page) ---------- */
  const cveContainer = document.getElementById('cve-list');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCveDate(dateValue) {
    if (!dateValue) return 'Unknown date';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function getSeverityLabel(cvss) {
    const score = Number(cvss);
    if (Number.isNaN(score)) return 'N/A';
    if (score >= 9) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    if (score > 0) return 'Low';
    return 'N/A';
  }

  function getSeverityKey(label) {
    if (label === 'N/A') return 'na';
    return label.toLowerCase();
  }

  // Normalise un item brut retourné par l'API NVD v2
  function normalizeCVEFromNVD(item) {
    const cve = item?.cve;
    if (!cve) return null;
    const id = String(cve.id || '').trim();
    if (!id.startsWith('CVE-')) return null;

    const enDesc = (cve.descriptions || []).find(d => d.lang === 'en');
    const summary = enDesc ? enDesc.value : 'No summary provided.';

    const m = cve.metrics || {};
    const v31 = (m.cvssMetricV31 || [])[0];
    const v30 = (m.cvssMetricV30 || [])[0];
    const v2  = (m.cvssMetricV2  || [])[0];
    const baseScore = v31?.cvssData?.baseScore
                   ?? v30?.cvssData?.baseScore
                   ?? v2?.cvssData?.baseScore
                   ?? null;

    return {
      id,
      summary,
      published: cve.published || '',
      cvss     : baseScore != null ? Number(baseScore) : null,
      url      : `https://nvd.nist.gov/vuln/detail/${id}`
    };
  }

  function renderCves(items) {
    if (!cveContainer) return;
    if (!items || items.length === 0) {
      cveContainer.innerHTML = '<p class="cve-empty">No CVE data available right now.</p>';
      return;
    }

    cveContainer.innerHTML = items.slice(0, 6).map((cve) => {
      const id = escapeHtml(cve.id || 'CVE-UNKNOWN');
      const summary = escapeHtml(cve.summary || 'No summary provided.');
      const published = formatCveDate(cve.published);
      // cve.cvss peut être null → Number(null)=0 qui fausse le badge ; on force NaN si absent
      const cvss = cve.cvss != null ? Number(cve.cvss) : NaN;
      const severity = getSeverityLabel(cvss);
      const severityClass = `cve-severity-${getSeverityKey(severity)}`;
      const badge = !Number.isNaN(cvss) ? `${severity} ${cvss.toFixed(1)}` : 'N/A';
      const url = escapeHtml(cve.url || `https://nvd.nist.gov/vuln/detail/${id}`);

      return `
        <a class="cve-card" href="${url}" target="_blank" rel="noopener noreferrer">
          <div class="cve-card-top">
            <span class="cve-id">${id}</span>
            <span class="cve-severity ${severityClass}">${badge}</span>
          </div>
          <p class="cve-summary">${summary}</p>
          <div class="cve-card-bottom">
            <span class="cve-date">${published}</span>
            <span class="cve-link">View on NVD →</span>
          </div>
        </a>
      `;
    }).join('');
  }

  async function loadLatestCves() {
    if (!cveContainer) return;

    // 1. Appel direct à l'API NVD v2
    // NVD 2.0 trie par publishDate ASCENDANT (plus ancien en premier).
    // Pour avoir les toutes dernières CVE (comme sur nvd.nist.gov) :
    //   - requête 1 : récupère le total sur la fenêtre de 7 jours
    //   - requête 2 : saute à la dernière page → CVEs les plus récentes
    try {
      const now      = new Date();
      const pubStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 23);
      const pubEnd   = now.toISOString().slice(0, 23);
      const base     = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${pubStart}&pubEndDate=${pubEnd}&noRejected`;

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      // Requête 1 : sonde pour connaître le nombre total de résultats
      const probeResp = await fetch(`${base}&resultsPerPage=1&startIndex=0`,
        { cache: 'no-store', signal: controller.signal });
      if (!probeResp.ok) throw new Error('probe failed');
      const probeData  = await probeResp.json();
      const total      = probeData.totalResults || 0;
      if (total === 0) throw new Error('no results in window');

      // Requête 2 : dernière page = CVEs les plus récemment publiées
      const startIndex = Math.max(0, total - 6);
      const mainResp   = await fetch(`${base}&resultsPerPage=6&startIndex=${startIndex}`,
        { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!mainResp.ok) throw new Error('main fetch failed');

      const data  = await mainResp.json();
      const items = (data.vulnerabilities || [])
        .map(normalizeCVEFromNVD)
        .filter(Boolean)
        .sort((a, b) => new Date(b.published) - new Date(a.published))
        .slice(0, 6);

      if (items.length > 0) {
        renderCves(items);
        return;
      }
    } catch (_e) {
      // API inaccessible — on bascule sur le JSON statique
    }

    // 2. Fallback : JSON statique mis à jour par GitHub Actions
    try {
      const response = await fetch('./data/latest-cves.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('fetch failed');
      const data = await response.json();
      renderCves(Array.isArray(data.items) ? data.items : []);
    } catch (_e) {
      cveContainer.innerHTML = '<p class="cve-empty">Unable to load CVE feed right now. Please try again later.</p>';
    }
  }

  loadLatestCves();

});
