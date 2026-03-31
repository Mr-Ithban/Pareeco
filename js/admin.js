/* =========================================================
   admin.js — PAREECO Admin Dashboard Logic
   Handles Authentication and Firestore Clients management.
   ========================================================= */

import { db, auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ─────────────────────────────────────────────────────────
   1. UI ELEMENTS & STATE
───────────────────────────────────────────────────────── */
const loadingOverlay = document.getElementById('loadingOverlay');
const loginScreen    = document.getElementById('loginScreen');
const dashboard      = document.getElementById('dashboard');

const loginForm        = document.getElementById('loginForm');
const adminEmailInput  = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const logoutBtn        = document.getElementById('logoutBtn');

const navBtns      = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');

const clientsTableBody = document.getElementById('clientsTableBody');

let isSubmitting = false;

/* ─────────────────────────────────────────────────────────
   2. AUTHENTICATION
───────────────────────────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    fetchClients();
    fetchStats();
  } else {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    loadingOverlay.classList.remove('active');
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('Logging in...');
  try {
    await signInWithEmailAndPassword(auth, adminEmailInput.value, adminPasswordInput.value);
    showToast('Logged in successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
});

logoutBtn.addEventListener('click', async () => {
  showLoading('Logging out...');
  try {
    await signOut(auth);
    showToast('Logged out successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
});

/* ─────────────────────────────────────────────────────────
   3. NAVIGATION (sidebar tabs)
───────────────────────────────────────────────────────── */
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.dataset.target;
    viewSections.forEach(section => {
      section.classList.remove('active');
      section.classList.add('hidden');
      if (section.id === targetId) {
        section.classList.add('active');
        section.classList.remove('hidden');
      }
    });
  });
});

/* ─────────────────────────────────────────────────────────
   4. FETCH CLIENTS
───────────────────────────────────────────────────────── */
async function fetchClients() {
  loadingOverlay.classList.add('active');
  clientsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';

  try {
    const querySnapshot = await getDocs(collection(db, 'clients'));

    if (querySnapshot.empty) {
      clientsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No clients yet. Add your first one!</td></tr>';
      return;
    }

    clientsTableBody.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          ${data.logo
            ? `<img src="${data.logo}" class="table-img logo-img" onerror="this.style.display='none'" />`
            : '<div style="width:50px;height:50px;background:#eee;border-radius:6px;display:flex;align-items:center;justify-content:center"><i class="fas fa-building" style="color:#aaa"></i></div>'
          }
        </td>
        <td><strong>${data.name || 'Unnamed Client'}</strong></td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn-icon" onclick='editClient("${docSnap.id}", ${JSON.stringify(data).replace(/'/g, "&#39;")})'>
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete" onclick='deleteClient("${docSnap.id}")'>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      clientsTableBody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load clients: ' + err.message, 'error');
    clientsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Error loading clients.</td></tr>';
  } finally {
    loadingOverlay.classList.remove('active');
  }
}

