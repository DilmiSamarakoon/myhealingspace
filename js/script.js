/* ================================================
   MY HEALING SPACE — script.js
   Full articles system + admin panel
================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────────────
     SCROLL REVEAL
  ──────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ────────────────────────────────────────
     NAV + SCROLL
  ──────────────────────────────────────── */
  const nav     = document.getElementById('nav');
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('stuck', window.scrollY > 50);
    backTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ────────────────────────────────────────
     MOBILE MENU
  ──────────────────────────────────────── */
  const ham    = document.getElementById('ham');
  const mob    = document.getElementById('mob');
  const mobX   = document.getElementById('mobX');
  const mLinks = document.querySelectorAll('.mob-link');

  const openMob  = () => { mob.classList.add('open');    document.body.style.overflow = 'hidden'; };
  const closeMob = () => { mob.classList.remove('open'); document.body.style.overflow = ''; };

  ham.addEventListener('click', openMob);
  mobX.addEventListener('click', closeMob);
  mLinks.forEach(l => l.addEventListener('click', closeMob));

  /* ────────────────────────────────────────
     SMOOTH SCROLL
  ──────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const t = document.querySelector(href);
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
    });
  });

  /* ────────────────────────────────────────
     CONTACT FORM
  ──────────────────────────────────────── */
  const form = document.getElementById('contact-form');
  const ok   = document.getElementById('form-ok');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      ok.style.display = 'block';
      form.reset();
      setTimeout(() => { ok.style.display = 'none'; }, 6000);
    });
  }

  /* ────────────────────────────────────────
     STAGGER DELAYS
  ──────────────────────────────────────── */
  ['.services__grid .svc', '.audience__list .audience__item', '.philosophy__right .pillar']
    .forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.07}s`;
      });
    });

  /* ════════════════════════════════════════
     ARTICLES SYSTEM
  ════════════════════════════════════════ */

  const STORAGE_KEY = 'mhs_articles';
  const ADMIN_PASS  = 'healing2026'; // ← Change this password

  let articles     = [];
  let activeFilter = 'all';
  let visibleCount = 6; // articles shown at once

  /* Load from localStorage */
  function loadArticles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      articles = raw ? JSON.parse(raw) : [];
    } catch {
      articles = [];
    }
  }

  /* Save to localStorage */
  function saveArticles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }

  /* Format date nicely */
  function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ── Render public article grid ── */
  function renderArticles() {
    const grid  = document.getElementById('articles-grid');
    const empty = document.getElementById('articles-empty');
    const more  = document.getElementById('articles-more');

    const filtered = activeFilter === 'all'
      ? articles
      : articles.filter(a => a.tag === activeFilter);

    // Clear grid (keep empty msg as reference)
    grid.querySelectorAll('.art-card').forEach(c => c.remove());

    if (filtered.length === 0) {
      empty.style.display = 'block';
      more.style.display  = 'none';
      return;
    }

    empty.style.display = 'none';

    const shown = filtered.slice(0, visibleCount);
    shown.forEach(article => {
      const card = createCard(article);
      grid.appendChild(card);
    });

    more.style.display = filtered.length > visibleCount ? 'block' : 'none';
  }

  /* ── Create article card element ── */
  function createCard(article) {
    const card = document.createElement('div');
    card.className = 'art-card';
    card.dataset.id = article.id;

    const imgHTML = article.image
      ? `<img src="${escHtml(article.image)}" alt="${escHtml(article.title)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=art-card__img-placeholder><i class=fas fa-feather-alt></i></div>'">`
      : `<div class="art-card__img-placeholder"><i class="fas fa-feather-alt"></i></div>`;

    card.innerHTML = `
      <div class="art-card__img">
        ${imgHTML}
        <span class="art-card__tag">${escHtml(article.tag || '')}</span>
      </div>
      <div class="art-card__body">
        <div class="art-card__date">${fmtDate(article.date)}</div>
        <h3 class="art-card__title">${escHtml(article.title)}</h3>
        <p class="art-card__excerpt">${escHtml(article.excerpt)}</p>
        <span class="art-card__read">Read Article</span>
      </div>`;

    card.addEventListener('click', () => openArticle(article.id));
    return card;
  }

  /* ── Filter pills ── */
  document.querySelectorAll('.art-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.art-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter  = btn.dataset.tag;
      visibleCount  = 6;
      renderArticles();
    });
  });

  /* ── Load more ── */
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    visibleCount += 6;
    renderArticles();
  });

  /* ── Open full article modal ── */
  function openArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    const overlay = document.getElementById('artReadOverlay');
    const content = document.getElementById('art-read-content');

    const imgHTML = article.image
      ? `<img src="${escHtml(article.image)}" alt="${escHtml(article.title)}">`
      : `<div class="art-read__hero-placeholder"><i class="fas fa-feather-alt"></i></div>`;

    // Convert line breaks to paragraphs
    const bodyParagraphs = (article.body || '')
      .split(/\n\n+/)
      .map(p => `<p>${escHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');

    content.innerHTML = `
      <div class="art-read__hero">${imgHTML}<span class="art-read__tag">${escHtml(article.tag || '')}</span></div>
      <div class="art-read__body">
        <div class="art-read__date">${fmtDate(article.date)}</div>
        <h2 class="art-read__title">${escHtml(article.title)}</h2>
        <div class="art-read__text">${bodyParagraphs}</div>
      </div>`;

    document.getElementById('artReadModal').scrollTop = 0;
    openModal(overlay);
  }

  /* Close read modal */
  document.getElementById('artReadClose')?.addEventListener('click', () => {
    closeModal(document.getElementById('artReadOverlay'));
  });
  document.getElementById('artReadOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal(document.getElementById('artReadOverlay'));
  });

  /* ════════════════════════════════════════
     ADMIN PANEL
  ════════════════════════════════════════ */

  /* Trigger (hidden lock in footer) */
  document.getElementById('adminTrigger')?.addEventListener('click', () => {
    openModal(document.getElementById('adminLoginOverlay'));
    document.getElementById('adminPass').focus();
  });

  /* Login */
  document.getElementById('adminLoginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('adminPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  function handleLogin() {
    const pass = document.getElementById('adminPass').value;
    const err  = document.getElementById('adminLoginErr');

    if (pass === ADMIN_PASS) {
      closeModal(document.getElementById('adminLoginOverlay'));
      document.getElementById('adminPass').value = '';
      err.classList.remove('show');
      openAdmin();
    } else {
      err.classList.add('show');
      document.getElementById('adminPass').value = '';
      document.getElementById('adminPass').focus();
    }
  }

  document.getElementById('adminLoginClose')?.addEventListener('click', () => {
    closeModal(document.getElementById('adminLoginOverlay'));
    document.getElementById('adminLoginErr').classList.remove('show');
    document.getElementById('adminPass').value = '';
  });
  document.getElementById('adminLoginOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      closeModal(document.getElementById('adminLoginOverlay'));
      document.getElementById('adminPass').value = '';
    }
  });

  /* Open admin dashboard */
  function openAdmin() {
    renderAdminList();
    openModal(document.getElementById('adminDashOverlay'));
  }

  document.getElementById('adminDashClose')?.addEventListener('click', () => {
    closeModal(document.getElementById('adminDashOverlay'));
    resetArticleForm();
  });
  document.getElementById('adminDashOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      closeModal(document.getElementById('adminDashOverlay'));
      resetArticleForm();
    }
  });

  /* Admin tabs */
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
      if (btn.dataset.tab === 'manage') renderAdminList();
    });
  });

  /* ── Article Form ── */
  const artForm        = document.getElementById('article-form');
  const artImgInput    = document.getElementById('art-img');
  const imgPreviewWrap = document.getElementById('img-preview-wrap');
  const imgPreview     = document.getElementById('img-preview');
  const submitBtn      = document.getElementById('art-submit-btn');
  const cancelEdit     = document.getElementById('art-cancel-edit');

  // Image URL preview
  artImgInput?.addEventListener('input', () => {
    const url = artImgInput.value.trim();
    if (url) {
      imgPreview.src = url;
      imgPreviewWrap.style.display = 'block';
      imgPreview.onerror = () => { imgPreviewWrap.style.display = 'none'; };
    } else {
      imgPreviewWrap.style.display = 'none';
    }
  });

  // Set today's date as default
  const artDateInput = document.getElementById('art-date');
  if (artDateInput && !artDateInput.value) {
    artDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Submit article
  artForm?.addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value;
    const title   = document.getElementById('art-title').value.trim();
    const tag     = document.getElementById('art-tag').value;
    const date    = document.getElementById('art-date').value;
    const excerpt = document.getElementById('art-excerpt').value.trim();
    const body    = document.getElementById('art-body').value.trim();
    const image   = document.getElementById('art-img').value.trim();

    if (!title || !excerpt || !body) return;

    if (editId) {
      // Edit existing
      const idx = articles.findIndex(a => a.id === editId);
      if (idx !== -1) {
        articles[idx] = { ...articles[idx], title, tag, date, excerpt, body, image };
      }
    } else {
      // Add new (newest first)
      const newArt = {
        id: 'art_' + Date.now(),
        title, tag, date, excerpt, body, image,
        createdAt: Date.now()
      };
      articles.unshift(newArt);
    }

    saveArticles();
    renderArticles();
    renderAdminList();
    resetArticleForm();

    // Switch to manage tab
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.querySelector('.admin-tab[data-tab="manage"]').classList.add('active');
    document.getElementById('tab-manage').style.display = 'block';

    // Flash success
    submitBtn.textContent = '✓ Saved!';
    submitBtn.style.background = 'var(--moss-dk)';
    setTimeout(() => {
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Publish Article';
      submitBtn.style.background = '';
    }, 2000);
  });

  // Cancel edit
  cancelEdit?.addEventListener('click', resetArticleForm);

  function resetArticleForm() {
    artForm?.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('art-date').value = new Date().toISOString().split('T')[0];
    if (imgPreviewWrap) imgPreviewWrap.style.display = 'none';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Publish Article';
    if (cancelEdit) cancelEdit.style.display = 'none';
  }

  /* ── Render admin list ── */
  function renderAdminList() {
    const list = document.getElementById('admin-article-list');
    if (!list) return;
    list.innerHTML = '';

    if (articles.length === 0) {
      list.innerHTML = '<div class="admin-empty">No articles yet. Add your first one!</div>';
      return;
    }

    articles.forEach(article => {
      const item = document.createElement('div');
      item.className = 'admin-art-item';

      const imgHTML = article.image
        ? `<img src="${escHtml(article.image)}" alt="" onerror="this.parentNode.innerHTML='<div class=admin-art-item__ph><i class=fas fa-feather-alt></i></div>'">`
        : `<div class="admin-art-item__ph"><i class="fas fa-feather-alt"></i></div>`;

      item.innerHTML = `
        <div class="admin-art-item__img">${imgHTML}</div>
        <div class="admin-art-item__info">
          <div class="admin-art-item__title">${escHtml(article.title)}</div>
          <div class="admin-art-item__meta">${escHtml(article.tag)} · ${fmtDate(article.date)}</div>
        </div>
        <div class="admin-art-item__actions">
          <button class="admin-art-item__btn edit" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="admin-art-item__btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;

      // Edit
      item.querySelector('.edit').addEventListener('click', () => editArticle(article.id));
      // Delete
      item.querySelector('.del').addEventListener('click', () => deleteArticle(article.id, item));

      list.appendChild(item);
    });
  }

  /* ── Edit article ── */
  function editArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    document.getElementById('edit-id').value              = id;
    document.getElementById('art-title').value            = article.title;
    document.getElementById('art-tag').value              = article.tag;
    document.getElementById('art-date').value             = article.date;
    document.getElementById('art-excerpt').value          = article.excerpt;
    document.getElementById('art-body').value             = article.body;
    document.getElementById('art-img').value              = article.image || '';

    if (article.image) {
      imgPreview.src = article.image;
      imgPreviewWrap.style.display = 'block';
    } else {
      imgPreviewWrap.style.display = 'none';
    }

    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Article';
    cancelEdit.style.display = 'inline-flex';

    // Switch to add/edit tab
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.querySelector('.admin-tab[data-tab="add"]').classList.add('active');
    document.getElementById('tab-add').style.display = 'block';

    // Scroll to top of panel
    document.getElementById('tab-add').scrollTop = 0;
  }

  /* ── Delete article ── */
  function deleteArticle(id, itemEl) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    articles = articles.filter(a => a.id !== id);
    saveArticles();
    renderArticles();
    itemEl.style.opacity = '0';
    itemEl.style.transform = 'translateX(20px)';
    itemEl.style.transition = 'all .3s';
    setTimeout(() => { itemEl.remove(); if (articles.length === 0) renderAdminList(); }, 300);
  }

  /* ════════════════════════════════════════
     MODAL HELPERS
  ════════════════════════════════════════ */
  function openModal(overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ════════════════════════════════════════
     ESCAPE HTML helper
  ════════════════════════════════════════ */
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  loadArticles();
  renderArticles();

  // Keyboard ESC to close modals
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    [
      document.getElementById('adminLoginOverlay'),
      document.getElementById('adminDashOverlay'),
      document.getElementById('artReadOverlay')
    ].forEach(o => { if (o?.classList.contains('open')) closeModal(o); });
  });

});
