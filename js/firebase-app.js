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
    const q        = query(collection(db, 'clients'), limit(6));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showEmptyState(grid, 'No clients added yet.');
      return;
    }

    grid.innerHTML = '';

    snapshot.forEach((docItem) => {
      const c    = docItem.data();
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
function updateStatValue(selector, value) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.setAttribute('data-target', value);
    // If the element has already been animated, hard-replace the text node.
    if (el.childNodes[0] && el.childNodes[0].nodeType === 3) {
      el.childNodes[0].nodeValue = value;
    }
  });
}

async function loadStats() {
  // 1. Auto calculate Years of experience (founded 2006)
  const currentYear = new Date().getFullYear();
  const yoe = currentYear - 2006;
  updateStatValue('.stat-val-years', yoe);

  // Update static text elements containing "18+" with dynamic YOE
  document.querySelectorAll('.dynamic-yoe').forEach(el => {
    el.textContent = yoe + '+';
  });

  // 2. Fetch the dynamic customizable stats from Firebase
  try {
    const statDoc = await getDoc(doc(db, 'settings', 'stats'));
    if (statDoc.exists()) {
      const data = statDoc.data();
      if (data.projects) updateStatValue('.stat-val-projects', data.projects);
      if (data.clients) updateStatValue('.stat-val-clients', data.clients);
      if (data.workforce) updateStatValue('.stat-val-workforce', data.workforce);
    }
  } catch (err) {
    console.warn('Could not load dynamic stats from Firestore, falling back to static HTML values.');
  }
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadHomeClients(); // index.html
  loadStats();
});
