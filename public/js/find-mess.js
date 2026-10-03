/**
 * Mess Finder - Nearby Mess Discovery & Interactive Map
 * Handles browser Geolocation, Leaflet OpenStreetMap, live filtering, and Haversine distance
 */

// Global State
let currentPosition = {
  // Default to Pune Student Hub (MIT / Kothrud)
  lat: 18.5074,
  lng: 73.8077,
  areaName: 'Kothrud, Pune (MIT Campus Area)'
};

let map = null;
let userMarker = null;
let messMarkers = [];
let allNearbyMesses = [];

// Area Presets for quick student campus exploration
const CAMPUS_PRESETS = {
  'panchavati': { lat: 19.8429, lng: 73.9948, name: 'Panchavati (Nashik Campus Area)' },
  'sinnar': { lat: 19.8491, lng: 73.9984, name: 'Sinnar (Devi Road / College Area)' },
  'fcroad': { lat: 18.5284, lng: 73.8443, name: 'FC Road / Shivaji Nagar (Fergusson/COEP)' },
  'kothrud': { lat: 18.5074, lng: 73.8077, name: 'Kothrud (MIT World Peace Univ)' },
  'karvenagar': { lat: 18.4912, lng: 73.8214, name: 'Karve Nagar (Cummins College)' },
  'katraj': { lat: 18.4482, lng: 73.8583, name: 'Katraj (Bharati Vidyapeeth / PICT)' },
  'vimannagar': { lat: 18.5679, lng: 73.9143, name: 'Viman Nagar (Symbiosis Campus)' },
  'baner': { lat: 18.5590, lng: 73.7868, name: 'Baner / Balewadi (NICMAR / High St)' },
  'aundh': { lat: 18.5580, lng: 73.8074, name: 'Aundh (Pune University Road)' }
};

// Initialize Leaflet Map
function initMap(lat, lng) {
  const mapElement = document.getElementById('messMap');
  if (!mapElement) return;

  if (map) {
    map.setView([lat, lng], 14);
    updateUserMarker(lat, lng);
    return;
  }

  // Initialize Leaflet instance
  map = L.map('messMap', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([lat, lng], 14);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors | Mess Finder'
  }).addTo(map);

  updateUserMarker(lat, lng);
}

// Update or create User location marker
function updateUserMarker(lat, lng) {
  if (!map) return;

  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    // Custom user pulse marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="position: absolute; width: 20px; height: 20px; background: #3b82f6; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
          <div style="position: absolute; -10px; left: -10px; width: 40px; height: 40px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); animation: pulse 2s infinite;"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<b>📍 You Are Here</b><br><small style="color: #64748b;">${currentPosition.areaName}</small>`);
  }
}

// Place markers for messes on map
function renderMapMarkers(messes) {
  if (!map) return;

  // Clear existing mess markers
  messMarkers.forEach(m => map.removeLayer(m));
  messMarkers = [];

  const bounds = L.latLngBounds([[currentPosition.lat, currentPosition.lng]]);

  messes.forEach(mess => {
    if (!mess.location || !mess.location.coordinates) return;

    const [lng, lat] = mess.location.coordinates;
    bounds.extend([lat, lng]);

    // Color marker depending on veg / nonveg
    const isVeg = mess.foodType === 'Veg';
    const isNonVeg = mess.foodType === 'Non-Veg';
    const markerColor = isVeg ? '#16a34a' : (isNonVeg ? '#dc2626' : '#d97706');

    const messIcon = L.divIcon({
      className: 'mess-map-pin',
      html: `
        <div style="
          background: #ffffff;
          border: 2px solid ${markerColor};
          color: ${markerColor};
          border-radius: 20px;
          padding: 4px 8px;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>🍲</span> ₹${mess.monthlyPrice}
        </div>
      `,
      iconSize: [60, 26],
      iconAnchor: [30, 13]
    });

    const popupHtml = `
      <div class="popup-mess-card">
        <img src="${mess.images && mess.images[0] ? mess.images[0] : ''}" class="popup-img" alt="${mess.name}" />
        <div class="popup-info">
          <div class="popup-title">${mess.name}</div>
          <div class="popup-meta">
            <span style="color: #d97706; font-weight: bold;">★ ${mess.rating ? mess.rating.toFixed(1) : '4.5'}</span>
            <span class="popup-price">₹${mess.monthlyPrice}/mo</span>
            ${mess.distance !== undefined ? `<span style="color: #059669; font-weight: 600;">📍 ${mess.distance} km</span>` : ''}
          </div>
          <a href="mess-details.html?id=${mess._id}" class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.8rem; padding: 0.35rem 0.6rem;">
            View Details
          </a>
        </div>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: messIcon })
      .addTo(map)
      .bindPopup(popupHtml, { className: 'custom-map-popup' });

    messMarkers.push(marker);
  });

  // Fit bounds if markers exist
  if (messes.length > 0 && map) {
    try {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } catch (e) {}
  }
}

