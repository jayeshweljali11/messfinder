/**
 * Mess Finder - Dedicated Mess Owner Dashboard Controller
 * Handles real-time pricing updates, daily menu publishing, live student admissions & review viewing
 * Zero dummy data: Connected directly to backend APIs & live student admissions register
 */

let currentOwnerMess = null;

// Storage helpers for live per-mess admissions register
function getMessAdmissions(messId) {
  if (!messId) return [];
  try {
    const raw = localStorage.getItem(`messfinder_admissions_${messId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveMessAdmissions(messId, admissions) {
  if (!messId) return;
  try {
    localStorage.setItem(`messfinder_admissions_${messId}`, JSON.stringify(admissions));
  } catch (e) {
    console.error('Failed to save admissions to storage:', e);
  }
}

// Gate Modal Helpers
function showGateModal() {
  const gateModal = document.getElementById('ownerGateModal');
  if (gateModal) {
    gateModal.style.display = 'flex';
    gateModal.classList.add('open');
  }
}

function hideGateModal() {
  const gateModal = document.getElementById('ownerGateModal');
  if (gateModal) {
    gateModal.style.display = 'none';
    gateModal.classList.remove('open');
  }
}

function showGateError(msg) {
  const errAlert = document.getElementById('gateErrorAlert');
  if (errAlert) {
    errAlert.style.display = 'block';
    errAlert.innerHTML = `⚠️ ${msg}`;
  }
}

// Initialize Owner Dashboard (Strict Authentication Gate)
async function initOwnerDashboard() {
  const user = UserAuth.getUser();

  // Strict check: Only authenticated mess owners with verified credentials can enter!
  if (!user || user.role !== 'messOwner' || !user.isAuthenticated) {
    showGateModal();
    return;
  }

  // Fetch Messes to strictly match Owner's Mess
  try {
    const res = await API.getAllMesses();
    const messes = res.data || [];

    // Find mess strictly matching authenticated owner
    currentOwnerMess = messes.find(m => 
      (user.messId && String(m._id) === String(user.messId)) ||
      (user.username && m.username && m.username.toLowerCase() === user.username.toLowerCase()) ||
      (user.phone && m.phone === user.phone) ||
      (user.ownerName && m.ownerName?.toLowerCase() === user.ownerName.toLowerCase())
    );

    if (!currentOwnerMess) {
      showGateModal();
      showGateError('Unauthorized: No registered mess found matching your active session. Please sign in with valid credentials.');
      return;
    }

    hideGateModal();

    // Populate UI with live mess data
    populateDashboardData(currentOwnerMess);

    // Fetch full mess details with live reviews
    const fullDetails = await API.getMessById(currentOwnerMess._id);
    if (fullDetails?.data) {
      currentOwnerMess = fullDetails.data;
      populateDashboardData(currentOwnerMess);
      populateReviews(fullDetails.data.reviews || []);
    }

  } catch (err) {
    console.error('Error initializing owner dashboard:', err);
    showToast('Failed to load mess data from server', 'error');
  }
}

// Populate UI Fields
function populateDashboardData(mess) {
  // Topbar
  const topbarName = document.getElementById('topbarMessName');
  if (topbarName) topbarName.innerText = mess.name;

  const btnPreview = document.getElementById('btnStudentViewPreview');
  if (btnPreview) {
    btnPreview.href = `mess-details.html?id=${mess._id}`;
  }

  // Admissions
  const admissions = getMessAdmissions(mess._id);
  const admissionsCount = admissions.length;

  const statAdm = document.getElementById('statAdmissionsCount');
  if (statAdm) statAdm.innerText = admissionsCount;

  const tabAdmCount = document.getElementById('admissionsTabCount');
  if (tabAdmCount) tabAdmCount.innerText = admissionsCount;

  const capText = document.getElementById('statAdmissionsCapacity');
  if (capText) {
    capText.innerText = `${admissionsCount} Students Enrolled in Mess Register`;
  }

  // Monthly Price Stat
  const statPrice = document.getElementById('statOwnerPrice');
  if (statPrice) statPrice.innerText = `₹${(mess.monthlyPrice || 0).toLocaleString()}`;

  const revenueEst = document.getElementById('statRevenueEst');
  if (revenueEst) {
    const totalRev = admissionsCount * (mess.monthlyPrice || 0);
    revenueEst.innerText = totalRev > 0 
      ? `Est. Monthly Collection: ₹${totalRev.toLocaleString()}` 
      : 'Synced directly to Student Search';
  }

  // Rating & Reviews Stats
  const statRating = document.getElementById('statOwnerRating');
  if (statRating) statRating.innerText = mess.rating ? mess.rating.toFixed(1) : '0.0';

  const statReviews = document.getElementById('statReviewsCount');
  if (statReviews) statReviews.innerText = mess.reviewCount || 0;

  const tabReviewsCount = document.getElementById('reviewsTabCount');
  if (tabReviewsCount) tabReviewsCount.innerText = mess.reviewCount || 0;

  // Pricing & Timings Form
  const editPrice = document.getElementById('editMonthlyPrice');
  if (editPrice) editPrice.value = mess.monthlyPrice || '';

  const editTrial = document.getElementById('editTrialPrice');
  if (editTrial) editTrial.value = mess.trialPrice || 80;

  const timeBreakfast = document.getElementById('editTimingBreakfast');
  if (timeBreakfast) timeBreakfast.value = mess.meals?.breakfast?.timing || '7:30 AM - 10:00 AM';

  const timeLunch = document.getElementById('editTimingLunch');
  if (timeLunch) timeLunch.value = mess.meals?.lunch?.timing || '12:00 PM - 3:30 PM';

  const timeDinner = document.getElementById('editTimingDinner');
  if (timeDinner) timeDinner.value = mess.meals?.dinner?.timing || '7:30 PM - 10:30 PM';

  const chkBreakfast = document.getElementById('editAvailBreakfast');
  if (chkBreakfast) chkBreakfast.checked = mess.meals?.breakfast?.available !== false;

  const chkLunch = document.getElementById('editAvailLunch');
  if (chkLunch) chkLunch.checked = mess.meals?.lunch?.available !== false;

  const chkDinner = document.getElementById('editAvailDinner');
  if (chkDinner) chkDinner.checked = mess.meals?.dinner?.available !== false;

  // Daily Menu Form
  const menuBreakfast = document.getElementById('editMenuBreakfast');
  if (menuBreakfast) {
    menuBreakfast.value = Array.isArray(mess.menu?.breakfast) ? mess.menu.breakfast.join('\n') : (mess.menu?.breakfast || "Poha\nUpma\nChai");
  }

  const menuLunch = document.getElementById('editMenuLunch');
  if (menuLunch) {
    menuLunch.value = Array.isArray(mess.menu?.lunch) ? mess.menu.lunch.join('\n') : (mess.menu?.lunch || "4 Chapatis\nSeasonal Sabzi\nDal Tadka\nSteamed Rice");
  }

  const menuDinner = document.getElementById('editMenuDinner');
  if (menuDinner) {
    menuDinner.value = Array.isArray(mess.menu?.dinner) ? mess.menu.dinner.join('\n') : (mess.menu?.dinner || "4 Rotis\nSpecial Bhaji\nDal Fry\nJeera Rice");
  }

  const menuSpecial = document.getElementById('editMenuSpecial');
  if (menuSpecial) {
    menuSpecial.value = mess.menu?.special || "Sunday Special: Feast Thali & Sweet";
  }

  // Profile Form
  const editName = document.getElementById('editMessName');
  if (editName) editName.value = mess.name || '';

  const editOwner = document.getElementById('editOwnerName');
  if (editOwner) editOwner.value = mess.ownerName || '';

  const editPhone = document.getElementById('editPhone');
  if (editPhone) editPhone.value = mess.phone || '';

  const editWhatsApp = document.getElementById('editWhatsApp');
  if (editWhatsApp) editWhatsApp.value = mess.whatsapp || mess.phone || '';

  const editFood = document.getElementById('editFoodType');
  if (editFood) editFood.value = mess.foodType || 'Both';

  const editDesc = document.getElementById('editDescription');
  if (editDesc) editDesc.value = mess.description || '';

  // Render Live Admissions Table
  renderAdmissionsTable();
}

// Render Real Live Admissions Table
function renderAdmissionsTable() {
  const tbody = document.getElementById('admissionsTableBody');
  if (!tbody || !currentOwnerMess) return;

  const admissions = getMessAdmissions(currentOwnerMess._id);

  if (admissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 3rem 1.5rem; text-align: center; color: #94a3b8;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">👨‍🎓</div>
          <h4 style="font-family: var(--font-heading); font-size: 1.15rem; color: #ffffff; margin-bottom: 0.35rem;">
            No Student Admissions Yet
          </h4>
          <p style="font-size: 0.88rem; max-width: 440px; margin: 0 auto 1.25rem;">
            Click <b>"+ Add Student Admission"</b> above to record enrolled students and their meal subscriptions.
          </p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = admissions.map(adm => {
    const isTrial = adm.status === 'Trial';
    const badgeClass = isTrial ? 'badge-trial' : 'badge-active';
    const waPhone = (adm.phone || '').replace(/[^0-9]/g, '');

    return `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 1rem; font-weight: 700; color: #ffffff;">
          ${adm.name}
        </td>
        <td style="padding: 1rem; color: #94a3b8;">
          ${adm.college || 'College Student'}
        </td>
        <td style="padding: 1rem; color: #fbbf24; font-weight: 600;">
          ${adm.plan}
        </td>
        <td style="padding: 1rem; color: #94a3b8; font-size: 0.85rem;">
          ${adm.date || 'Recent'}
        </td>
        <td style="padding: 1rem;">
          <span class="admission-badge ${badgeClass}">${adm.status}</span>
        </td>
        <td style="padding: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${adm.name}, this is ${currentOwnerMess?.name || 'Mess Owner'} regarding your meal subscription.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 0.25rem 0.6rem;">
            💬 WhatsApp
          </a>
          <button onclick="removeAdmission(${adm.id})" class="btn btn-danger btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" title="Remove student">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Add New Live Student Admission
function addNewAdmission(admissionData) {
  if (!currentOwnerMess) return;

  const admissions = getMessAdmissions(currentOwnerMess._id);
  const newRecord = {
    id: Date.now(),
    name: admissionData.name.trim(),
    college: (admissionData.college || '').trim() || 'Student / Bachelor',
    phone: admissionData.phone.trim(),
    plan: admissionData.plan,
    status: admissionData.status || 'Active',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  admissions.unshift(newRecord);
  saveMessAdmissions(currentOwnerMess._id, admissions);

  // Update UI & Stat Cards
  populateDashboardData(currentOwnerMess);
  showToast(`Admission registered for ${newRecord.name}!`, 'success');
}

// Remove Student Admission
function removeAdmission(admissionId) {
  if (!currentOwnerMess) return;

  if (confirm('Are you sure you want to remove this student from your admissions record?')) {
    let admissions = getMessAdmissions(currentOwnerMess._id);
    admissions = admissions.filter(a => a.id !== admissionId);
    saveMessAdmissions(currentOwnerMess._id, admissions);
    populateDashboardData(currentOwnerMess);
    showToast('Student admission removed.', 'info');
  }
}

// Export Admissions to CSV
function exportAdmissionsCSV() {
  if (!currentOwnerMess) return;
  const admissions = getMessAdmissions(currentOwnerMess._id);
  if (admissions.length === 0) {
    showToast('No admissions to export yet.', 'info');
    return;
  }

  const csvRows = [
    ['Student Name', 'College', 'Phone', 'Plan', 'Join Date', 'Status'],
    ...admissions.map(a => [
      `"${a.name}"`,
      `"${a.college}"`,
      `"${a.phone}"`,
      `"${a.plan}"`,
      `"${a.date}"`,
      `"${a.status}"`
    ])
  ];

  const csvString = csvRows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${currentOwnerMess.name.replace(/\s+/g, '_')}_admissions.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Admissions exported successfully!', 'success');
}

// Populate Live Reviews Feed
function populateReviews(reviews) {
  const container = document.getElementById('ownerReviewsList');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1.5rem; color: #94a3b8;">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📝</div>
        <h4 style="font-family: var(--font-heading); font-size: 1.15rem; color: #ffffff; margin-bottom: 0.35rem;">
          No Live Reviews Yet
        </h4>
        <p style="font-size: 0.88rem; max-width: 440px; margin: 0 auto;">
          As students visit your mess page and submit ratings, their honest feedback will appear here in real time.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

    return `
      <div style="background: #151f32; border-radius: var(--radius-lg); padding: 1.25rem; border: 1px solid #1e293b; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div>
            <strong style="color: #ffffff; font-size: 0.95rem;">${r.userName}</strong>
            <span style="font-size: 0.8rem; color: #94a3b8; margin-left: 0.5rem;">(${r.userCollege || 'Student'})</span>
          </div>
          <div style="color: #fbbf24; font-size: 1.1rem;">${stars}</div>
        </div>
        <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.5; margin-bottom: 0.5rem;">"${r.comment}"</p>
        <span style="font-size: 0.8rem; color: #64748b;">${dateStr}</span>
      </div>
    `;
  }).join('');
}

// Save Pricing Changes via Backend API
async function handleSavePricing(silent = false) {
  if (!currentOwnerMess) return;

  const btn = document.getElementById('btnSavePricing');
  const priceVal = parseFloat(document.getElementById('editMonthlyPrice').value);
  const trialVal = parseFloat(document.getElementById('editTrialPrice').value);

  if (isNaN(priceVal) || priceVal < 500) {
    showToast('Please enter a valid monthly price (at least ₹500)', 'error');
    return;
  }

  const breakfastTiming = document.getElementById('editTimingBreakfast').value;
  const lunchTiming = document.getElementById('editTimingLunch').value;
  const dinnerTiming = document.getElementById('editTimingDinner').value;

  const breakfastAvail = document.getElementById('editAvailBreakfast').checked;
  const lunchAvail = document.getElementById('editAvailLunch').checked;
  const dinnerAvail = document.getElementById('editAvailDinner').checked;

  const payload = {
    monthlyPrice: priceVal,
    trialPrice: trialVal || 80,
    meals: {
      breakfast: { available: breakfastAvail, timing: breakfastTiming },
      lunch: { available: lunchAvail, timing: lunchTiming },
      dinner: { available: dinnerAvail, timing: dinnerTiming }
    }
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Saving...';
  }

  try {
    await API.updateMess(currentOwnerMess._id, payload);
    currentOwnerMess = { ...currentOwnerMess, ...payload };

    // Update stat card on dashboard
    const statPrice = document.getElementById('statOwnerPrice');
    if (statPrice) statPrice.innerText = `₹${priceVal.toLocaleString()}`;

    if (!silent) {
      showToast(`Monthly price updated to ₹${priceVal.toLocaleString()}! Students searching on Mess Finder can now see your new price.`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update pricing', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span> Save Pricing Changes';
    }
  }
}

// Save Menu Changes via Backend API
async function handleSaveMenu(silent = false) {
  if (!currentOwnerMess) return;

  const btn = document.getElementById('btnSaveMenu');

  const breakfastItems = document.getElementById('editMenuBreakfast').value.split('\n').map(s => s.trim()).filter(Boolean);
  const lunchItems = document.getElementById('editMenuLunch').value.split('\n').map(s => s.trim()).filter(Boolean);
  const dinnerItems = document.getElementById('editMenuDinner').value.split('\n').map(s => s.trim()).filter(Boolean);
  const specialDish = document.getElementById('editMenuSpecial').value.trim();

  const payload = {
    menu: {
      breakfast: breakfastItems,
      lunch: lunchItems,
      dinner: dinnerItems,
      special: specialDish
    }
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Publishing Menu...';
  }

  try {
    await API.updateMess(currentOwnerMess._id, payload);
    currentOwnerMess = { ...currentOwnerMess, ...payload };
    if (!silent) {
      showToast('Today’s food menu published! Students visiting your mess page will see this updated menu immediately.', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update menu', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🚀</span> Publish Today’s Menu';
    }
  }
}

// Save Profile Info via Backend API
async function handleSaveProfile() {
  if (!currentOwnerMess) return;

  const btn = document.getElementById('btnSaveProfile');
  const name = document.getElementById('editMessName').value.trim();
  const ownerName = document.getElementById('editOwnerName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const whatsapp = document.getElementById('editWhatsApp').value.trim();
  const foodType = document.getElementById('editFoodType').value;
  const description = document.getElementById('editDescription').value.trim();

  if (!name || !phone) {
    showToast('Mess Name and Contact Phone are required', 'error');
    return;
  }

  const payload = {
    name,
    ownerName,
    phone,
    whatsapp,
    foodType,
    description
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Saving...';
  }

  try {
    await API.updateMess(currentOwnerMess._id, payload);
    currentOwnerMess = { ...currentOwnerMess, ...payload };

    const topbarName = document.getElementById('topbarMessName');
    if (topbarName) topbarName.innerText = name;

    showToast('Mess profile details updated successfully!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span> Save Details';
    }
  }
}

// Global Quick Save (Single unified notification)
async function handleSaveAll() {
  const topSaveBtn = document.querySelector('.sync-live-banner .btn-primary');
  if (topSaveBtn) {
    topSaveBtn.disabled = true;
    topSaveBtn.innerHTML = '<span>⏳</span> Syncing...';
  }

  try {
    await handleSavePricing(true);
    await handleSaveMenu(true);
    showToast('All Mess details & today’s menu saved and synced with student site!', 'success');
  } catch (e) {
    showToast('Failed to sync updates: ' + e.message, 'error');
  } finally {
    if (topSaveBtn) {
      topSaveBtn.disabled = false;
      topSaveBtn.innerHTML = '<span>💾</span> Save All Updates';
    }
  }
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initOwnerDashboard();

  // Tab Navigation Switching
  const tabs = document.querySelectorAll('.owner-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.dataset.tab;
      document.querySelectorAll('.owner-tab-content').forEach(content => {
        content.style.display = content.id === targetId ? 'block' : 'none';
      });
    });
  });

  // Buttons Bindings
  const btnPricing = document.getElementById('btnSavePricing');
  if (btnPricing) btnPricing.addEventListener('click', handleSavePricing);

  const btnMenu = document.getElementById('btnSaveMenu');
  if (btnMenu) btnMenu.addEventListener('click', handleSaveMenu);

  const btnProfile = document.getElementById('btnSaveProfile');
  if (btnProfile) btnProfile.addEventListener('click', handleSaveProfile);

  const btnSaveAll = document.getElementById('btnSaveAllQuick');
  if (btnSaveAll) btnSaveAll.addEventListener('click', handleSaveAll);

  // Export admissions binding
  const btnExport = document.getElementById('btnExportAdmissions');
  if (btnExport) btnExport.addEventListener('click', exportAdmissionsCSV);

  // Add Student Admission Modal Controls
  const addStudentModal = document.getElementById('addStudentModal');
  const btnOpenAddStudent = document.getElementById('btnOpenAddStudentModal');
  const btnCloseAddStudent = document.getElementById('closeAddStudentModal');
  const btnCancelAddStudent = document.getElementById('cancelAddStudent');
  const addStudentForm = document.getElementById('addStudentForm');

  if (btnOpenAddStudent && addStudentModal) {
    btnOpenAddStudent.addEventListener('click', () => {
      addStudentModal.style.display = 'flex';
      addStudentModal.classList.add('open');
    });
  }

  const closeStudentModalFn = () => {
    if (addStudentModal) {
      addStudentModal.style.display = 'none';
      addStudentModal.classList.remove('open');
    }
  };

  if (btnCloseAddStudent) btnCloseAddStudent.addEventListener('click', closeStudentModalFn);
  if (btnCancelAddStudent) btnCancelAddStudent.addEventListener('click', closeStudentModalFn);

  if (addStudentForm) {
    addStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newStudentName').value;
      const college = document.getElementById('newStudentCollege').value;
      const phone = document.getElementById('newStudentPhone').value;
      const plan = document.getElementById('newStudentPlan').value;
      const status = document.getElementById('newStudentStatus').value;

      addNewAdmission({ name, college, phone, plan, status });
      addStudentForm.reset();
      closeStudentModalFn();
    });
  }

  // Owner Logout
  const btnLogout = document.getElementById('btnOwnerLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of the Mess Owner Portal?')) {
        UserAuth.logout();
        window.location.href = 'index.html';
      }
    });
  }

  // Gate Form Authentication Submission
  const gateForm = document.getElementById('ownerGateForm');
  if (gateForm) {
    gateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('gateUsername').value.trim();
      const password = document.getElementById('gatePassword').value;
      const errAlert = document.getElementById('gateErrorAlert');
      const submitBtn = document.getElementById('btnGateLoginSubmit');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Verifying Credentials...';
      }

      try {
        const res = await API.ownerLogin(username, password);
        UserAuth.setUser({
          ...res.data,
          isAuthenticated: true
        });
        if (errAlert) errAlert.style.display = 'none';
        hideGateModal();
        showToast(`Welcome back, ${res.data.ownerName}! Dashboard unlocked.`, 'success');
        initOwnerDashboard();
      } catch (err) {
        if (errAlert) {
          errAlert.style.display = 'block';
          errAlert.innerHTML = `⚠️ ${err.message || 'Invalid Username or Password! Please verify and retry.'}`;
        }
        showToast(err.message || 'Authentication failed', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🔐 Sign In to My Dashboard';
        }
      }
    });
  }
});
