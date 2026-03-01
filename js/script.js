/* ═══════════════════════════════════════════════════
   MY HEALING SPACE — script.js
   Firebase Firestore + Storage (cross-device articles)
═══════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────
   FIREBASE IMPORTS
   NOTE: Your HTML <script> tag must have type="module"
   e.g. <script type="module" src="script.js"></script>
──────────────────────────────────────────────── */
import { initializeApp }                           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs,
         addDoc, updateDoc, deleteDoc,
         doc, query, orderBy }                     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref,
         uploadBytes, getDownloadURL }             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ────────────────────────────────────────────────
   🔥 YOUR FIREBASE CONFIG
   Replace ALL values below with your own from:
   Firebase Console → Project Settings → Your Apps
──────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCuH7ri961hF6L983W6uu28Bvw8JTEGOxc",
  authDomain: "articles-2d6e2.firebaseapp.com",
  projectId: "articles-2d6e2",
  storageBucket: "articles-2d6e2.firebasestorage.app",
  messagingSenderId: "450668688360",
  appId: "1:450668688360:web:36312902989aca92b1ea5d",
  measurementId: "G-RLH1EBG68F"
};

/* ── Init Firebase ── */
const app       = initializeApp(firebaseConfig);
const db        = getFirestore(app);
const storage   = getStorage(app);
const artColRef = collection(db, 'articles');