// Fetch Nearby Messes from Backend API
async function loadNearbyMesses() {
  const container = document.getElementById('nearbyMessesList');
  const countBadge = document.getElementById('resultsCountBadge');
  if (!container) return;

  // Show Skeleton shimmer
  container.innerHTML = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  `;

  // Read current filter values
  const radius = document.getElementById('filterDistance')?.value || 'all';
  const foodType = document.getElementById('filterFood')?.value || 'All';
  const priceRange = document.getElementById('filterPrice')?.value || 'All';
  const rating = document.getElementById('filterRating')?.value || 'All';
  const mealType = document.getElementById('filterMeal')?.value || 'All';
  const search = document.getElementById('searchInput')?.value || '';
  const sortBy = document.getElementById('sortBy')?.value || 'distance';

  const filterParams = {};
  if (foodType !== 'All') filterParams.foodType = foodType;
  if (rating !== 'All') filterParams.minRating = rating;
  if (mealType !== 'All') filterParams.mealType = mealType;
  if (search.trim()) filterParams.search = search.trim();

  // Price range handling
  if (priceRange === 'under2000') {
    filterParams.maxPrice = 2000;
  } else if (priceRange === '2000-3000') {
    filterParams.minPrice = 2000;
    filterParams.maxPrice = 3000;
  } else if (priceRange === '3000-4000') {
    filterParams.minPrice = 3000;
    filterParams.maxPrice = 4000;
  } else if (priceRange === 'above4000') {
    filterParams.minPrice = 4000;
  }

  try {
    const res = await API.getNearbyMesses(
      currentPosition.lat,
      currentPosition.lng,
      radius === 'all' ? 5000 : radius,
      filterParams
    );

    let messes = res.data || [];

    // Client-side sorting
    if (sortBy === 'distance') {
      messes.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'price-low') {
      messes.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    } else if (sortBy === 'price-high') {
      messes.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
    } else if (sortBy === 'rating') {
      messes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    allNearbyMesses = messes;

    // Update count badge
    if (countBadge) {
      countBadge.innerText = `${messes.length} Messes Found`;
    }

    // Render cards
    if (messes.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">🍲</div>
          <h3 class="empty-title">No messes found nearby</h3>
          <p class="empty-desc">
            We couldn't find any mess matching your current filters within ${radius === 'all' ? 'any radius' : radius + ' km'}. Try increasing the radius or clearing filters!
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <button onclick="resetFilters()" class="btn btn-secondary">Clear Filters</button>
            <a href="register-mess.html" class="btn btn-primary">
              Own a Mess? Register Your Mess
            </a>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = messes.map(m => createMessCardHTML(m)).join('');
    }

    // Update Map
    renderMapMarkers(messes);

  } catch (err) {
    console.error('Failed to load nearby messes:', err);
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Something went wrong</h3>
        <p class="empty-desc">${err.message || 'Unable to fetch nearby messes. Please ensure the backend server is running.'}</p>
        <button onclick="loadNearbyMesses()" class="btn btn-primary">Try Again</button>
      </div>
    `;
  }
}

