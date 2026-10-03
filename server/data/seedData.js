const initialMesses = [
  {
    name: "Shree Ganesh Mess & Dining",
    ownerName: "Ganesh Kulkarni",
    phone: "+91 98220 12345",
    whatsapp: "+91 98220 12345",
    email: "ganesh.mess@gmail.com",
    address: "Lane No. 3, Near MIT College, Paud Road, Kothrud",
    area: "Kothrud",
    city: "Pune",
    pincode: "411038",
    location: {
      type: "Point",
      coordinates: [73.8077, 18.5074] // [lng, lat]
    },
    foodType: "Both",
    monthlyPrice: 3200,
    trialPrice: 110,
    meals: {
      breakfast: { available: true, timing: "7:30 AM - 10:00 AM" },
      lunch: { available: true, timing: "12:00 PM - 3:00 PM" },
      dinner: { available: true, timing: "7:30 PM - 10:30 PM" }
    },
    menu: {
      breakfast: ["Poha", "Upma", "Misal Pav", "Tea/Coffee"],
      lunch: ["4 Chapatis / 2 Bhakris", "Paneer / Seasonal Veg Sabzi", "Dal Tadka", "Steamed Rice", "Salad & Pickle"],
      dinner: ["4 Warm Phulkas", "Mix Veg Korma / Shev Bhaji", "Dal Fry", "Jeera Rice", "Papad & Curd"],
      special: "Sunday Special: Chicken Sukka / Matar Paneer Thali with Gulab Jamun"
    },
    facilities: [
      "Unlimited Chapati & Rice",
      "RO Drinking Water",
      "Spacious Clean Seating (60+)",
      "Daily Tiffin Packing Available",
      "Sunday Grand Feast",
      "Zero Soda / Pure Groundnut Oil"
    ],
    description: "Serving college students and working bachelors for over 12 years. We provide pure homely Maharashtrian & North Indian food with strict hygiene standards and zero soda. Both 2-time and 3-time monthly plans available.",
    images: [
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 142,
    isVerified: true
  },
  {
    name: "Annapurna Bhojanalay",
    ownerName: "Sunita & Madhav Joshi",
    phone: "+91 94220 54321",
    whatsapp: "+91 94220 54321",
    email: "annapurna.karve@gmail.com",
    address: "Near Cummins College of Engineering, Karve Nagar",
    area: "Karve Nagar",
    city: "Pune",
    pincode: "411052",
    location: {
      type: "Point",
      coordinates: [73.8214, 18.4912]
    },
    foodType: "Veg",
    monthlyPrice: 2800,
    trialPrice: 90,
    meals: {
      breakfast: { available: true, timing: "8:00 AM - 10:30 AM" },
      lunch: { available: true, timing: "12:00 PM - 3:30 PM" },
      dinner: { available: true, timing: "7:00 PM - 10:00 PM" }
    },
    menu: {
      breakfast: ["Idli Sambhar", "Poori Bhaji", "Sabudana Khichdi", "Masala Chai"],
      lunch: ["4 Fresh Phulkas with Ghee", "Bhendi Masala / Matki Usal", "Amti (Sweet/Spicy Dal)", "Indrayani Rice", "Taak (Buttermilk)"],
      dinner: ["4 Soft Chapatis", "Aloo Palak / Baingan Masala", "Varan Bhat with Ghee", "Koshimbir & Papad"],
      special: "Sunday Feast: Puran Poli / Shrikhand Puri with Special Katachi Amti"
    },
    facilities: [
      "100% Pure Vegetarian Kitchen",
      "Chilled Taak (Buttermilk) Daily",
      "Ghee Phulkas",
      "Hygienic Steel Utensils",
      "Tiffin Service for Hostels",
      "Student Concession Passes"
    ],
    description: "Motherly warmth and healthy Maharashtrian Brahmin style food. Less spicy, perfectly balanced nutrition suited for everyday student life. Trusted by over 200 girls and boys hostels in Karve Nagar.",
    images: [
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 198,
    isVerified: true
  },
  {
    name: "Swami Samarth Student Dining Hall",
    ownerName: "Rajesh Gaikwad",
    phone: "+91 97654 98710",
    whatsapp: "+91 97654 98710",
    email: "swami.mess.fc@gmail.com",
    address: "Off FC Road, Opp. Fergusson College Gate No. 3, Shivaji Nagar",
    area: "FC Road",
    city: "Pune",
    pincode: "411004",
    location: {
      type: "Point",
      coordinates: [73.8443, 18.5284]
    },
    foodType: "Both",
    monthlyPrice: 3400,
    trialPrice: 120,
    meals: {
      breakfast: { available: true, timing: "7:00 AM - 10:30 AM" },
      lunch: { available: true, timing: "11:45 AM - 3:15 PM" },
      dinner: { available: true, timing: "7:15 PM - 10:45 PM" }
    },
    menu: {
      breakfast: ["Kanda Poha", "Sheera", "Egg Bhurji Pav", "Filter Coffee"],
      lunch: ["Unlimited Chapatis", "Chole Masala / Sukhi Bhaji", "Dal Fry", "Steam Rice", "Lemon & Green Salad"],
      dinner: ["4 Chapatis", "Sev Tamatar / Soya Chunk Curry", "Yellow Dal", "Jeera Rice", "Papad"],
      special: "Wednesday & Sunday: Special Chicken Curry / Paneer Lababdar with Gulab Jamun"
    },
    facilities: [
      "Air-Cooled Dining Hall",
      "Non-Veg Kitchen on Separate Floor",
      "High-speed Free Student Wi-Fi",
      "Breakfast + 2 Meals combo plan",
      "Digital Token & Attendance system"
    ],
    description: "The favorite hangout & dining place for Fergusson, BMCC, and COEP students. Serving quality high-protein food with non-veg specials twice a week. Clean, fast service and very pocket-friendly.",
    images: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.4,
    reviewCount: 165,
    isVerified: true
  },
  {
    name: "Kolhapuri Tadka & Khanawal",
    ownerName: "Santosh Shinde",
    phone: "+91 91580 88231",
    whatsapp: "+91 91580 88231",
    email: "kolhapuritadka.mess@gmail.com",
    address: "Back Gate, Bharati Vidyapeeth Campus, Katraj",
    area: "Katraj",
    city: "Pune",
    pincode: "411046",
    location: {
      type: "Point",
      coordinates: [73.8583, 18.4482]
    },
    foodType: "Both",
    monthlyPrice: 3100,
    trialPrice: 110,
    meals: {
      breakfast: { available: false, timing: "Closed" },
      lunch: { available: true, timing: "12:00 PM - 3:30 PM" },
      dinner: { available: true, timing: "7:30 PM - 11:00 PM" }
    },
    menu: {
      breakfast: [],
      lunch: ["Jowar Bhakri / Chapati", "Authentic Veg Maratha / Shev Bhaji", "Tambda-Pandhra Rassa (Gravy)", "Indrayani Bhaat"],
      dinner: ["3 Jowar Bhakris", "Besan Pithla / Batata Sukha", "Katachi Amti", "Garlic Chutney & Thecha", "Rice"],
      special: "Wednesday, Friday & Sunday: Mutton Sukka & Chicken Thali with unlimited Tambda Pandhra Rassa"
    },
    facilities: [
      "Famous Authentic Kolhapuri Spices",
      "Unlimited Jowar & Bajra Bhakris",
      "Tiffin Service for PICT & Bharati Hostels",
      "Takeaway Parcels in Leakproof Boxes",
      "Student Loyalty Card"
    ],
    description: "Famous among engineering and medical students in Katraj for authentic zesty Kolhapuri flavours. Rich taste, traditional cooking over slow flame, and genuine hospitality by Shinde Mama.",
    images: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.5,
    reviewCount: 210,
    isVerified: true
  },
  {
    name: "Sai Krupa Deluxe Mess",
    ownerName: "Ramesh Sharma",
    phone: "+91 99234 66120",
    whatsapp: "+91 99234 66120",
    email: "saikrupa.viman@gmail.com",
    address: "Near Symbiosis International School, Dutta Mandir Chowk, Viman Nagar",
    area: "Viman Nagar",
    city: "Pune",
    pincode: "411014",
    location: {
      type: "Point",
      coordinates: [73.9143, 18.5679]
    },
    foodType: "Veg",
    monthlyPrice: 3800,
    trialPrice: 130,
    meals: {
      breakfast: { available: true, timing: "7:45 AM - 10:15 AM" },
      lunch: { available: true, timing: "12:15 PM - 3:15 PM" },
      dinner: { available: true, timing: "7:30 PM - 10:30 PM" }
    },
    menu: {
      breakfast: ["Aloo Paratha with Curd", "Sandwiches", "Poha", "Juice/Tea"],
      lunch: ["Multi-grain Rotis", "Paneer Butter Masala", "Dal Makhani", "Basmati Jeera Rice", "Green Salad & Boondi Raita"],
      dinner: ["Butter Phulkas", "Mix Veg Kolhapuri", "Yellow Moong Dal", "Brown/White Rice", "Roasted Papad"],
      special: "Saturday & Sunday: North Indian Royal Buffet with Dessert (Gulab Jamun / Rasgulla)"
    },
    facilities: [
      "AC Dining Room",
      "North & South Indian Variety",
      "Hygienic Sanitized Kitchen",
      "Diet / Low Oil Options for Gym Students",
      "Card & UPI Payment Terminal"
    ],
    description: "Premium corporate and student dining in the heart of Viman Nagar. Clean environment, balanced nutritious meals, low oil usage, and friendly staff. Highly popular among Symbiosis students.",
    images: [
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 118,
    isVerified: true
  },
  {
    name: "Green Leaf Pure Veg Kitchen & Tiffin",
    ownerName: "Pravin Patil",
    phone: "+91 98901 33412",
    whatsapp: "+91 98901 33412",
    email: "greenleaf.baner@gmail.com",
    address: "Behind D-Mart, High Street Link Road, Baner",
    area: "Baner",
    city: "Pune",
    pincode: "411045",
    location: {
      type: "Point",
      coordinates: [73.7868, 18.5590]
    },
    foodType: "Veg",
    monthlyPrice: 2900,
    trialPrice: 95,
    meals: {
      breakfast: { available: true, timing: "8:00 AM - 10:00 AM" },
      lunch: { available: true, timing: "12:00 PM - 3:00 PM" },
      dinner: { available: true, timing: "7:30 PM - 10:15 PM" }
    },
    menu: {
      breakfast: ["Upma", "Poha", "Medu Vada", "Tea"],
      lunch: ["4 Warm Chapatis", "Kaju Curry / Bhindi Masala", "Dal Fry", "Steamed Basmati Rice", "Buttermilk"],
      dinner: ["3 Wheat Phulkas", "Dal Khichdi Tadka", "Sev Tomato Bhaji", "Pickle & Papad"],
      special: "Sunday Special: Pav Bhaji / Paneer Pulao with Kheer"
    },
    facilities: [
      "100% Jain Food Available on Order",
      "Stainless Steel Multi-Tier Tiffins",
      "Doorstep Hostel Delivery",
      "RO Mineral Water",
      "Affordable Weekly & Monthly Passes"
    ],
    description: "Healthy, comforting, and pocket-friendly pure vegetarian mess for students and tech park employees in Baner and Balewadi. Zero artificial color, made with fresh daily vegetables.",
    images: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.3,
    reviewCount: 89,
    isVerified: true
  },
  {
    name: "Punjab Da Swad Student Mess",
    ownerName: "Harpreet Singh",
    phone: "+91 98811 77654",
    whatsapp: "+91 98811 77654",
    email: "punjabdawad.aundh@gmail.com",
    address: "Near DAV School & Ambedkar Chowk, Aundh",
    area: "Aundh",
    city: "Pune",
    pincode: "411007",
    location: {
      type: "Point",
      coordinates: [73.8074, 18.5580]
    },
    foodType: "Both",
    monthlyPrice: 3500,
    trialPrice: 120,
    meals: {
      breakfast: { available: true, timing: "8:00 AM - 10:30 AM" },
      lunch: { available: true, timing: "12:30 PM - 3:30 PM" },
      dinner: { available: true, timing: "7:30 PM - 10:45 PM" }
    },
    menu: {
      breakfast: ["Stuffed Aloo-Gobhi Parathas", "Sweet Lassi / Chai", "Bread Omelette"],
      lunch: ["4 Tandoori/Tawa Rotis", "Rajma Masala / Shahi Paneer", "Black Dal Makhani", "Jeera Rice", "Onion Salad"],
      dinner: ["4 Butter Rotis", "Egg Curry / Kadai Mushroom", "Yellow Tadka Dal", "Basmati Rice", "Papad"],
      special: "Sunday Special: Butter Chicken / Paneer Tikka Masala with Garlic Naan & Kulfi"
    },
    facilities: [
      "Authentic North Indian Desi Ghee Prep",
      "Unlimited Lassi with Lunch",
      "Spacious Seating",
      "Custom Diet Meal Plans for Gym Enthusiasts",
      "Fast Takeaway Counter"
    ],
    description: "Missing home-style North Indian food? We bring hearty portions of Rajma Chawal, Dal Makhani, Paneer, and Chicken curries cooked with authentic Punjabi spices and love.",
    images: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 176,
    isVerified: true
  }
];

const initialReviews = [
  {
    userName: "Rahul Patil",
    userCollege: "MIT World Peace University, Final Year CS",
    rating: 5,
    comment: "Food quality is really good and the owner Ganesh kaka is super friendly! The chapati is always hot and soft, and the dal tadka tastes just like home. Quantity is generous and stomach never feels heavy.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    userName: "Amit Deshmukh",
    userCollege: "COEP Tech, Mechanical",
    rating: 4,
    comment: "Very pocket-friendly for students. The lunch thali is excellent with fresh sabzis. Sunday chicken special is totally worth the monthly fee. Highly recommended for bachelors.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    userName: "Sneha Kulkarni",
    userCollege: "Cummins College of Engineering",
    rating: 5,
    comment: "Annapurna mess is a blessing! Pure Maharashtrian food without excess oil or red chili. The Taak (buttermilk) is so refreshing during exam months. Cleanliness is 10/10.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    userName: "Pooja Hegde",
    userCollege: "Symbiosis Institute of Design",
    rating: 4,
    comment: "The variety here is amazing. North Indian dishes are flavorful and not oily. The staff is polite and the dining room is kept spotlessly clean.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    userName: "Tanmay Bhatkar",
    userCollege: "PICT Pune",
    rating: 5,
    comment: "If you want real spice and authentic taste, this is the best place near Katraj. Unlimited bhakris and tambda rassa on Sundays is legendary among our hostel gang.",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  }
];

module.exports = { initialMesses, initialReviews };
