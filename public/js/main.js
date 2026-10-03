/**
 * Mess Finder - Main Shared JavaScript
 * Navigation, Toast Notifications, Auth Modal, UI Helpers
 */

// Toast notification helper - High contrast, Top-Right corner, No spam / duplicates
function showToast(message, type = 'success', title = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Check if identical message is already showing to prevent double toast
  const currentToasts = container.querySelectorAll('.toast');
  for (let t of currentToasts) {
    if (t.dataset.message === message) {
      return; // prevent duplicate
    }
  }

  // Remove older toasts so there are never multiple toasts stacked up
  while (container.children.length >= 2) {
    container.firstElementChild.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.dataset.message = message;
  
  let icon = '✅';
  let defaultTitle = 'Success';
  if (type === 'error') {
    icon = '⚠️';
    defaultTitle = 'Notice';
  } else if (type === 'info') {
    icon = 'ℹ️';
    defaultTitle = 'Information';
  }

  const headerTitle = title || defaultTitle;

  toast.innerHTML = `
    <span style="font-size: 1.35rem; flex-shrink: 0;">${icon}</span>
    <div class="toast-body">
      <div class="toast-title">${headerTitle}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// Global user state management
const UserAuth = {
  getUser() {
    try {
      const data = localStorage.getItem('messfinder_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('messfinder_user', JSON.stringify(user));
    this.updateNav();
  },
  logout() {
    localStorage.removeItem('messfinder_user');
    this.updateNav();
    showToast('Logged out successfully', 'info');
  },
  updateNav() {
    const user = this.getUser();
    const onboardBtn = document.getElementById('navOnboardBtn') || document.getElementById('navOwnerQuickBtn');
    const studentBtn = document.getElementById('navStudentBtn');
    const loginBtn = document.getElementById('navLoginBtn');

    if (user && user.role === 'messOwner') {
      // If logged in as mess owner
      if (onboardBtn) {
        onboardBtn.innerHTML = '<span>👨‍🍳</span> My Mess Dashboard';
        onboardBtn.href = 'owner-dashboard.html';
        onboardBtn.style.display = 'inline-flex';
        onboardBtn.classList.remove('btn-secondary');
        onboardBtn.classList.add('btn-primary');
        onboardBtn.onclick = () => { window.location.href = 'owner-dashboard.html'; };
      }

      if (studentBtn) {
        const ownerDisplay = (user.ownerName || user.username || 'Owner').split(' ')[0];
        studentBtn.innerHTML = `<span>👨‍🍳</span> ${ownerDisplay} (Owner)`;
        studentBtn.style.borderColor = '#059669';
        studentBtn.style.color = '#34d399';
        studentBtn.title = 'Mess Owner Account - Click to sign out';
        studentBtn.onclick = (e) => {
          e.preventDefault();
          if (confirm(`Signed in as Mess Owner (${user.ownerName || user.username}). Do you want to sign out?`)) {
            UserAuth.logout();
            window.location.href = 'index.html';
          }
        };
      }
    } else if (user && user.role === 'student') {
      // If logged in as student
      if (studentBtn) {
        const studentFirst = (user.name || 'Student').split(' ')[0];
        studentBtn.innerHTML = `<span>🎓</span> ${studentFirst}`;
        studentBtn.style.borderColor = '#fbbf24';
        studentBtn.style.color = '#fbbf24';
        studentBtn.title = `Signed in as ${user.name} (${user.college || 'Student'}) - Click to Sign Out`;
        studentBtn.onclick = (e) => {
          e.preventDefault();
          if (confirm(`Logged in as verified student: ${user.name} (${user.college || 'Hosteller'}). Do you want to log out?`)) {
            UserAuth.logout();
            window.location.reload();
          }
        };
      }
      if (loginBtn) {
        loginBtn.innerHTML = `<span>🎓</span> ${user.name.split(' ')[0]}`;
        loginBtn.onclick = (e) => {
          e.preventDefault();
          if (confirm(`Logged in as ${user.name}. Do you want to log out?`)) {
            UserAuth.logout();
            window.location.reload();
          }
        };
      }
    } else {
      // Logged out
      if (studentBtn) {
        studentBtn.innerHTML = '<span>🎓</span> Student Login';
        studentBtn.style.borderColor = '';
        studentBtn.style.color = '';
        studentBtn.title = 'Student Login or Register';
        studentBtn.onclick = (e) => {
          e.preventDefault();
          openStudentModal();
        };
      }
      if (loginBtn) {
        loginBtn.innerHTML = '<span>🎓</span> Student Login';
        loginBtn.onclick = (e) => {
          e.preventDefault();
          openStudentModal();
        };
      }
    }
  }
};

// Student Portal Modal Controller
function openStudentModal() {
  const modal = document.getElementById('studentAuthModal');
  if (modal) {
    modal.classList.add('open');
  } else {
    window.location.href = 'index.html?studentLogin=true';
  }
}

function closeStudentModal() {
  const modal = document.getElementById('studentAuthModal');
  if (modal) modal.classList.remove('open');
}

function switchStudentTab(tab) {
  const tabLogin = document.getElementById('tabBtnStudentLogin');
  const tabRegister = document.getElementById('tabBtnStudentRegister');
  const secLogin = document.getElementById('studentLoginSection');
  const secRegister = document.getElementById('studentRegisterSection');

  if (tab === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (secLogin) secLogin.style.display = 'block';
    if (secRegister) secRegister.style.display = 'none';
  } else {
    if (tabRegister) tabRegister.classList.add('active');
    if (tabLogin) tabLogin.classList.remove('active');
    if (secRegister) secRegister.style.display = 'block';
    if (secLogin) secLogin.style.display = 'none';
  }
}

// Onboard / Owner Portal Modal Controller
function openOnboardModal() {
  const modal = document.getElementById('onboardModal');
  if (modal) {
    modal.classList.add('open');
  } else {
    window.location.href = 'index.html?onboard=true';
  }
}

function closeOnboardModal() {
  const modal = document.getElementById('onboardModal');
  if (modal) modal.classList.remove('open');
}

// Generate standard Mess Card HTML
function createMessCardHTML(mess) {
  const isVeg = mess.foodType === 'Veg';
  const isNonVeg = mess.foodType === 'Non-Veg';
  const foodClass = isVeg ? 'veg' : (isNonVeg ? 'nonveg' : 'both');
  const foodLabel = isVeg ? 'Pure Veg' : (isNonVeg ? 'Non-Veg' : 'Veg & Non-Veg');

  const imageUrl = (mess.images && mess.images.length > 0)
    ? mess.images[0]
    : 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80';

  // Distance formatting
  const distanceBadge = (mess.distance !== undefined && mess.distance !== null)
    ? `<div class="badge-distance"><span class="pulse-dot"></span>📍 ${mess.distance} km away</div>`
    : '';

  // Meals badges
  let mealsHtml = '';
  if (mess.meals?.breakfast?.available) mealsHtml += `<span class="meal-tag">🍳 Breakfast</span>`;
  if (mess.meals?.lunch?.available) mealsHtml += `<span class="meal-tag">🍛 Lunch</span>`;
  if (mess.meals?.dinner?.available) mealsHtml += `<span class="meal-tag">🌙 Dinner</span>`;

  // Directions link (latitude and longitude)
  const messLat = mess.location?.coordinates ? mess.location.coordinates[1] : 18.5204;
  const messLng = mess.location?.coordinates ? mess.location.coordinates[0] : 73.8567;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${messLat},${messLng}`;

  return `
    <article class="mess-card" data-id="${mess._id}">
      <div class="mess-card-media">
        <img src="${imageUrl}" alt="${mess.name}" class="mess-card-img" loading="lazy" />
        <span class="badge-food-type ${foodClass}">
          ● ${foodLabel}
        </span>
        ${mess.isVerified ? `<span class="badge-verified">✓ Verified</span>` : ''}
        ${distanceBadge}
      </div>

      <div class="mess-card-body">
        <div class="mess-card-header">
          <h3 class="mess-title">${mess.name}</h3>
          <div class="mess-rating">
            <span class="star">★</span> ${mess.rating ? mess.rating.toFixed(1) : '4.5'}
          </div>
        </div>

        <div class="mess-reviews-count">(${mess.reviewCount || 0} student reviews)</div>

        <div class="mess-price-box">
          <span class="mess-price-amount">₹${mess.monthlyPrice.toLocaleString()}</span>
          <span class="mess-price-period">/ month</span>
          ${mess.trialPrice ? `<span style="font-size: 0.8rem; color: #059669; font-weight: 600; margin-left: 0.5rem; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">₹${mess.trialPrice} trial thali</span>` : ''}
        </div>

        <div class="mess-meals-tags">
          ${mealsHtml}
        </div>

        <p class="mess-snippet">${mess.description || 'Homely, hygienic and nutritious food suitable for everyday students and bachelors.'}</p>

        <div class="mess-location-line">
          <span>📍</span>
          <span>${mess.area}, ${mess.city || 'Pune'}</span>
        </div>
      </div>

      <div class="mess-card-footer">
        <a href="mess-details.html?id=${mess._id}" class="btn btn-primary btn-sm">
          View Details
        </a>
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open Google Maps Directions">
          📍 Directions
        </a>
      </div>
    </article>
  `;
}

// Document Ready Setup
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Menu Toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Active Nav Link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href === 'index.html' && (currentPath === '/' || currentPath === '')))) {
      link.classList.add('active');
    }
  });

  // Auth Nav initialization
  UserAuth.updateNav();

  // Bind Onboard Your Mess Buttons
  document.querySelectorAll('.btn-onboard-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = UserAuth.getUser();
      if (user && user.role === 'messOwner') {
        window.location.href = 'owner-dashboard.html';
      } else {
        openOnboardModal();
      }
    });
  });

  // Setup Onboard Modal Event Listeners
  const onboardClose = document.getElementById('onboardModalClose');
  if (onboardClose) onboardClose.addEventListener('click', closeOnboardModal);

  const onboardBackdrop = document.getElementById('onboardModal');
  if (onboardBackdrop) {
    onboardBackdrop.addEventListener('click', (e) => {
      if (e.target === onboardBackdrop) closeOnboardModal();
    });
  }

  // Auto open onboard modal if query param is set
  if (window.location.search.includes('onboard=true')) {
    openOnboardModal();
  }

  // Tab Switcher for Owner Modal (Login vs Register)
  window.switchOnboardTab = function(tabName) {
    const tabLogin = document.getElementById('tabBtnOwnerLogin');
    const tabRegister = document.getElementById('tabBtnOwnerRegister');
    const secLogin = document.getElementById('onboardLoginSection');
    const secRegister = document.getElementById('onboardRegisterSection');

    if (tabName === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (secLogin) secLogin.style.display = 'block';
      if (secRegister) secRegister.style.display = 'none';
    } else {
      if (tabRegister) tabRegister.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (secRegister) secRegister.style.display = 'block';
      if (secLogin) secLogin.style.display = 'none';
    }
  };

  // Live Doorstep GPS Satellite Geolocation Capture
  window.captureLiveOwnerLocation = function() {
    const statusEl = document.getElementById('liveGpsStatus');
    const latInput = document.getElementById('onboardLatitude');
    const lngInput = document.getElementById('onboardLongitude');

    if (!navigator.geolocation) {
      if (statusEl) {
        statusEl.className = 'live-gps-pill error';
        statusEl.innerHTML = '<span>⚠️</span> Live Geolocation is not supported by your browser.';
      }
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    if (statusEl) {
      statusEl.className = 'live-gps-pill capturing';
      statusEl.innerHTML = '<span>📡</span> <b>Locking Live GPS Satellites...</b> Please allow browser location access.';
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;

        if (statusEl) {
          statusEl.className = 'live-gps-pill';
          statusEl.style.background = '#dcfce7';
          statusEl.style.borderColor = '#86efac';
          statusEl.style.color = '#15803d';
          statusEl.innerHTML = `<span>✅</span> <b>Live Doorstep GPS Locked!</b> Lat: ${lat}, Lng: ${lng} (Accuracy: ±${accuracy}m)`;
        }

        showToast(`Live GPS Locked! Coordinates: ${lat}, ${lng}`, 'success');

        // Optional Reverse Geocoding to auto-fill address/area
        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (revRes.ok) {
            const data = await revRes.json();
            if (data && data.address) {
              const areaField = document.getElementById('onboardArea');
              const addrField = document.getElementById('onboardAddress');
              const foundArea = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.city_district || 'Pune';
              const foundRoad = data.address.road || data.address.pedestrian || '';

              if (areaField && !areaField.value) areaField.value = foundArea;
              if (addrField && !addrField.value && foundRoad) addrField.value = `${foundRoad}, ${foundArea}`;
            }
          }
        } catch (e) {
          console.warn('Reverse geocode note:', e);
        }
      },
      (err) => {
        console.warn('GPS capture error:', err);
        if (statusEl) {
          statusEl.className = 'live-gps-pill error';
          let msg = 'Could not capture live GPS.';
          if (err.code === 1) msg = 'Location permission denied. Please allow location access in your browser.';
          else if (err.code === 2) msg = 'Live location unavailable. Please check device GPS.';
          else if (err.code === 3) msg = 'GPS timeout. You can enter coordinates manually.';
          statusEl.innerHTML = `<span>⚠️</span> ${msg} (Latitude/Longitude can be set manually)`;
        }
        showToast('Live GPS could not be captured. You can enter coordinates manually.', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };



  // Owner Login Form Submission (Tab 1)
  const ownerLoginForm = document.getElementById('ownerLoginForm');
  if (ownerLoginForm) {
    ownerLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('ownerLoginUser').value.trim();
      const password = document.getElementById('ownerLoginPass').value;

      if (!username || !password) {
        showToast('Please enter both Username and Password.', 'error');
        return;
      }

      try {
        const res = await API.ownerLogin(username, password);
        UserAuth.setUser({
          ...res.data,
          isAuthenticated: true
        });
        closeOnboardModal();
        showToast(`Welcome back, ${res.data.ownerName}! Opening your Owner Dashboard...`, 'success');
        setTimeout(() => {
          window.location.href = 'owner-dashboard.html';
        }, 600);
      } catch (err) {
        showToast(err.message || 'Invalid Username or Password! Please verify and retry.', 'error');
      }
    });
  }

  // Full Onboard & Register New Mess Form Submission (Tab 2)
  const fullOnboardForm = document.getElementById('fullOnboardForm');
  if (fullOnboardForm) {
    fullOnboardForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Read credentials
      const username = document.getElementById('onboardUsername').value.trim();
      const password = document.getElementById('onboardPassword').value;

      if (!username) {
        showToast('Please set an Owner Username for login.', 'error');
        return;
      }
      if (!password || password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }

      // Read mess info
      const name = document.getElementById('onboardMessName').value.trim();
      const ownerName = document.getElementById('onboardOwnerName').value.trim();
      const phone = document.getElementById('onboardPhone').value.trim();
      const whatsapp = (document.getElementById('onboardWhatsApp')?.value || phone).trim();
      const monthlyPrice = parseFloat(document.getElementById('onboardPrice').value) || 3000;
      const trialPrice = parseFloat(document.getElementById('onboardTrialPrice')?.value) || 100;
      const foodType = document.getElementById('onboardFoodType').value;

      const timingBreakfast = document.getElementById('onboardTimingBreakfast')?.value || '7:30 AM - 10:00 AM';
      const timingLunch = document.getElementById('onboardTimingLunch')?.value || '12:00 PM - 3:30 PM';
      const timingDinner = document.getElementById('onboardTimingDinner')?.value || '7:30 PM - 10:30 PM';

      const latitude = parseFloat(document.getElementById('onboardLatitude')?.value) || 18.5204;
      const longitude = parseFloat(document.getElementById('onboardLongitude')?.value) || 73.8567;
      const address = document.getElementById('onboardAddress').value.trim();
      const area = document.getElementById('onboardArea').value.trim();

      const lunchMenu = document.getElementById('onboardLunchMenu')?.value.trim();
      const specialDish = document.getElementById('onboardSpecialDish')?.value.trim();

      const facilities = Array.from(document.querySelectorAll('input[name="onboardFacility"]:checked')).map(cb => cb.value);

      const submitBtn = document.getElementById('btnSaveAsRegisteredMess');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Saving As Registered Mess...';
      }

      const payload = {
        name,
        ownerName,
        phone,
        whatsapp,
        email: `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@messfinder.com`,
        username,
        password,
        address,
        area,
        city: 'Pune',
        monthlyPrice,
        trialPrice,
        latitude,
        longitude,
        foodType,
        meals: {
          breakfast: { available: true, timing: timingBreakfast },
          lunch: { available: true, timing: timingLunch },
          dinner: { available: true, timing: timingDinner }
        },
        menu: {
          breakfast: ['Poha', 'Upma', 'Idli Sambhar', 'Special Tea'],
          lunch: lunchMenu ? lunchMenu.split(',').map(s => s.trim()).filter(Boolean) : ['4 Fresh Chapatis', 'Paneer Sabzi', 'Dal Tadka', 'Steamed Rice'],
          dinner: ['4 Warm Phulkas', 'Special Dal Fry', 'Jeera Rice', 'Sweet'],
          special: specialDish || 'Sunday Feast: Special Thali & Sweet'
        },
        facilities: facilities.length > 0 ? facilities : ['Unlimited Chapatis', 'RO Drinking Water', 'Clean Seating', 'Tiffin Service'],
        description: `${name} in ${area} serves freshly prepared, hygienic and nutritious home-style meals for students and bachelors. Managed with love by ${ownerName}.`
      };

      try {
        const res = await API.createMess(payload);
        const createdMess = res.data || payload;

        // Save owner account credentials locally for resilient offline auth
        const registeredOwners = JSON.parse(localStorage.getItem('messfinder_registered_owners') || '[]');
        registeredOwners.push({
          username,
          password,
          messId: createdMess._id || `mem_mess_${Date.now()}`,
          messName: name,
          ownerName,
          phone,
          email: payload.email,
          role: 'messOwner'
        });
        localStorage.setItem('messfinder_registered_owners', JSON.stringify(registeredOwners));

        // Save active user session
        UserAuth.setUser({
          messId: createdMess._id,
          messName: name,
          ownerName,
          username,
          phone,
          email: payload.email,
          role: 'messOwner',
          isAuthenticated: true
        });

        closeOnboardModal();
        showToast(`Mess "${name}" successfully registered! Opening your Owner Dashboard...`, 'success');
        setTimeout(() => {
          window.location.href = 'owner-dashboard.html';
        }, 700);
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '💾 Save As Registered Mess';
        }
        showToast(err.message || 'Failed to save mess. Please check all required fields.', 'error');
      }
    });
  }

  // Student Auth Modal Event Listeners
  const studentModalClose = document.getElementById('studentModalClose');
  if (studentModalClose) studentModalClose.addEventListener('click', closeStudentModal);

  const studentAuthModal = document.getElementById('studentAuthModal');
  if (studentAuthModal) {
    studentAuthModal.addEventListener('click', (e) => {
      if (e.target === studentAuthModal) closeStudentModal();
    });
  }

  // Auto open student modal if requested in URL
  if (window.location.search.includes('studentLogin=true')) {
    openStudentModal();
  }

  // Student Login Form Submission
  const studentLoginForm = document.getElementById('studentLoginForm');
  if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('studentLoginEmail').value.trim();
      const password = document.getElementById('studentLoginPass').value;

      if (!identifier || !password) {
        showToast('Please enter your Registered Mobile/Email and Password.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btnStudentLoginSubmit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Logging in...';
      }

      try {
        const res = await API.studentLogin(identifier, password);
        const studentUser = res.data;
        UserAuth.setUser({
          ...studentUser,
          role: 'student',
          isAuthenticated: true
        });
        closeStudentModal();
        showToast(`Welcome back, ${studentUser.name}! Logged in as student.`, 'success');

        // If on mess details page, update prefill
        const revName = document.getElementById('reviewUserName');
        const revCollege = document.getElementById('reviewUserCollege');
        if (revName) revName.value = studentUser.name;
        if (revCollege && studentUser.college) revCollege.value = studentUser.college;
      } catch (err) {
        showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🎓 Sign In as Student';
        }
      }
    });
  }

  // Student Register Form Submission
  const studentRegisterForm = document.getElementById('studentRegisterForm');
  if (studentRegisterForm) {
    studentRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('studentRegName').value.trim();
      const phone = document.getElementById('studentRegPhone').value.trim();
      const college = document.getElementById('studentRegCollege').value.trim();
      const email = (document.getElementById('studentRegEmail')?.value || '').trim();
      const password = document.getElementById('studentRegPass').value;

      if (!name) {
        showToast('Please enter your full name.', 'error');
        return;
      }
      if (!phone || phone.length < 10) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
      if (!password || password.length < 4) {
        showToast('Password must be at least 4 characters long.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btnStudentRegSubmit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating Account...';
      }

      try {
        const res = await API.studentRegister({
          name,
          phone,
          college: college || 'Student / Bachelor',
          email: email || `${phone}@messfinder.student`,
          password
        });
        const studentUser = res.data;
        UserAuth.setUser({
          ...studentUser,
          role: 'student',
          isAuthenticated: true
        });
        closeStudentModal();
        showToast(`Welcome to Mess Finder, ${studentUser.name}! Account registered successfully.`, 'success');

        // If on mess details page, update prefill
        const revName = document.getElementById('reviewUserName');
        const revCollege = document.getElementById('reviewUserCollege');
        if (revName) revName.value = studentUser.name;
        if (revCollege && studentUser.college) revCollege.value = studentUser.college;
      } catch (err) {
        showToast(err.message || 'Registration failed. Please verify your details.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '✨ Create Student Account';
        }
      }
    });
  }
});

window.showToast = showToast;
window.createMessCardHTML = createMessCardHTML;
window.UserAuth = UserAuth;
window.openOnboardModal = openOnboardModal;
window.closeOnboardModal = closeOnboardModal;
window.openStudentModal = openStudentModal;
window.closeStudentModal = closeStudentModal;
window.switchStudentTab = switchStudentTab;