/* ─────────────────────────────────────────────────────────
   5. DELETE CLIENT
───────────────────────────────────────────────────────── */
window.deleteClient = async (documentId) => {
  if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;

  showLoading('Deleting...');
  try {
    await deleteDoc(doc(db, 'clients', documentId));
    showToast('Client deleted successfully', 'success');
    fetchClients();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
};

/* ─────────────────────────────────────────────────────────
   5.b MANAGE STATS
───────────────────────────────────────────────────────── */
import { getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

async function fetchStats() {
  try {
    const statDoc = await getDoc(doc(db, 'settings', 'stats'));
    if (statDoc.exists()) {
      const data = statDoc.data();
      document.getElementById('statProjects').value = data.projects || 500;
      document.getElementById('statClients').value = data.clients || 350;
      document.getElementById('statWorkforce').value = data.workforce || 200;
    } else {
      document.getElementById('statProjects').value = 500;
      document.getElementById('statClients').value = 350;
      document.getElementById('statWorkforce').value = 200;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

const statsForm = document.getElementById('statsForm');
if (statsForm) {
  statsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const btn = document.getElementById('saveStatsBtn');
    btn.disabled = true;
    showLoading('Saving Stats...');

    const statsData = {
      projects: parseInt(document.getElementById('statProjects').value, 10),
      clients: parseInt(document.getElementById('statClients').value, 10),
      workforce: parseInt(document.getElementById('statWorkforce').value, 10)
    };

    try {
      await setDoc(doc(db, 'settings', 'stats'), statsData);
      showToast('Stats updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update stats: ' + err.message, 'error');
    } finally {
      isSubmitting = false;
      btn.disabled = false;
      hideLoading();
    }
  });
}

/* ─────────────────────────────────────────────────────────
   6. IMAGE COMPRESSION HELPER
───────────────────────────────────────────────────────── */
function compressImageToBase64(file, maxWidth = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality  = mimeType === 'image/jpeg' ? 0.75 : undefined;
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/* ─────────────────────────────────────────────────────────
   7. ADD / EDIT CLIENT FORM
───────────────────────────────────────────────────────── */
const clientForm = document.getElementById('clientForm');
clientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  const id        = document.getElementById('clientId').value;
  const submitBtn = document.getElementById('saveClientBtn');
  submitBtn.disabled = true;

  try {
    const fileInput = document.getElementById('clientImageFile');
    let newBase64   = null;

    if (fileInput.files.length > 0) {
      showLoading('Compressing logo...');
      newBase64 = await compressImageToBase64(fileInput.files[0], 400);
    }

    const clientData = {
      name: document.getElementById('clientName').value
    };

    if (newBase64) {
      clientData.logo = newBase64;
    }

    showLoading('Saving Client...');

    if (id) {
      await updateDoc(doc(db, 'clients', id), clientData);
      showToast('Client updated successfully', 'success');
    } else {
      await addDoc(collection(db, 'clients'), clientData);
      showToast('Client added successfully', 'success');
    }

    closeModal('client');
    fetchClients();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isSubmitting   = false;
    submitBtn.disabled = false;
    hideLoading();
  }
});

/* ─────────────────────────────────────────────────────────
   8. MODAL UTILITIES
───────────────────────────────────────────────────────── */
window.openModal = (type) => {
  resetForm(type);
  document.getElementById(`${type}ModalTitle`).textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  document.getElementById(`${type}Modal`).classList.add('show');
};

window.closeModal = (type) => {
  document.getElementById(`${type}Modal`).classList.remove('show');
};

window.editClient = (id, data) => {
  resetForm('client');
  document.getElementById('clientModalTitle').textContent = 'Edit Client';
  document.getElementById('clientId').value   = id;
  document.getElementById('clientName').value = data.name || '';

  if (data.logo) {
    const preview = document.getElementById('clientImagePreview');
    preview.src   = data.logo;
    document.getElementById('clientImagePreviewContainer').classList.remove('hidden');
  }

  document.getElementById('clientModal').classList.add('show');
};

function resetForm(type) {
  document.getElementById(`${type}Form`).reset();
  document.getElementById(`${type}Id`).value = '';
  document.getElementById(`${type}ImagePreviewContainer`).classList.add('hidden');
  document.getElementById(`${type}ImagePreview`).src = '';
}

// Live preview when a logo file is selected
const clientFileInput    = document.getElementById('clientImageFile');
const clientPreviewBox   = document.getElementById('clientImagePreviewContainer');
const clientPreviewImg   = document.getElementById('clientImagePreview');

clientFileInput.addEventListener('change', async (e) => {
  if (e.target.files && e.target.files[0]) {
    try {
      const base64 = await compressImageToBase64(e.target.files[0], 400);
      clientPreviewImg.src = base64;
      clientPreviewBox.classList.remove('hidden');
    } catch (err) {
      console.error('Preview error:', err);
    }
  } else {
    clientPreviewBox.classList.add('hidden');
  }
});

/* ─────────────────────────────────────────────────────────
   9. TOAST & LOADERS
───────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(text) {
  loadingOverlay.querySelector('p').textContent = text;
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
}
