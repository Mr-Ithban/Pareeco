/* =========================================================
   firebase-app.js — PAREECO Dynamic Data Loader
   Fetches Clients from Firebase Firestore and renders
   them into the homepage clients section.
   ========================================================= */

import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  limit,
  query,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ─────────────────────────────────────────────────────────
   UTILITY: show a graceful empty-state message
───────────────────────────────────────────────────────── */
function showEmptyState(container, message) {
  container.innerHTML = `
    <div class="firestore-empty">
      <i class="fas fa-folder-open"></i>
      <p>${message}</p>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   CLIENTS — index.html  (#homeClientsGrid)
   Fetches first 6 clients for the homepage preview.
───────────────────────────────────────────────────────── */
async function loadHomeClients() {
  const grid = document.getElementById('homeClientsGrid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'clients'), limit(6));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showEmptyState(grid, 'No clients added yet.');
      return;
    }

    grid.innerHTML = '';

    snapshot.forEach((docItem) => {
      const c = docItem.data();
      const card = document.createElement('div');
      card.className = 'client-card reveal';

      if (c.logo) {
        card.innerHTML = `
          <img
            src="${c.logo}"
            alt="${c.name || 'Client'}"
            loading="lazy"
            onerror="this.style.display='none'"
          />
          <span class="client-name">${c.name || ''}</span>`;
      } else {
        card.innerHTML = `<span class="client-name">${c.name || 'Partner'}</span>`;
      }

      grid.appendChild(card);
    });

    reobserveReveal();

  } catch (err) {
    console.error('Firestore error (home clients):', err);
    showEmptyState(grid, 'Could not load clients. Check your Firebase configuration.');
  }
}

/* ─────────────────────────────────────────────────────────
   HELPERS: re-run IntersectionObserver
───────────────────────────────────────────────────────── */
function reobserveReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────
   STATS DYNAMIC LOAD & AUTO YOE CALCULATION
───────────────────────────────────────────────────────── */
function formatStatElement(el, targetStr) {
  el.setAttribute('data-target', targetStr);
  el.innerHTML = `0<span>+</span>`; // Remove skeleton, prepare for counter
}

function updateStatValue(selector, value, doFade = false) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    // If already initialized (cache hit earlier), we update target and trigger re-animation
    if (el.hasAttribute('data-target')) {
      el.setAttribute('data-target', value);
      window.dispatchEvent(new CustomEvent('statsUpdate', { detail: el }));
    } else {
      // First time setup - removing skeleton
      formatStatElement(el, value);
    }
  });
}

async function loadStats() {
  const currentYear = new Date().getFullYear();
  const yoe = currentYear - 2020;

  // Static text injection
  document.querySelectorAll('.dynamic-yoe').forEach(el => {
    el.textContent = yoe + '+';
  });

  let cachedData = null;
  try {
    const saved = localStorage.getItem('pareeco_stats');
    if (saved) cachedData = JSON.parse(saved);
  } catch (e) { }

  if (cachedData) {
    updateStatValue('.stat-val-years', yoe);
    if (cachedData.projects) updateStatValue('.stat-val-projects', cachedData.projects);
    if (cachedData.clients) updateStatValue('.stat-val-clients', cachedData.clients);
    if (cachedData.workforce) updateStatValue('.stat-val-workforce', cachedData.workforce);
    window.dispatchEvent(new Event('statsReady'));
  }

  try {
    const statDoc = await getDoc(doc(db, 'settings', 'stats'));
    if (statDoc.exists()) {
      const data = statDoc.data();
      localStorage.setItem('pareeco_stats', JSON.stringify(data));

      if (!cachedData) {
        updateStatValue('.stat-val-years', yoe);
        if (data.projects) updateStatValue('.stat-val-projects', data.projects);
        if (data.clients) updateStatValue('.stat-val-clients', data.clients);
        if (data.workforce) updateStatValue('.stat-val-workforce', data.workforce);
        window.dispatchEvent(new Event('statsReady'));
      } else {
        if (data.projects && String(data.projects) !== String(cachedData.projects)) updateStatValue('.stat-val-projects', data.projects, true);
        if (data.clients && String(data.clients) !== String(cachedData.clients)) updateStatValue('.stat-val-clients', data.clients, true);
        if (data.workforce && String(data.workforce) !== String(cachedData.workforce)) updateStatValue('.stat-val-workforce', data.workforce, true);
      }
    }
  } catch (err) {
    console.warn('Could not load dynamic stats from Firestore.', err);
    if (!cachedData) {
      document.querySelectorAll('.stat-val-projects, .stat-val-years, .stat-val-clients, .stat-val-workforce').forEach(el => {
        if (el.querySelector('.stat-skeleton')) el.innerHTML = '--';
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadHomeClients(); // index.html
  loadStats();
});
