/* ═══════════════════════════════════════════════════
   MY HEALING SPACE — script.js
   Articles system with Firebase + admin panel
═══════════════════════════════════════════════════ */

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCuH7ri961hF6L983W6uu28Bvw8JTEGOxc",
  authDomain: "articles-2d6e2.firebaseapp.com",
  projectId: "articles-2d6e2",
  storageBucket: "articles-2d6e2.firebasestorage.app",
  messagingSenderId: "450668688360",
  appId: "1:450668688360:web:36312902989aca92b1ea5d",
  measurementId: "G-RLH1EBG68F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Firestore DB

document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────────────────────
     ARTICLES SYSTEM
  ──────────────────────────────────────────────── */
  const ADMIN_PASS  = 'healing2026';

  let articles     = [];
  let activeFilter = 'all';
  let visibleCount = 6;
  let currentImageData = '';

  /* ── Helpers ── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ── Load articles from Firestore ── */
  async function loadArticles() {
    const querySnapshot = await getDocs(collection(db, "articles"));
    articles = [];
    querySnapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() });
    });
    renderArticles();
    renderAdminList();
  }

  /* ── Save new article to Firestore ── */
  async function saveArticleToFirebase(article, editId=null) {
    if (editId) {
      const articleRef = doc(db, "articles", editId);
      await updateDoc(articleRef, article);
    } else {
      await addDoc(collection(db, "articles"), article);
    }
  }

  /* ── Delete article from Firestore ── */
  async function deleteArticleFromFirebase(id) {
    await deleteDoc(doc(db, "articles", id));
    articles = articles.filter(a => a.id !== id);
    renderArticles();
    renderAdminList();
  }

  /* ── Render grid ── */
  function renderArticles() {
    const grid  = document.getElementById('articles-grid');
    const empty = document.getElementById('articles-empty');
    const more  = document.getElementById('articles-more');

    if (!grid) return;
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

  function createCard(art) {
    const card = document.createElement('div');
    card.className = 'art-card';
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
      .map(p => `<p>${esc(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');

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

  document.getElementById('adminLoginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('adminPass')?.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });

  function openAdmin() {
    renderAdminList();
    openOverlay('adminDashOverlay');
  }

  /* ── Admin list ── */
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
          <button class="admin-item__btn del" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;

      item.querySelector('.edit').addEventListener('click', () => editArticle(art.id));
      item.querySelector('.del').addEventListener('click', () => {
        if(confirm('Delete this article?')) deleteArticleFromFirebase(art.id);
      });
      list.appendChild(item);
    });
  }

  /* ── Edit article ── */
  function editArticle(id) {
    const art = articles.find(a => a.id === id);
    if (!art) return;

    document.getElementById('edit-id').value   = id;
    document.getElementById('art-title').value  = art.title;
    document.getElementById('art-tag').value    = art.tag;
    document.getElementById('art-date').value   = art.date;
    document.getElementById('art-excerpt').value= art.excerpt;
    document.getElementById('art-body').value   = art.body;
    document.getElementById('art-img-url').value= art.image?.startsWith('data:') ? '' : (art.image || '');
    currentImageData = art.image || '';
    showPreview(currentImageData);

    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display='none');
    document.querySelector('.admin-tab[data-tab="add"]').classList.add('active');
    document.getElementById('tab-add').style.display='block';
  }

  /* ── Article form submit ── */
  const artForm   = document.getElementById('article-form');
  const submitBtn = document.getElementById('art-submit-btn');

  artForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const editId  = document.getElementById('edit-id').value || null;
    const title   = document.getElementById('art-title').value.trim();
    const tag     = document.getElementById('art-tag').value;
    const date    = document.getElementById('art-date').value;
    const excerpt = document.getElementById('art-excerpt').value.trim();
    const body    = document.getElementById('art-body').value.trim();
    const image   = currentImageData || document.getElementById('art-img-url').value.trim();

    if (!title || !excerpt || !body) return;

    const article = { title, tag, date, excerpt, body, image, createdAt: Date.now() };
    await saveArticleToFirebase(article, editId);

    await loadArticles();
    resetForm();

    submitBtn.innerHTML = '<span>✓ Saved!</span>';
    submitBtn.style.background = 'var(--forest)';
    setTimeout(() => {
      submitBtn.innerHTML = '<span>Publish Article</span><i class="fas fa-plus"></i>';
      submitBtn.style.background = '';
    }, 2000);
  });

  /* ── Init ── */
  loadArticles();

});
