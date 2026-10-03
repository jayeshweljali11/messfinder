/**
 * Mess Finder - Mess Registration Script
 * Handles Owner Geolocation, Pin-picker map, form validation, and REST API submission
 */

let registerMap = null;
let registerMarker = null;

// Default initial coords (Pune center)
let defaultLat = 18.5204;
let defaultLng = 73.8567;

// Initialize Pin-picker Map
function initPickerMap(lat, lng) {
  const container = document.getElementById('pickerMap');
  if (!container || typeof L === 'undefined') return;

  if (registerMap) {
    registerMap.setView([lat, lng], 15);
    if (registerMarker) registerMarker.setLatLng([lat, lng]);
    return;
  }

  registerMap = L.map('pickerMap').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap | Mess Finder'
  }).addTo(registerMap);

  // Draggable marker
  registerMarker = L.marker([lat, lng], { draggable: true })
    .addTo(registerMap)
    .bindPopup('<b>Mess Location</b><br>Drag marker to adjust exact doorstep location')
    .openPopup();

  // Listen to drag event
  registerMarker.on('dragend', function (e) {
    const coord = e.target.getLatLng();
    setCoordinatesInputs(coord.lat, coord.lng);
  });

  // Also click anywhere on map to reposition marker
  registerMap.on('click', function (e) {
    registerMarker.setLatLng(e.latlng);
    setCoordinatesInputs(e.latlng.lat, e.latlng.lng);
  });
}

// Update coordinates inputs
function setCoordinatesInputs(lat, lng) {
  const latInput = document.getElementById('regLatitude');
  const lngInput = document.getElementById('regLongitude');
  if (latInput) latInput.value = Number(lat).toFixed(6);
  if (lngInput) lngInput.value = Number(lng).toFixed(6);
}

// Browser Geolocation for Owner
function useCurrentLocationForMess() {
  const btn = document.getElementById('btnUseCurrentLocation');
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Detecting GPS...';
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setCoordinatesInputs(lat, lng);
      initPickerMap(lat, lng);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📍</span> GPS Location Acquired!';
        btn.classList.add('btn-primary');
      }

      showToast('GPS coordinates set! You can drag the pin on the map to refine.', 'success');
    },
    (err) => {
      console.warn('Geolocation error:', err.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📍</span> Use My Current Location';
      }
      showToast('Could not fetch GPS automatically. You can click on the map to place your pin.', 'info');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// Food Type Radio Card Selector
function setupFoodTypeSelector() {
  const cards = document.querySelectorAll('.radio-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const val = card.dataset.value;
      const hiddenInput = document.getElementById('selectedFoodType');
      if (hiddenInput) hiddenInput.value = val;
    });
  });
}

