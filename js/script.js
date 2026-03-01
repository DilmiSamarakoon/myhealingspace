/* ================================================
   MY HEALING SPACE — script.js
   Articles system + Admin panel with image upload
================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────────────
     SCROLL REVEAL
  ──────────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach(el => io.observe(el));

  /* ────────────────────────────────────────
     NAV + SCROLL
  ──────────────────────────────────────── */
  const nav     = document.getElementById('nav');
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('stuck', window.scrollY > 50);
    backTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ────────────────────────────────────────
     MOBILE MENU
  ──────────────────────────────────────── */
  const ham    = document.getElementById('ham');
  const mob    = document.getElementById('mob');
  const mobX   = document.getElementById('mobX');
  const mLinks = document.querySelectorAll('.mob-link');

  const openMob  = () => { mob.classList.add('open');    document.body.style.overflow = 'hidden'; };
  const closeMob = () => { mob.classList.remove('open'); document.body.style.overflow = ''; };

  ham?.addEventListener('click', openMob);
  mobX?.addEventListener('click', closeMob);
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
      ok.style.display = 'flex';
      form.reset();
      setTimeout(() => { ok.style.display = 'none'; }, 6000);
    });
  }

  /* ════════════════════════════════════════
     ARTICLES SYSTEM
  ════════════════════════════════════════ */

  const STORAGE_KEY = 'mhs_articles_v2';
  const ADMIN_PASS  = 'healing2026';

  let articles     = [];
  let activeFilter = 'all';
  let visibleCount = 6;

  function loadArticles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      articles = raw ? JSON.parse(raw) : [];
    } catch { articles = []; }
  }

  function saveArticles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ── Render article grid ── */
  function renderArticles() {
    const grid  = document.getElementById('articles-grid');
    const empty = document.getElementById('articles-empty');
    const more  = document.getElementById('articles-more');
    if (!grid) return;

    const filtered = activeFilter === 'all'
      ? articles
      : articles.filter(a => a.tag === activeFilter);

    grid.querySelectorAll('.art-card').forEach(c => c.remove());

    if (filtered.length === 0) {
      empty.style.display = 'block';
      more.style.display  = 'none';
      return;
    }

    empty.style.display = 'none';
    filtered.slice(0, visibleCount).forEach(article => {
      grid.appendChild(createCard(article));
    });
    more.style.display = filtered.length > visibleCount ? 'block' : 'none';
  }

  function createCard(article) {
    const card = document.createElement('div');
    card.className = 'art-card';
    card.dataset.id = article.id;

    const imgHTML = article.image
      ? `<img src="${escAttr(article.image)}" alt="${escAttr(article.title)}" loading="lazy">`
      : `<div class="art-card__placeholder"><i class="fas fa-feather-alt"></i></div>`;

    card.innerHTML = `
      <div class="art-card__img">
        ${imgHTML}
        <span class="art-card__tag">${esc(article.tag || '')}</span>
      </div>
      <div class="art-card__body">
        <div class="art-card__date">${fmtDate(article.date)}</div>
        <h3 class="art-card__title">${esc(article.title)}</h3>
        <p class="art-card__excerpt">${esc(article.excerpt)}</p>
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

  /* ── Open full article ── */
  function openArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    const overlay = document.getElementById('artReadOverlay');
    const content = document.getElementById('art-read-content');

    const imgHTML = article.image
      ? `<img src="${escAttr(article.image)}" alt="${escAttr(article.title)}">`
      : `<div class="art-read__placeholder"><i class="fas fa-feather-alt"></i></div>`;

    const bodyParagraphs = (article.body || '')
      .split(/\n\n+/)
      .map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');

    content.innerHTML = `
      <div class="art-read__hero">${imgHTML}<span class="art-read__tag">${esc(article.tag || '')}</span></div>
      <div class="art-read__content">
        <div class="art-read__date">${fmtDate(article.date)}</div>
        <h2 class="art-read__title">${esc(article.title)}</h2>
        <div class="art-read__text">${bodyParagraphs}</div>
      </div>`;

    document.getElementById('artReadModal').scrollTop = 0;
    openOverlay(overlay);
  }

  document.getElementById('artReadClose')?.addEventListener('click', () => closeOverlay(document.getElementById('artReadOverlay')));
  document.getElementById('artReadOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeOverlay(document.getElementById('artReadOverlay'));
  });

  /* ════════════════════════════════════════
     ADMIN
  ════════════════════════════════════════ */

  document.getElementById('adminTrigger')?.addEventListener('click', () => {
    openOverlay(document.getElementById('adminLoginOverlay'));
    document.getElementById('adminPass')?.focus();
  });

  document.getElementById('adminLoginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('adminPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  function handleLogin() {
    const pass = document.getElementById('adminPass').value;
    const err  = document.getElementById('adminLoginErr');
    if (pass === ADMIN_PASS) {
      closeOverlay(document.getElementById('adminLoginOverlay'));
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
    closeOverlay(document.getElementById('adminLoginOverlay'));
    document.getElementById('adminPass').value = '';
    document.getElementById('adminLoginErr')?.classList.remove('show');
  });
  document.getElementById('adminLoginOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      closeOverlay(document.getElementById('adminLoginOverlay'));
      document.getElementById('adminPass').value = '';
    }
  });

  function openAdmin() {
    renderAdminList();
    openOverlay(document.getElementById('adminDashOverlay'));
  }

  document.getElementById('adminDashClose')?.addEventListener('click', () => {
    closeOverlay(document.getElementById('adminDashOverlay'));
    resetArticleForm();
  });
  document.getElementById('adminDashOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) { closeOverlay(document.getElementById('adminDashOverlay')); resetArticleForm(); }
  });

  /* Admin tabs */
  document.querySelectorAll('.modal__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal__tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
      if (btn.dataset.tab === 'manage') renderAdminList();
    });
  });

  /* ── Image Upload ── */
  const imgUploadArea  = document.getElementById('imgUploadArea');
  const imgFileInput   = document.getElementById('art-img-file');
  const imgPreviewWrap = document.getElementById('img-preview-wrap');
  const imgPreview     = document.getElementById('img-preview');
  const imgRemoveBtn   = document.getElementById('img-remove');
  const imgDataInput   = document.getElementById('art-img-data');

  // Click area → trigger file input
  imgUploadArea?.addEventListener('click', () => imgFileInput?.click());

  // Drag & drop
  imgUploadArea?.addEventListener('dragover', e => { e.preventDefault(); imgUploadArea.style.borderColor = 'var(--sage)'; });
  imgUploadArea?.addEventListener('dragleave', () => { imgUploadArea.style.borderColor = ''; });
  imgUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    imgUploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  // File selected
  imgFileInput?.addEventListener('change', () => {
    const file = imgFileInput.files[0];
    if (file) handleImageFile(file);
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please choose a file under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      imgDataInput.value = dataUrl;
      imgPreview.src = dataUrl;
      imgPreviewWrap.style.display = 'block';
      imgUploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  imgRemoveBtn?.addEventListener('click', () => {
    imgDataInput.value = '';
    imgPreview.src = '';
    imgPreviewWrap.style.display = 'none';
    imgUploadArea.style.display = 'flex';
    if (imgFileInput) imgFileInput.value = '';
  });

  /* ── Article form ── */
  const artForm     = document.getElementById('article-form');
  const submitBtn   = document.getElementById('art-submit-btn');
  const cancelEdit  = document.getElementById('art-cancel-edit');
  const artDateInput = document.getElementById('art-date');

  if (artDateInput && !artDateInput.value) {
    artDateInput.value = new Date().toISOString().split('T')[0];
  }

  artForm?.addEventListener('submit', e => {
    e.preventDefault();
    const editId  = document.getElementById('edit-id').value;
    const title   = document.getElementById('art-title').value.trim();
    const tag     = document.getElementById('art-tag').value;
    const date    = document.getElementById('art-date').value;
    const excerpt = document.getElementById('art-excerpt').value.trim();
    const body    = document.getElementById('art-body').value.trim();
    const image   = imgDataInput.value || '';

    if (!title || !excerpt || !body) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editId) {
      const idx = articles.findIndex(a => a.id === editId);
      if (idx !== -1) {
        articles[idx] = { ...articles[idx], title, tag, date, excerpt, body, image };
      }
    } else {
      articles.unshift({ id: 'art_' + Date.now(), title, tag, date, excerpt, body, image, createdAt: Date.now() });
    }

    saveArticles();
    renderArticles();
    renderAdminList();
    resetArticleForm();

    // Switch to manage tab
    document.querySelectorAll('.modal__tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.querySelector('.modal__tab[data-tab="manage"]')?.classList.add('active');
    const managePanel = document.getElementById('tab-manage');
    if (managePanel) managePanel.style.display = 'block';

    const origBtn = submitBtn.innerHTML;
    submitBtn.textContent = '✓ Saved!';
    submitBtn.style.background = 'var(--sage-dk)';
    setTimeout(() => {
      submitBtn.innerHTML = origBtn;
      submitBtn.style.background = '';
    }, 2200);
  });

  cancelEdit?.addEventListener('click', resetArticleForm);

  function resetArticleForm() {
    artForm?.reset();
    document.getElementById('edit-id').value = '';
    if (artDateInput) artDateInput.value = new Date().toISOString().split('T')[0];
    if (imgDataInput) imgDataInput.value = '';
    if (imgPreview) imgPreview.src = '';
    if (imgPreviewWrap) imgPreviewWrap.style.display = 'none';
    if (imgUploadArea) imgUploadArea.style.display = 'flex';
    if (imgFileInput) imgFileInput.value = '';
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
      item.className = 'admin-item';

      const imgHTML = article.image
        ? `<img src="${escAttr(article.image)}" alt="">`
        : `<i class="fas fa-feather-alt"></i>`;

      item.innerHTML = `
        <div class="admin-item__img">${imgHTML}</div>
        <div class="admin-item__info">
          <div class="admin-item__title">${esc(article.title)}</div>
          <div class="admin-item__meta">${esc(article.tag)} · ${fmtDate(article.date)}</div>
        </div>
        <div class="admin-item__actions">
          <button class="admin-item__btn edit" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="admin-item__btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;

      item.querySelector('.edit').addEventListener('click', () => editArticle(article.id));
      item.querySelector('.del').addEventListener('click', () => deleteArticle(article.id, item));
      list.appendChild(item);
    });
  }

  function editArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    document.getElementById('edit-id').value    = id;
    document.getElementById('art-title').value  = article.title;
    document.getElementById('art-tag').value    = article.tag;
    document.getElementById('art-date').value   = article.date;
    document.getElementById('art-excerpt').value = article.excerpt;
    document.getElementById('art-body').value   = article.body;
    imgDataInput.value = article.image || '';

    if (article.image) {
      imgPreview.src = article.image;
      imgPreviewWrap.style.display = 'block';
      imgUploadArea.style.display  = 'none';
    } else {
      imgPreviewWrap.style.display = 'none';
      imgUploadArea.style.display  = 'flex';
    }

    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Article';
    if (cancelEdit) cancelEdit.style.display = 'inline-flex';

    // Switch to add tab
    document.querySelectorAll('.modal__tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.querySelector('.modal__tab[data-tab="add"]')?.classList.add('active');
    const addPanel = document.getElementById('tab-add');
    if (addPanel) { addPanel.style.display = 'block'; addPanel.scrollTop = 0; }
  }

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
     OVERLAY HELPERS
  ════════════════════════════════════════ */
  function openOverlay(overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ════════════════════════════════════════
     HTML ESCAPE
  ════════════════════════════════════════ */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escAttr(str) {
    // For image src — don't encode the entire data URL, just escape quotes
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  loadArticles();
  renderArticles();

  // ESC to close
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['adminLoginOverlay','adminDashOverlay','artReadOverlay'].forEach(id => {
      const o = document.getElementById(id);
      if (o?.classList.contains('open')) closeOverlay(o);
    });
  });

});