/* ════════════════════════════════════════════════
   MAIN — wait for DOM
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────────────────────
     CUSTOM CURSOR
  ──────────────────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (cursor && follower && window.innerWidth > 600) {
    let mx = 0, my = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });

    const animateFollower = () => {
      fx += (mx - fx) * 0.14;
      fy += (my - fy) * 0.14;
      follower.style.left = fx + 'px';
      follower.style.top  = fy + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    document.querySelectorAll('a, button, .art-card, .svc-card, .foryou__item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform   = 'translate(-50%,-50%) scale(1.8)';
        follower.style.transform = 'translate(-50%,-50%) scale(1.5)';
        follower.style.opacity   = '.25';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform   = 'translate(-50%,-50%) scale(1)';
        follower.style.transform = 'translate(-50%,-50%) scale(1)';
        follower.style.opacity   = '.5';
      });
    });
  }

  /* ────────────────────────────────────────────────
     SCROLL REVEAL
  ──────────────────────────────────────────────── */
  const revEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
  const revIO  = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
  revEls.forEach(el => revIO.observe(el));

  /* ────────────────────────────────────────────────
     NAV + SCROLL + BACK TO TOP
  ──────────────────────────────────────────────── */
  const nav     = document.getElementById('nav');
  const backTop = document.getElementById('backTop');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('stuck', window.scrollY > 60);
    backTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ────────────────────────────────────────────────
     MOBILE MENU
  ──────────────────────────────────────────────── */
  const ham  = document.getElementById('ham');
  const mob  = document.getElementById('mob');
  const mobX = document.getElementById('mobX');

  const openMob  = () => { mob.classList.add('open');    document.body.style.overflow = 'hidden'; };
  const closeMob = () => { mob.classList.remove('open'); document.body.style.overflow = ''; };

  ham?.addEventListener('click', openMob);
  mobX?.addEventListener('click', closeMob);
  document.querySelectorAll('.mob-link').forEach(l => l.addEventListener('click', closeMob));

  /* ────────────────────────────────────────────────
     SMOOTH SCROLL
  ──────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const t = document.querySelector(href);
      if (t) {
        closeMob();
        window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 88, behavior: 'smooth' });
      }
    });
  });

  /* ────────────────────────────────────────────────
     CONTACT FORM
  ──────────────────────────────────────────────── */
  const cForm = document.getElementById('contact-form');
  const cOk   = document.getElementById('form-ok');

  cForm?.addEventListener('submit', e => {
    e.preventDefault();
    cOk.style.display = 'flex';
    cForm.reset();
    setTimeout(() => { cOk.style.display = 'none'; }, 7000);
  });

  /* ────────────────────────────────────────────────
     STAGGER DELAYS
  ──────────────────────────────────────────────── */
  ['.services__grid .svc-card', '.foryou__list .foryou__item', '.philosophy__pillars .philo-card']
    .forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.08}s`;
      });
    });

  /* ════════════════════════════════════════════════
     ARTICLES SYSTEM
  ════════════════════════════════════════════════ */

  const ADMIN_PASS = 'healing2026'; // ← Change this password

  let articles     = [];
  let activeFilter = 'all';
  let visibleCount = 6;

  /* ── Format date ── */
  function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ────────────────────────────────────────────────
     FIREBASE: Load articles from Firestore
  ──────────────────────────────────────────────── */
  async function loadArticles() {
    try {
      showGridLoading(true);
      const q        = query(artColRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      articles       = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderArticles();
    } catch (err) {
      console.error('Failed to load articles:', err);
      showGridError();
    } finally {
      showGridLoading(false);
    }
  }

  /* ── Loading / error states ── */
  function showGridLoading(on) {
    let loader = document.getElementById('articles-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'articles-loader';
      loader.style.cssText = 'text-align:center;padding:3rem;color:var(--muted);font-size:1.05rem;grid-column:1/-1';
      loader.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:.5rem"></i>Loading articles...';
      document.getElementById('articles-grid')?.appendChild(loader);
    }
    loader.style.display = on ? 'block' : 'none';
  }

  function showGridError() {
    const grid = document.getElementById('articles-grid');
    if (!grid) return;
    grid.innerHTML = `<div style="text-align:center;padding:3rem;color:#c0392b;grid-column:1/-1">
      <i class="fas fa-exclamation-circle"></i> Could not load articles. Check your Firebase config.
    </div>`;
  }

  /* ────────────────────────────────────────────────
     FIREBASE: Add article
  ──────────────────────────────────────────────── */
  async function addArticle(data) {
    await addDoc(artColRef, {
      ...data,
      createdAt: Date.now()
    });
  }

  /* ────────────────────────────────────────────────
     FIREBASE: Update article
  ──────────────────────────────────────────────── */
  async function updateArticle(id, data) {
    await updateDoc(doc(db, 'articles', id), data);
  }

  /* ────────────────────────────────────────────────
     FIREBASE: Delete article
  ──────────────────────────────────────────────── */
  async function deleteArticleDB(id) {
    await deleteDoc(doc(db, 'articles', id));
  }

  /* ────────────────────────────────────────────────
     FIREBASE: Upload image to Storage
  ──────────────────────────────────────────────── */
  async function uploadImageToStorage(file) {
    const filename   = `articles/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  }

  /* ────────────────────────────────────────────────
     RENDER GRID
  ──────────────────────────────────────────────── */
  function renderArticles() {
    const grid  = document.getElementById('articles-grid');
    const empty = document.getElementById('articles-empty');
    const more  = document.getElementById('articles-more');

    grid.querySelectorAll('.art-card').forEach(c => c.remove());

    const filtered = activeFilter === 'all'
      ? articles
      : articles.filter(a => a.tag === activeFilter);

    if (filtered.length === 0) {
      empty.style.display = 'block';
      more.style.display  = 'none';
      return;
    }
    empty.style.display = 'none';

    const shown = filtered.slice(0, visibleCount);
    shown.forEach(art => grid.appendChild(createCard(art)));
    more.style.display = filtered.length > visibleCount ? 'block' : 'none';
  }

  /* ── Create card ── */
  function createCard(art) {
    const card = document.createElement('div');
    card.className  = 'art-card';
    card.dataset.id = art.id;

    const imgHTML = art.image
      ? `<img src="${esc(art.image)}" alt="${esc(art.title)}" loading="lazy"
            onerror="this.parentNode.innerHTML='<div class=art-card__img-ph><i class=fas fa-feather-alt></i></div>'">`
      : `<div class="art-card__img-ph"><i class="fas fa-feather-alt"></i></div>`;

    card.innerHTML = `
      <div class="art-card__img">
        ${imgHTML}
        <span class="art-card__badge">${esc(art.tag || '')}</span>
      </div>
      <div class="art-card__body">
        <div class="art-card__date">${fmtDate(art.date)}</div>
        <h3 class="art-card__title">${esc(art.title)}</h3>
        <p class="art-card__excerpt">${esc(art.excerpt)}</p>
        <span class="art-card__read">Read Article</span>
      </div>`;

    card.addEventListener('click', () => openArticleModal(art.id));
    return card;
  }

  /* ── Filter pills ── */
  document.querySelectorAll('.art-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.art-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.tag;
      visibleCount = 6;
      renderArticles();
    });
  });

  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    visibleCount += 6;
    renderArticles();
  });

  /* ── Open article modal ── */
  function openArticleModal(id) {
    const art = articles.find(a => a.id === id);
    if (!art) return;

    const content = document.getElementById('art-read-content');
    const imgHTML = art.image
      ? `<img src="${esc(art.image)}" alt="${esc(art.title)}">`
      : `<div class="art-read__hero-ph"><i class="fas fa-feather-alt"></i></div>`;

    const paras = (art.body || '')
      .split(/\n\n+/)
      .map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');

    content.innerHTML = `
      <div class="art-read__hero">${imgHTML}<span class="art-read__tag">${esc(art.tag || '')}</span></div>
      <div class="art-read__body">
        <div class="art-read__date">${fmtDate(art.date)}</div>
        <h2 class="art-read__title">${esc(art.title)}</h2>
        <div class="art-read__text">${paras}</div>
      </div>`;

    document.getElementById('artReadModal').scrollTop = 0;
    openOverlay('artReadOverlay');
  }

  document.getElementById('artReadClose')?.addEventListener('click', () => closeOverlay('artReadOverlay'));
  document.getElementById('artReadOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeOverlay('artReadOverlay');
  });

  /* ════════════════════════════════════════════════
     ADMIN PANEL
  ════════════════════════════════════════════════ */

  document.getElementById('adminTrigger')?.addEventListener('click', () => {
    openOverlay('adminLoginOverlay');
    setTimeout(() => document.getElementById('adminPass')?.focus(), 100);
  });

  document.getElementById('adminLoginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('adminPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  function handleLogin() {
    const pass = document.getElementById('adminPass').value;
    const err  = document.getElementById('adminLoginErr');
    if (pass === ADMIN_PASS) {
      closeOverlay('adminLoginOverlay');
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
    closeOverlay('adminLoginOverlay');
    document.getElementById('adminLoginErr').classList.remove('show');
    document.getElementById('adminPass').value = '';
  });
  document.getElementById('adminLoginOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeOverlay('adminLoginOverlay');
  });

  function openAdmin() {
    renderAdminList();
    openOverlay('adminDashOverlay');
  }

  document.getElementById('adminDashClose')?.addEventListener('click', () => {
    closeOverlay('adminDashOverlay');
    resetForm();
  });
  document.getElementById('adminDashOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) { closeOverlay('adminDashOverlay'); resetForm(); }
  });

  /* ── Tabs ── */
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
      if (btn.dataset.tab === 'manage') renderAdminList();
    });
  });

  /* ── Image input: URL vs Upload ── */
  let currentImageData = ''; // URL string (either typed URL or Firebase Storage URL)
  let pendingFile      = null; // File object waiting to be uploaded on submit

  const imgModeUrl     = document.getElementById('img-mode-url');
  const imgModeUpload  = document.getElementById('img-mode-upload');
  const imgPreviewWrap = document.getElementById('img-preview-wrap');
  const imgPreviewEl   = document.getElementById('img-preview');

  document.querySelectorAll('.img-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.img-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      imgModeUrl.style.display    = mode === 'url'    ? 'block' : 'none';
      imgModeUpload.style.display = mode === 'upload' ? 'block' : 'none';
    });
  });

  // URL input live preview
  document.getElementById('art-img-url')?.addEventListener('input', function () {
    const url = this.value.trim();
    pendingFile = null; // clear any pending upload
    if (url) {
      currentImageData = url;
      showPreview(url);
    } else {
      currentImageData = '';
      hidePreview();
    }
  });

  /* ── Upload zone ── */
  const uploadZone = document.getElementById('imgUploadZone');
  const fileInput  = document.getElementById('imgFileInput');

  uploadZone?.addEventListener('click', () => fileInput.click());

  uploadZone?.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone?.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleImageFile(file);
  });

  /* ────────────────────────────────────────────────
     Handle image file selection
     → Shows local preview immediately
     → Actual upload to Firebase Storage happens on form submit
  ──────────────────────────────────────────────── */
  function handleImageFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large (max 10MB). Please use a smaller image.');
      return;
    }
    pendingFile = file; // store for upload on submit

    // Show local preview immediately (no upload yet)
    const reader = new FileReader();
    reader.onload = e => {
      showPreview(e.target.result);
      uploadZone.innerHTML = `
        <i class="fas fa-check-circle" style="color:var(--forest)"></i>
        <span style="color:var(--forest)">${esc(file.name)}</span>
        <small>Ready to upload on publish</small>`;
    };
    reader.readAsDataURL(file);
  }

  function showPreview(src) {
    imgPreviewWrap.style.display = 'block';
    imgPreviewEl.src = src;
    imgPreviewEl.onerror = () => {
      imgPreviewWrap.style.display = 'none';
      currentImageData = '';
    };
  }

  function hidePreview() {
    imgPreviewWrap.style.display = 'none';
    imgPreviewEl.src = '';
  }

  document.getElementById('imgRemove')?.addEventListener('click', () => {
    currentImageData = '';
    pendingFile = null;
    document.getElementById('art-img-url').value = '';
    hidePreview();
    resetUploadZone();
    if (fileInput) fileInput.value = '';
  });

  function resetUploadZone() {
    if (!uploadZone) return;
    uploadZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <span>Click to choose or drag &amp; drop image</span>
      <small>JPG, PNG, WEBP up to 10MB</small>
      <input type="file" id="imgFileInput" accept="image/*" style="display:none">`;
    const newInput = uploadZone.querySelector('#imgFileInput');
    uploadZone.addEventListener('click', () => newInput.click());
    newInput.addEventListener('change', () => {
      const file = newInput.files[0];
      if (file) handleImageFile(file);
    });
  }

  /* ────────────────────────────────────────────────
     ARTICLE FORM SUBMIT
     → Uploads image first (if file selected)
     → Then saves article data to Firestore
  ──────────────────────────────────────────────── */
  const artForm   = document.getElementById('article-form');
  const submitBtn = document.getElementById('art-submit-btn');
  const cancelBtn = document.getElementById('art-cancel-edit');
  const artDate   = document.getElementById('art-date');

  if (artDate && !artDate.value) {
    artDate.value = new Date().toISOString().split('T')[0];
  }

  artForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const editId  = document.getElementById('edit-id').value;
    const title   = document.getElementById('art-title').value.trim();
    const tag     = document.getElementById('art-tag').value;
    const date    = document.getElementById('art-date').value;
    const excerpt = document.getElementById('art-excerpt').value.trim();
    const body    = document.getElementById('art-body').value.trim();

    if (!title || !excerpt || !body) return;

    // Disable button while saving
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving...</span><i class="fas fa-spinner fa-spin"></i>';

    try {
      let imageUrl = currentImageData || document.getElementById('art-img-url').value.trim();

      // If a local file is selected → upload to Firebase Storage first
      if (pendingFile) {
        submitBtn.innerHTML = '<span>Uploading image...</span><i class="fas fa-spinner fa-spin"></i>';
        imageUrl = await uploadImageToStorage(pendingFile);
        pendingFile = null;
      }

      const data = { title, tag, date, excerpt, body, image: imageUrl };

      if (editId) {
        await updateArticle(editId, data);
      } else {
        await addArticle(data);
      }

      await loadArticles();
      renderAdminList();
      resetForm();

      // Switch to manage tab
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
      document.querySelector('.admin-tab[data-tab="manage"]').classList.add('active');
      document.getElementById('tab-manage').style.display = 'block';

      // Flash success
      submitBtn.innerHTML  = '<span>✓ Saved!</span>';
      submitBtn.style.background = 'var(--forest)';
      setTimeout(() => {
        submitBtn.innerHTML        = '<span>Publish Article</span><i class="fas fa-plus"></i>';
        submitBtn.style.background = '';
        submitBtn.disabled         = false;
      }, 2200);

    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save article. Check your Firebase config and try again.\n\n' + err.message);
      submitBtn.innerHTML = '<span>Publish Article</span><i class="fas fa-plus"></i>';
      submitBtn.disabled  = false;
    }
  });

  cancelBtn?.addEventListener('click', resetForm);

  function resetForm() {
    artForm?.reset();
    document.getElementById('edit-id').value = '';
    if (artDate) artDate.value = new Date().toISOString().split('T')[0];
    currentImageData = '';
    pendingFile      = null;
    hidePreview();
    resetUploadZone();
    if (fileInput) fileInput.value = '';
    if (submitBtn) {
      submitBtn.innerHTML        = '<span>Publish Article</span><i class="fas fa-plus"></i>';
      submitBtn.style.background = '';
      submitBtn.disabled         = false;
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
    document.querySelectorAll('.img-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
    if (imgModeUrl)    imgModeUrl.style.display    = 'block';
    if (imgModeUpload) imgModeUpload.style.display = 'none';
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

    articles.forEach(art => {
      const item = document.createElement('div');
      item.className = 'admin-item';

      const imgHTML = art.image
        ? `<img src="${esc(art.image)}" alt=""
              onerror="this.parentNode.innerHTML='<i class=fas fa-feather-alt></i>'">`
        : `<i class="fas fa-feather-alt"></i>`;

      item.innerHTML = `
        <div class="admin-item__img">${imgHTML}</div>
        <div class="admin-item__info">
          <div class="admin-item__title">${esc(art.title)}</div>
          <div class="admin-item__meta">${esc(art.tag)} · ${fmtDate(art.date)}</div>
        </div>
        <div class="admin-item__btns">
          <button class="admin-item__btn edit" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="admin-item__btn del"  title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;

      item.querySelector('.edit').addEventListener('click', () => editArticle(art.id));
      item.querySelector('.del').addEventListener('click',  () => deleteArticle(art.id, item));
      list.appendChild(item);
    });
  }

  /* ── Edit article ── */
  function editArticle(id) {
    const art = articles.find(a => a.id === id);
    if (!art) return;

    document.getElementById('edit-id').value    = id;
    document.getElementById('art-title').value  = art.title;
    document.getElementById('art-tag').value    = art.tag;
    document.getElementById('art-date').value   = art.date;
    document.getElementById('art-excerpt').value= art.excerpt;
    document.getElementById('art-body').value   = art.body;
    document.getElementById('art-img-url').value= art.image || '';

    currentImageData = art.image || '';
    pendingFile      = null;
    if (art.image) showPreview(art.image);
    else hidePreview();

    if (submitBtn) submitBtn.innerHTML = '<span>Update Article</span><i class="fas fa-save"></i>';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.querySelector('.admin-tab[data-tab="add"]').classList.add('active');
    document.getElementById('tab-add').style.display = 'block';
    document.getElementById('tab-add').scrollTop = 0;
  }

  /* ── Delete article ── */
  async function deleteArticle(id, itemEl) {
    if (!confirm('Delete this article? This cannot be undone.')) return;

    try {
      await deleteArticleDB(id);
      articles = articles.filter(a => a.id !== id);
      renderArticles();
      itemEl.style.transition = 'all .3s';
      itemEl.style.opacity    = '0';
      itemEl.style.transform  = 'translateX(24px)';
      setTimeout(() => {
        itemEl.remove();
        if (articles.length === 0) renderAdminList();
      }, 310);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete article. Please try again.');
    }
  }

  /* ════════════════════════════════════════════════
     OVERLAY HELPERS
  ════════════════════════════════════════════════ */
  function openOverlay(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ESC to close */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['adminLoginOverlay', 'adminDashOverlay', 'artReadOverlay'].forEach(id => {
      if (document.getElementById(id)?.classList.contains('open')) closeOverlay(id);
    });
  });

  /* ════════════════════════════════════════════════
     ESCAPE HTML
  ════════════════════════════════════════════════ */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ════════════════════════════════════════════════
     INIT — Load articles from Firebase on page load
  ════════════════════════════════════════════════ */
  loadArticles();

  /* ── Parallax orbs on hero ── */
  const orbs = document.querySelectorAll('.hero__orb');
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = 0.04 + i * 0.02;
      orb.style.transform = `translateY(${sy * speed}px)`;
    });
  }, { passive: true });

});