// Handle Form Submission
async function handleMessRegistration(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btnSubmitMess');
  
  // Basic validation
  const name = document.getElementById('regName').value.trim();
  const ownerName = document.getElementById('regOwnerName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const whatsapp = document.getElementById('regWhatsApp').value.trim() || phone;
  const email = document.getElementById('regEmail').value.trim();
  const address = document.getElementById('regAddress').value.trim();
  const area = document.getElementById('regArea').value.trim();
  const city = document.getElementById('regCity').value.trim() || 'Pune';
  const pincode = document.getElementById('regPincode').value.trim();
  const latitude = parseFloat(document.getElementById('regLatitude').value);
  const longitude = parseFloat(document.getElementById('regLongitude').value);
  const foodType = document.getElementById('selectedFoodType').value;
  const monthlyPrice = parseFloat(document.getElementById('regMonthlyPrice').value);
  const trialPrice = parseFloat(document.getElementById('regTrialPrice').value) || 100;
  const description = document.getElementById('regDescription').value.trim();

  if (!name || !ownerName || !phone || !address || !area) {
    showToast('Please fill in all required fields (Name, Owner, Phone, Address, Area)', 'error');
    return;
  }

  if (isNaN(monthlyPrice) || monthlyPrice < 500) {
    showToast('Please specify a realistic monthly price (at least ₹500)', 'error');
    return;
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    showToast('Please set your mess location on the map or click Use My Current Location', 'error');
    return;
  }

  // Meals
  const breakfastChecked = document.getElementById('mealBreakfast')?.checked ?? true;
  const lunchChecked = document.getElementById('mealLunch')?.checked ?? true;
  const dinnerChecked = document.getElementById('mealDinner')?.checked ?? true;

  // Menus
  const breakfastMenu = document.getElementById('menuBreakfast')?.value.split('\n').map(s => s.trim()).filter(Boolean) || ["Poha", "Upma", "Tea"];
  const lunchMenu = document.getElementById('menuLunch')?.value.split('\n').map(s => s.trim()).filter(Boolean) || ["4 Chapatis", "Paneer/Veg Sabzi", "Dal", "Rice"];
  const dinnerMenu = document.getElementById('menuDinner')?.value.split('\n').map(s => s.trim()).filter(Boolean) || ["4 Rotis", "Special Curry", "Dal", "Jeera Rice"];
  const specialDish = document.getElementById('menuSpecial')?.value.trim() || "Sunday Special Feast Thali";

  // Facilities
  const facilities = [];
  document.querySelectorAll('input[name="facilities"]:checked').forEach(cb => {
    facilities.push(cb.value);
  });
  if (facilities.length === 0) {
    facilities.push('RO Drinking Water', 'Unlimited Chapatis', 'Hygienic Dining');
  }

  // Curated Image selection or custom URL
  const customImgUrl = document.getElementById('regImageUrl')?.value.trim();
  const selectedPreset = document.querySelector('input[name="presetImage"]:checked')?.value;
  
  const images = [];
  if (customImgUrl) images.push(customImgUrl);
  if (selectedPreset) images.push(selectedPreset);
  if (images.length === 0) {
    images.push("https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80");
  }

  const payload = {
    name,
    ownerName,
    phone,
    whatsapp,
    email,
    address,
    area,
    city,
    pincode,
    latitude,
    longitude,
    foodType,
    monthlyPrice,
    trialPrice,
    meals: {
      breakfast: { available: breakfastChecked, timing: document.getElementById('timingBreakfast')?.value || '7:30 AM - 10:00 AM' },
      lunch: { available: lunchChecked, timing: document.getElementById('timingLunch')?.value || '12:00 PM - 3:30 PM' },
      dinner: { available: dinnerChecked, timing: document.getElementById('timingDinner')?.value || '7:30 PM - 10:30 PM' }
    },
    menu: {
      breakfast: breakfastMenu,
      lunch: lunchMenu,
      dinner: dinnerMenu,
      special: specialDish
    },
    facilities,
    description: description || 'Home-style fresh cooking with daily quality ingredients for students and bachelors.',
    images
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Registering Your Mess...';
  }

  try {
    const res = await API.createMess(payload);
    const newMess = res.data;

    // Show Success Modal
    const modal = document.getElementById('regSuccessModal');
    if (modal) {
      modal.classList.add('open');
      const viewMessBtn = document.getElementById('btnViewCreatedMess');
      if (viewMessBtn && newMess?._id) {
        viewMessBtn.href = `mess-details.html?id=${newMess._id}`;
      }
    }

    showToast('Your mess has been registered successfully!', 'success');

  } catch (err) {
    console.error('Registration failed:', err);
    showToast(err.message || 'Failed to register mess. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Register My Mess';
    }
  }
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  const regForm = document.getElementById('registerMessForm');
  if (!regForm) return;

  // Setup GPS Button
  const btnGPS = document.getElementById('btnUseCurrentLocation');
  if (btnGPS) {
    btnGPS.addEventListener('click', useCurrentLocationForMess);
  }

  // Setup Food Type Selector
  setupFoodTypeSelector();

  // Setup Map
  setCoordinatesInputs(defaultLat, defaultLng);
  initPickerMap(defaultLat, defaultLng);

  // Setup Form Submit
  regForm.addEventListener('submit', handleMessRegistration);
});
