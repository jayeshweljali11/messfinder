const { DataStore } = require('../data/store');

// @desc    Get all messes with optional filtering
// @route   GET /api/messes
exports.getAllMesses = async (req, res, next) => {
  try {
    const { search, foodType, maxPrice, minRating } = req.query;
    const messes = await DataStore.getAllMesses({ search, foodType, maxPrice, minRating });
    res.status(200).json({
      success: true,
      count: messes.length,
      data: messes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby messes using latitude and longitude
// @route   GET /api/messes/nearby?lat=&lng=&radius=
exports.getNearbyMesses = async (req, res, next) => {
  try {
    const { lat, lng, radius, foodType, maxPrice, minPrice, minRating, mealType, search } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both latitude (lat) and longitude (lng) query parameters'
      });
    }

    const radiusKm = radius ? parseFloat(radius) : 10;
    const nearbyMesses = await DataStore.getNearbyMesses(lat, lng, radiusKm, {
      foodType,
      maxPrice,
      minPrice,
      minRating,
      mealType,
      search
    });

    res.status(200).json({
      success: true,
      origin: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      },
      radiusKm,
      count: nearbyMesses.length,
      data: nearbyMesses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mess by ID with reviews breakdown
// @route   GET /api/messes/:id
exports.getMessById = async (req, res, next) => {
  try {
    const mess = await DataStore.getMessById(req.params.id);
    if (!mess) {
      return res.status(404).json({
        success: false,
        message: `Mess not found with ID ${req.params.id}`
      });
    }

    const reviews = await DataStore.getReviewsForMess(req.params.id);

    // Calculate rating breakdown (counts and percentages)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    const totalReviews = reviews.length;
    const breakdownPercentages = {
      5: totalReviews > 0 ? Math.round((breakdown[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((breakdown[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((breakdown[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((breakdown[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((breakdown[1] / totalReviews) * 100) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...mess,
        reviews,
        reviewBreakdown: {
          counts: breakdown,
          percentages: breakdownPercentages,
          total: totalReviews
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new mess
// @route   POST /api/messes
exports.createMess = async (req, res, next) => {
  try {
    const {
      name,
      ownerName,
      phone,
      whatsapp,
      email,
      username,
      password,
      address,
      area,
      city,
      pincode,
      latitude,
      longitude,
      foodType,
      monthlyPrice,
      trialPrice,
      meals,
      menu,
      facilities,
      description,
      images
    } = req.body;

    // Validation
    if (!name || !ownerName || !phone || !address || !area) {
      return res.status(400).json({
        success: false,
        message: 'Name, owner name, phone, address, and area are required fields'
      });
    }

    if (!foodType || !['Veg', 'Non-Veg', 'Both'].includes(foodType)) {
      return res.status(400).json({
        success: false,
        message: 'Food type must be Veg, Non-Veg, or Both'
      });
    }

    if (!monthlyPrice || isNaN(Number(monthlyPrice)) || Number(monthlyPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive monthly price is required'
      });
    }

    // Coordinates parsing: default to Pune college center if missing
    let parsedLat = parseFloat(latitude);
    let parsedLng = parseFloat(longitude);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      // Default to central student area (Shivaji Nagar, Pune)
      parsedLat = 18.5284;
      parsedLng = 73.8443;
    }

    // Curated high quality food images fallback if none provided
    const defaultImages = [
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
    ];

    const messPayload = {
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : phone.trim(),
      email: email ? email.trim() : '',
      username: username ? username.trim() : '',
      password: password || '',
      address: address.trim(),
      area: area.trim(),
      city: (city || 'Pune').trim(),
      pincode: (pincode || '411001').trim(),
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat] // GeoJSON format: [longitude, latitude]
      },
      foodType,
      monthlyPrice: Number(monthlyPrice),
      trialPrice: trialPrice ? Number(trialPrice) : 100,
      meals: {
        breakfast: {
          available: meals?.breakfast !== false && meals?.breakfast !== 'false',
          timing: meals?.breakfastTiming || '7:30 AM - 10:00 AM'
        },
        lunch: {
          available: meals?.lunch !== false && meals?.lunch !== 'false',
          timing: meals?.lunchTiming || '12:00 PM - 3:30 PM'
        },
        dinner: {
          available: meals?.dinner !== false && meals?.dinner !== 'false',
          timing: meals?.dinnerTiming || '7:30 PM - 10:30 PM'
        }
      },
      menu: {
        breakfast: Array.isArray(menu?.breakfast) ? menu.breakfast : (typeof menu?.breakfast === 'string' ? menu.breakfast.split(',').map(s => s.trim()).filter(Boolean) : ["Poha", "Upma", "Tea"]),
        lunch: Array.isArray(menu?.lunch) ? menu.lunch : (typeof menu?.lunch === 'string' ? menu.lunch.split(',').map(s => s.trim()).filter(Boolean) : ["4 Chapatis", "Seasonal Sabzi", "Dal Tadka", "Steamed Rice"]),
        dinner: Array.isArray(menu?.dinner) ? menu.dinner : (typeof menu?.dinner === 'string' ? menu.dinner.split(',').map(s => s.trim()).filter(Boolean) : ["4 Phulkas", "Special Bhaji", "Dal Fry", "Jeera Rice"]),
        special: menu?.special || "Sunday Special: Feast Thali & Sweet"
      },
      facilities: Array.isArray(facilities)
        ? facilities
        : (typeof facilities === 'string' ? facilities.split(',').map(s => s.trim()).filter(Boolean) : ["RO Drinking Water", "Hygienic Kitchen", "Tiffin Service", "Seating Space"]),
      description: description ? description.trim() : 'Fresh, healthy, and hygienic home-style food prepared daily for students and bachelors.',
      images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
      rating: 4.8,
      reviewCount: 1,
      isVerified: true,
      createdAt: new Date()
    };

    const newMess = await DataStore.createMess(messPayload);

    res.status(201).json({
      success: true,
      message: 'Your mess has been registered successfully!',
      data: newMess
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mess
// @route   PUT /api/messes/:id
exports.updateMess = async (req, res, next) => {
  try {
    const updated = await DataStore.updateMess(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mess
// @route   DELETE /api/messes/:id
exports.deleteMess = async (req, res, next) => {
  try {
    await DataStore.deleteMess(req.params.id);
    res.status(200).json({ success: true, message: 'Mess deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mess Owner Login (Authentication gate)
// @route   POST /api/messes/owner-login
exports.ownerLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required for Mess Owner login.'
      });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Authenticate against live registered mess records in store
    const allMesses = await DataStore.getAllMesses();
    const matchedMess = allMesses.find(m => {
      const u = (m.username || '').toLowerCase();
      const e = (m.email || '').toLowerCase();
      const o = (m.ownerName || '').toLowerCase().replace(/\s+/g, '');
      return u === cleanUser || e === cleanUser || o === cleanUser;
    });

    if (!matchedMess) {
      return res.status(401).json({
        success: false,
        message: 'No registered mess found with this Username / Email.'
      });
    }

    // Verify password if set on mess
    if (matchedMess.password && String(matchedMess.password).trim() !== cleanPass) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password! Please check your password and retry.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner login successful!',
      data: {
        messId: matchedMess._id,
        messName: matchedMess.name,
        ownerName: matchedMess.ownerName,
        email: matchedMess.email || `${cleanUser}@messfinder.com`,
        phone: matchedMess.phone,
        role: 'messOwner'
      }
    });
  } catch (error) {
    next(error);
  }
};