// Trigger Live Browser Geolocation (Zero cached age, live satellite detection)
function detectUserLocation() {
  const locBadge = document.getElementById('currentLocationText');
  const gpsBtn = document.getElementById('detectLocationBtn');

  if (!navigator.geolocation) {
    showToast('Live Geolocation is not supported by your browser', 'error');
    return;
  }

  if (locBadge) {
    locBadge.innerHTML = '<span>📡</span> <b>Locking Live GPS Satellites...</b> (Please allow browser access)';
  }
  if (gpsBtn) {
    gpsBtn.disabled = true;
    gpsBtn.innerHTML = '<span>⏳</span> Locating...';
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      const accuracy = Math.round(position.coords.accuracy);

      let detectedArea = `Live GPS (${lat}, ${lng})`;

      // Reverse geocode to get real street/locality
      try {
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (rev.ok) {
          const revData = await rev.json();
          if (revData && revData.address) {
            const area = revData.address.suburb || revData.address.neighbourhood || revData.address.residential || revData.address.city_district || '';
            const city = revData.address.city || revData.address.town || 'Pune';
            if (area) {
              detectedArea = `${area}, ${city}`;
            }
          }
        }
      } catch (e) {
        console.warn('Geocoding note:', e);
      }

      currentPosition = {
        lat,
        lng,
        areaName: `${detectedArea} (±${accuracy}m)`
      };

      if (locBadge) {
        locBadge.innerHTML = `<span>🟢</span> <b>Live Location:</b> ${detectedArea} <span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 999px; border: 1px solid #a7f3d0; margin-left: 0.4rem;">Live GPS ±${accuracy}m</span>`;
      }
      if (gpsBtn) {
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = '<span>📡</span> Detect My GPS Location';
      }

      showToast(`Live GPS locked! Finding nearest messes to ${detectedArea}...`, 'success');

      initMap(lat, lng);
      loadNearbyMesses();
    },
    (error) => {
      console.warn('Geolocation denied or error:', error.message);
      if (gpsBtn) {
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = '<span>📡</span> Detect My GPS Location';
      }

      let msg = 'Live location access timed out or was denied.';
      if (error.code === 1) {
        msg = 'Location permission was denied. Please enable location permissions in browser settings.';
      }
      
      if (locBadge) {
        locBadge.innerHTML = `<span>📍</span> Location: <b>${currentPosition.areaName}</b>`;
      }

      showToast(msg, 'error');

      // Default fallback
      initMap(currentPosition.lat, currentPosition.lng);
      loadNearbyMesses();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// Select Campus / Area Preset
function selectCampusPreset(presetKey) {
  const preset = CAMPUS_PRESETS[presetKey];
  if (!preset) return;

  currentPosition = {
    lat: preset.lat,
    lng: preset.lng,
    areaName: preset.name
  };

  const locBadge = document.getElementById('currentLocationText');
  if (locBadge) {
    locBadge.innerHTML = `<span>📍</span> Exploring: <b>${preset.name}</b>`;
  }

  // Update active pill
  document.querySelectorAll('.area-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.campus === presetKey);
  });

  showToast(`Location set to ${preset.name}`);

  initMap(preset.lat, preset.lng);
  loadNearbyMesses();
}

// Reset all filter inputs
function resetFilters() {
  const filterDistance = document.getElementById('filterDistance');
  const filterFood = document.getElementById('filterFood');
  const filterPrice = document.getElementById('filterPrice');
  const filterRating = document.getElementById('filterRating');
  const filterMeal = document.getElementById('filterMeal');
  const searchInput = document.getElementById('searchInput');

  if (filterDistance) filterDistance.value = 'all';
  if (filterFood) filterFood.value = 'All';
  if (filterPrice) filterPrice.value = 'All';
  if (filterRating) filterRating.value = 'All';
  if (filterMeal) filterMeal.value = 'All';
  if (searchInput) searchInput.value = '';

  loadNearbyMesses();
}

// Event Listeners on Discovery Page
document.addEventListener('DOMContentLoaded', () => {
  // Check if find-mess page
  if (!document.getElementById('messMap')) return;

  // Bind GPS button
  const gpsBtn = document.getElementById('detectLocationBtn');
  if (gpsBtn) gpsBtn.addEventListener('click', detectUserLocation);

  // Bind Campus presets
  document.querySelectorAll('.area-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectCampusPreset(pill.dataset.campus);
    });
  });

  // Bind Filter Changes
  ['filterDistance', 'filterFood', 'filterPrice', 'filterRating', 'filterMeal', 'sortBy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', loadNearbyMesses);
  });

  // Search input debounce
  const searchInput = document.getElementById('searchInput');
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadNearbyMesses, 350);
    });
  }

  // Check URL params (e.g. ?campus=kothrud or ?autoDetect=true)
  const urlParams = new URLSearchParams(window.location.search);
  const campusParam = urlParams.get('campus');
  const autoDetect = urlParams.get('autoDetect');

  if (campusParam && CAMPUS_PRESETS[campusParam]) {
    selectCampusPreset(campusParam);
  } else if (autoDetect === 'true') {
    detectUserLocation();
  } else {
    // Default initial load
    initMap(currentPosition.lat, currentPosition.lng);
    loadNearbyMesses();
  }
});
