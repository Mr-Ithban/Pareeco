/* =========================================================
   clients-page.js — PAREECO Clients Page Loader
   Fetches ALL clients from Firestore and renders them into
   the #allClientsGrid on clients.html
   ========================================================= */

import { db } from './firebase-config.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

async function loadAllClients() {
  const grid = document.getElementById('allClientsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="firestore-loading"><i class="fas fa-spinner fa-spin"></i> Loading clients…</div>';

  try {
    const snapshot = await getDocs(collection(db, 'clients'));

    if (snapshot.empty) {
      grid.innerHTML = '<div class="firestore-empty"><i class="fas fa-users"></i><p>No clients added yet.</p></div>';
      return;
    }

    grid.innerHTML = '';

    snapshot.forEach((doc) => {
      const c = doc.data();
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

    // Re-run scroll reveal on newly injected cards
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));

  } catch (err) {
    console.error('Firestore error (all clients):', err);
    grid.innerHTML = '<div class="firestore-empty"><i class="fas fa-exclamation-circle"></i><p>Could not load clients. Check your Firebase configuration.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', loadAllClients);
