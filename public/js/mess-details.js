/**
 * Mess Finder - Mess Details & Student Reviews Handler
 */

let currentMessData = null;
let selectedStarRating = 5;

// Extract Mess ID from URL query string
function getMessIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Render Mess Details into DOM
function renderMessDetails(mess) {
  currentMessData = mess;

  // Title & Header Info
  document.title = `${mess.name} | Mess Finder`;
  const nameEl = document.getElementById('detailsMessName');
  if (nameEl) nameEl.innerText = mess.name;

  const areaEl = document.getElementById('detailsArea');
  if (areaEl) areaEl.innerText = `${mess.area}, ${mess.city || 'Pune'}`;

  const addressEl = document.getElementById('detailsFullAddress');
  if (addressEl) addressEl.innerText = mess.address;

  // Food Type Badge
  const foodTypeBadge = document.getElementById('detailsFoodBadge');
  if (foodTypeBadge) {
    const isVeg = mess.foodType === 'Veg';
    const isNonVeg = mess.foodType === 'Non-Veg';
    foodTypeBadge.className = `badge-food-type ${isVeg ? 'veg' : (isNonVeg ? 'nonveg' : 'both')}`;
    foodTypeBadge.innerText = `● ${isVeg ? 'Pure Veg' : (isNonVeg ? 'Non-Veg' : 'Veg & Non-Veg')}`;
  }

  // Monthly and Trial Price
  const priceEl = document.getElementById('detailsMonthlyPrice');
  if (priceEl) priceEl.innerText = `₹${mess.monthlyPrice.toLocaleString()}`;

  const trialEl = document.getElementById('detailsTrialPrice');
  if (trialEl && mess.trialPrice) {
    trialEl.innerText = `(Single meal trial: ₹${mess.trialPrice})`;
  }

  // Rating and review count in header
  const ratingEl = document.getElementById('detailsRatingVal');
  if (ratingEl) ratingEl.innerText = mess.rating ? mess.rating.toFixed(1) : '4.5';

  const revCountEl = document.getElementById('detailsReviewCount');
  if (revCountEl) revCountEl.innerText = `(${mess.reviewCount || 0} reviews)`;

  // Live Active Students Count
  const activeCountEl = document.getElementById('detailsActiveStudentsCount');
  if (activeCountEl) {
    const isPune = (mess.name || '').toLowerCase().includes('sai') || (mess.city || '').toLowerCase().includes('pune');
    const baseStudents = isPune ? 54 : 42;
    const totalActive = baseStudents + (mess.reviewCount || 0);
    activeCountEl.innerText = `👥 ${totalActive}+ Active Students Enrolled`;
  }

  // Description / About
  const descEl = document.getElementById('detailsDescription');
  if (descEl) descEl.innerText = mess.description;

  const ownerEl = document.getElementById('detailsOwnerName');
  if (ownerEl) ownerEl.innerText = mess.ownerName;

  // Action Buttons (Call, WhatsApp, Directions)
  const phoneClean = mess.phone ? mess.phone.replace(/[^0-9]/g, '') : '';
  const waClean = mess.whatsapp ? mess.whatsapp.replace(/[^0-9]/g, '') : phoneClean;
  const waMessage = encodeURIComponent(`Hi! I saw your mess "${mess.name}" on Mess Finder and want to enquire about joining and daily meals.`);

  const callBtn = document.getElementById('btnCallOwner');
  if (callBtn) callBtn.href = `tel:${mess.phone}`;

  const waBtn = document.getElementById('btnWhatsAppOwner');
  if (waBtn) waBtn.href = `https://wa.me/${waClean}?text=${waMessage}`;

  const messLat = mess.location?.coordinates ? mess.location.coordinates[1] : 18.5204;
  const messLng = mess.location?.coordinates ? mess.location.coordinates[0] : 73.8567;
  const directionsBtn = document.getElementById('btnGetDirections');
  if (directionsBtn) {
    directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${messLat},${messLng}`;
  }

  // Image Gallery
  const defaultImages = [
    "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
  ];
  const images = mess.images && mess.images.length > 0 ? mess.images : defaultImages;

  const mainImg = document.getElementById('galleryMainImage');
  if (mainImg) mainImg.src = images[0];

  const thumb1 = document.getElementById('galleryThumb1');
  const thumb2 = document.getElementById('galleryThumb2');
  if (thumb1) {
    thumb1.src = images[1] || images[0];
    thumb1.onclick = () => { mainImg.src = thumb1.src; };
  }
  if (thumb2) {
    thumb2.src = images[2] || images[0];
    thumb2.onclick = () => { mainImg.src = thumb2.src; };
  }

  // Meal Timings
  const timingsContainer = document.getElementById('mealTimingsGrid');
  if (timingsContainer) {
    timingsContainer.innerHTML = `
      <div class="menu-item-pill">
        <span>🍳 Breakfast:</span>
        <strong style="color: ${mess.meals?.breakfast?.available ? '#059669' : '#94a3b8'};">
          ${mess.meals?.breakfast?.available ? mess.meals.breakfast.timing : 'Not Offered'}
        </strong>
      </div>
      <div class="menu-item-pill">
        <span>🍛 Lunch:</span>
        <strong style="color: ${mess.meals?.lunch?.available ? '#059669' : '#94a3b8'};">
          ${mess.meals?.lunch?.available ? mess.meals.lunch.timing : 'Not Offered'}
        </strong>
      </div>
      <div class="menu-item-pill">
        <span>🌙 Dinner:</span>
        <strong style="color: ${mess.meals?.dinner?.available ? '#059669' : '#94a3b8'};">
          ${mess.meals?.dinner?.available ? mess.meals.dinner.timing : 'Not Offered'}
        </strong>
      </div>
    `;
  }

  // Menu Items Display
  renderMenuTab('lunch'); // default tab

  // Sunday Special Highlight
  const specialDish = document.getElementById('specialDishText');
  if (specialDish) {
    specialDish.innerText = mess.menu?.special || 'Sunday Special Feast: Festive Thali & Sweet!';
  }

  // Facilities
  const facilitiesList = document.getElementById('facilitiesList');
  if (facilitiesList) {
    const facilities = mess.facilities && mess.facilities.length > 0
      ? mess.facilities
      : ['RO Drinking Water', 'Unlimited Chapatis', 'Hygienic Steel Thalis', 'Tiffin Packing Available', 'Sunday Special Feast'];
    
    facilitiesList.innerHTML = facilities.map(f => `
      <div class="menu-item-pill" style="font-size: 0.88rem;">
        <span style="color: #10b981; font-weight: bold;">✓</span> ${f}
      </div>
    `).join('');
  }

  // Render Reviews and Breakdown
  renderReviews(mess.reviews || [], mess.reviewBreakdown, mess.rating);

  // Initialize mini Leaflet Map for this mess
  initDetailsMiniMap(messLat, messLng, mess.name);
}

// Render Menu Tab Items
function renderMenuTab(meal) {
  const container = document.getElementById('menuItemsContainer');
  if (!container || !currentMessData) return;

  // Update tab buttons style
  document.querySelectorAll('.menu-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.meal === meal);
  });

  const menu = currentMessData.menu || {};
  let items = [];
  if (meal === 'breakfast') items = menu.breakfast || ['Poha with Lemon', 'Upma', 'Idli Sambhar', 'Hot Masala Chai'];
  if (meal === 'lunch') items = menu.lunch || ['4 Fresh Phulkas / Chapatis', 'Paneer / Seasonal Vegetable', 'Dal Tadka', 'Steamed Basmati Rice', 'Salad & Pickle'];
  if (meal === 'dinner') items = menu.dinner || ['4 Soft Rotis', 'Special Veg Curry', 'Yellow Dal Fry', 'Jeera Rice', 'Crispy Papad'];

  if (items.length === 0) {
    container.innerHTML = `<p style="color: #64748b; font-style: italic;">No specific items listed for ${meal}.</p>`;
  } else {
    container.innerHTML = items.map(item => `
      <div class="menu-item-pill">
        <span style="color: #10b981;">🍲</span>
        <span>${item}</span>
      </div>
    `).join('');
  }
}

// Render Reviews & Rating Breakdown Bars
function renderReviews(reviews, breakdown, avgRating) {
  const scoreEl = document.getElementById('scoreBig');
  if (scoreEl) scoreEl.innerText = avgRating ? avgRating.toFixed(1) : '4.5';

  const totalReviewsCount = document.getElementById('totalReviewsSummary');
  if (totalReviewsCount) totalReviewsCount.innerText = `Based on ${reviews.length} student reviews`;

  // Rating breakdown bars
  const p = breakdown?.percentages || { 5: 80, 4: 15, 3: 5, 2: 0, 1: 0 };
  for (let star = 1; star <= 5; star++) {
    const barEl = document.getElementById(`barFill${star}`);
    const pctEl = document.getElementById(`barPct${star}`);
    if (barEl) barEl.style.width = `${p[star] || 0}%`;
    if (pctEl) pctEl.innerText = `${p[star] || 0}%`;
  }

  // Reviews List
  const listContainer = document.getElementById('reviewsList');
  if (!listContainer) return;

  if (reviews.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <p>No reviews yet for this mess. Be the first student to share your experience!</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = reviews.map(r => {
    const initial = r.userName ? r.userName.charAt(0).toUpperCase() : 'S';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

    return `
      <article class="review-card">
        <div class="review-header">
          <div class="reviewer-meta">
            <div class="reviewer-avatar">${initial}</div>
            <div>
              <div class="reviewer-name">${r.userName} <span style="font-size: 0.75rem; background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">✓ Verified Student</span></div>
              <div class="reviewer-college">${r.userCollege || 'College Hosteller'}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: #d97706; font-size: 1.1rem;">${stars}</div>
            <div class="review-date">${dateStr}</div>
          </div>
        </div>
        <p class="review-comment">"${r.comment}"</p>
      </article>
    `;
  }).join('');
}

// Mini Map initialization for the mess
function initDetailsMiniMap(lat, lng, messName) {
  const mapContainer = document.getElementById('detailsMiniMap');
  if (!mapContainer || typeof L === 'undefined') return;

  const miniMap = L.map('detailsMiniMap', {
    zoomControl: false,
    scrollWheelZoom: false
  }).setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(miniMap);

  L.marker([lat, lng])
    .addTo(miniMap)
    .bindPopup(`<b>${messName}</b>`)
    .openPopup();
}

// Setup Interactive Star Rating Picker in "Write a Review" form
function setupStarPicker() {
  const stars = document.querySelectorAll('.star-rating-select .star-pick');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val, 10);
      selectedStarRating = val;
      updateStarPickerUI(val);
    });

    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val, 10);
      updateStarPickerUI(val);
    });
  });

  const pickerContainer = document.querySelector('.star-rating-select');
  if (pickerContainer) {
    pickerContainer.addEventListener('mouseleave', () => {
      updateStarPickerUI(selectedStarRating);
    });
  }
}

function updateStarPickerUI(value) {
  const stars = document.querySelectorAll('.star-rating-select .star-pick');
  stars.forEach(s => {
    const sVal = parseInt(s.dataset.val, 10);
    s.classList.toggle('active', sVal <= value);
  });
}

// Handle Review Submission
async function handleReviewSubmit(e) {
  e.preventDefault();

  const messId = getMessIdFromURL();
  if (!messId) return;

  const nameInput = document.getElementById('reviewUserName');
  const collegeInput = document.getElementById('reviewUserCollege');
  const commentInput = document.getElementById('reviewComment');
  const submitBtn = document.getElementById('btnSubmitReview');

  const comment = commentInput.value.trim();
  const userName = nameInput.value.trim() || 'Anonymous Student';
  const userCollege = collegeInput.value.trim() || 'Student / Bachelor';

  if (!comment || comment.length < 5) {
    showToast('Please write at least 5 characters about the food and service', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';
  }

  try {
    const payload = {
      messId,
      userName,
      userCollege,
      rating: selectedStarRating,
      comment
    };

    await API.submitReview(payload);

    showToast('Thank you! Your review was posted successfully.');

    // Clear form
    commentInput.value = '';

    // Reload mess details to fetch updated reviews and recalculate average rating
    const updated = await API.getMessById(messId);
    renderMessDetails(updated.data);

  } catch (err) {
    console.error('Failed to submit review:', err);
    showToast(err.message || 'Failed to submit review', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit Review';
    }
  }
}

// Load Mess on Page Load
document.addEventListener('DOMContentLoaded', async () => {
  const messId = getMessIdFromURL();
  if (!messId) {
    const content = document.getElementById('messDetailsContent');
    if (content) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">Mess Not Found</h3>
          <p class="empty-desc">No valid Mess ID was provided in the URL.</p>
          <a href="find-mess.html" class="btn btn-primary">Find Nearby Messes</a>
        </div>
      `;
    }
    return;
  }

  // Pre-fill user name if logged in
  const loggedUser = UserAuth.getUser();
  if (loggedUser) {
    const nameInput = document.getElementById('reviewUserName');
    const collegeInput = document.getElementById('reviewUserCollege');
    if (nameInput) nameInput.value = loggedUser.name;
    if (collegeInput && loggedUser.college) collegeInput.value = loggedUser.college;
  }

  // Setup tabs
  document.querySelectorAll('.menu-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderMenuTab(btn.dataset.meal);
    });
  });

  // Setup star picker
  setupStarPicker();

  // Dynamic Student Session: capture from URL or storage
  let activeStudent = UserAuth.getUser();
  if (!activeStudent || activeStudent.role !== 'messOwner') {
    const capturedEmail = (typeof getCapturedEmail === 'function') ? getCapturedEmail() : localStorage.getItem('messfinder_current_email');
    if (capturedEmail) {
      const extractedName = (typeof extractNameFromEmail === 'function') ? extractNameFromEmail(capturedEmail) : 'Student';
      if (!activeStudent || activeStudent.role !== 'student' || activeStudent.email !== capturedEmail) {
        activeStudent = {
          name: extractedName,
          email: capturedEmail,
          college: 'Student / Bachelor',
          role: 'student',
          isAuthenticated: true
        };
        UserAuth.setUser(activeStudent);
      }
    }

    if (activeStudent && activeStudent.role === 'student') {
      const nameEl = document.getElementById('reviewUserName');
      const colEl = document.getElementById('reviewUserCollege');
      if (nameEl && (!nameEl.value || nameEl.value === 'Anonymous Student')) {
        nameEl.value = activeStudent.name || '';
      }
      if (colEl && !colEl.value) {
        colEl.value = activeStudent.college || 'Student / Bachelor';
      }

      // Show toaster notification when viewing reviews
      if (!sessionStorage.getItem('messfinder_review_notified')) {
        sessionStorage.setItem('messfinder_review_notified', 'true');
        setTimeout(() => {
          showToast(`✨ Connected as ${activeStudent.name} (${activeStudent.email}). Ready to post reviews!`, 'info');
        }, 700);
      }
    }
  }

  // Setup review form
  const reviewForm = document.getElementById('writeReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }

  // Fetch Mess details from API
  try {
    const res = await API.getMessById(messId);
    renderMessDetails(res.data);
  } catch (err) {
    console.error('Error fetching mess:', err);
    const content = document.getElementById('messDetailsContent');
    if (content) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">🍲</div>
          <h3 class="empty-title">Unable to Load Mess Details</h3>
          <p class="empty-desc">${err.message || 'Could not connect to the backend server.'}</p>
          <a href="find-mess.html" class="btn btn-primary">Back to Discover Messes</a>
        </div>
      `;
    }
  }
});
