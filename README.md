# 🍲 Mess Finder — "Find. Compare. Eat Better."
> **A Modern, Production-Quality Web Platform for College Students & Bachelors to Discover Nearby Messes, Compare Menus & Prices, and Read Verified Reviews.**

![Mess Finder Banner](https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80)

---

## 📌 1. Project Overview

Students and working bachelors moving to an unfamiliar college hub or IT park often struggle to find clean, nutritious, and affordable daily meals. They rely on word-of-mouth or outdated broker listings without knowing the actual monthly costs, kitchen hygiene, or food quality.

**Mess Finder** solves this problem by providing a startup-grade, map-integrated platform that empowers students to:
1. **Discover Nearby Messes** within walking distance (1 km, 3 km, 5 km, 10 km) using real-time browser Geolocation.
2. **Inspect Full Details** including monthly subscription fees, single meal trial rates, breakfast/lunch/dinner timings, and typical weekly menus.
3. **Read & Write Verified Reviews** with star ratings and visual breakdown progress bars.
4. **Directly Connect with Mess Owners** via 1-click calling or WhatsApp chat with prefilled inquiries.
5. **Register New Messes** with an interactive doorstep pin-picker map and dynamic PostgreSQL geospatial queries.

---

## 🛠️ 2. Technology Stack

### **Frontend**
- **HTML5**: Semantic markup, accessible headings, and SEO-optimized metadata.
- **CSS3 (Vanilla)**:
  - Custom design system tokens (Emerald primary palette, warm spice accents).
  - Modern cards, subtle glassmorphism (`backdrop-filter`), and smooth hover micro-animations.
  - Fully responsive layout (Desktop, Laptop, Tablet, Mobile) with a dedicated mobile drawer.
- **Vanilla JavaScript (ES6+)**:
  - Modular structure (`api.js`, `main.js`, `find-mess.js`, `mess-details.js`, `register-mess.js`).
  - No heavy framework overhead; fast and native execution.
- **Mapping & Geolocation**:
  - **Leaflet.js + OpenStreetMap** for interactive maps and custom styled pins.
  - **Browser Geolocation API** (`navigator.geolocation.getCurrentPosition()`).

### **Backend**
- **Node.js & Express.js**: REST API architecture with clean separation of concerns.
- **PostgreSQL & `pg` (node-postgres)**:
  - Relational database with JSONB support for rich nested attributes (menus, meal schedules, facilities).
  - High-performance connection pooling via `pg.Pool`.
  - Relational tables for `messes`, `reviews`, and `users` with foreign keys and performance indexes.
  - Resilient DataStore layer with seamless fallback ensuring high availability.
- **Geospatial Distance Calculation**:
  - Native SQL spherical queries & **Haversine Great-Circle Formula** calculating exact distances in kilometers:
    $$d = 2 R \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)}\right)$$
    *(where $R = 6371$ km)*

---

## 📂 3. Project Directory Structure

```text
messfinder/
├── package.json               # Dependencies and scripts (Express, PG, CORS, Dotenv)
├── .env                       # Environment variables (PORT, DATABASE_URL / DB_*)
├── .env.example               # Environment template for PostgreSQL
├── README.md                  # Project documentation & viva guide
│
├── server/
│   ├── server.js              # Express app entry point & static asset server
│   ├── config/
│   │   └── db.js              # PostgreSQL Pool connection & auto-table init
│   ├── models/
│   │   ├── Mess.js            # PostgreSQL Mess model & column definitions
│   │   ├── Review.js          # PostgreSQL Review model & column definitions
│   │   └── User.js            # PostgreSQL User model & column definitions
│   ├── controllers/
│   │   ├── messController.js  # CRUD, Haversine nearby discovery, filters
│   │   ├── reviewController.js# Review creation & rating auto-recalculation
│   │   └── userController.js  # Student / Mess Owner authentication
│   ├── routes/
│   │   ├── messRoutes.js      # /api/messes and /api/messes/nearby
│   │   ├── reviewRoutes.js    # /api/reviews
│   │   └── userRoutes.js      # /api/users
│   ├── middleware/
│   │   └── errorHandler.js    # Centralized error handler
│   └── data/
│       ├── seedData.js        # Realistic student mess data (Pune college hubs)
│       └── store.js           # Resilient storage manager & distance calculator
│
└── public/                    # Frontend client (HTML, CSS, JS)
    ├── index.html             # Landing Page with Hero, Stats, How it works
    ├── find-mess.html         # Nearby Mess Discovery & Leaflet Map
    ├── mess-details.html      # Mess Profile, Menus, Gallery & Reviews
    ├── register-mess.html     # Mess Owner Registration & Pin-Picker Map
    ├── css/
    │   ├── style.css          # Design system, typography, colors, navigation
    │   ├── components.css     # Cards, filters, Leaflet popups, review bars
    │   └── responsive.css     # Mobile & tablet breakpoints
    └── js/
        ├── api.js             # Unified REST API client with fallback
        ├── main.js            # Shared UI, toast notifications, auth modal
        ├── find-mess.js       # Geolocation, filters, Leaflet map engine
        ├── mess-details.js    # Gallery, menu tabs, reviews, review posting
        └── register-mess.js   # Owner GPS detection, map pin-picker, submit
```

---

## 🚀 4. How to Run the Project Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- **PostgreSQL** installed locally or hosted (Supabase, Neon, Render, AWS RDS)
- *(Note: If PostgreSQL is not yet configured, the application automatically uses the built-in resilient file data store without crashing).*

### Step 1: Install Dependencies
Open your terminal in the project directory:
```bash
cd "c:\Users\jayesh weljali\OneDrive\Desktop\messfinder"
npm install
```

### Step 2: Configure PostgreSQL Database
1. Open pgAdmin, psql, or your PostgreSQL shell:
```sql
CREATE DATABASE messfinder;
```
2. Verify or edit your database credentials in `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/messfinder
```
3. *(Optional)* Seed initial student messes and reviews into PostgreSQL:
```bash
npm run seed
```

### Step 3: Start the Application
Run the server:
```bash
npm start
```
*(Or run `npm run dev` if you have `nodemon` installed for auto-reload).*

### Step 3: Open in Browser
Visit the following URLs:
- **Landing Page**: [http://localhost:5000](http://localhost:5000)
- **Nearby Discovery & Map**: [http://localhost:5000/find-mess.html](http://localhost:5000/find-mess.html)
- **Register Your Mess**: [http://localhost:5000/register-mess.html](http://localhost:5000/register-mess.html)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 5. REST API Documentation

### Mess Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/messes` | Get all messes with optional `search`, `foodType`, `maxPrice`, `minRating` |
| `GET` | `/api/messes/nearby` | Find nearby messes. **Query params**: `lat`, `lng`, `radius`, `foodType`, `maxPrice`, `minRating`, `mealType`, `search` |
| `GET` | `/api/messes/:id` | Get single mess details, rating breakdown (5★ to 1★), and reviews |
| `POST` | `/api/messes` | Register a new mess with location coordinates `[longitude, latitude]` |
| `PUT` | `/api/messes/:id` | Update mess information |
| `DELETE` | `/api/messes/:id` | Remove a mess |
| `GET` | `/api/messes/:id/reviews` | Get all reviews for a specific mess |

### Review Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reviews` | Post a review (`messId`, `userName`, `userCollege`, `rating`, `comment`). Automatically recalculates the mess's average rating. |
| `DELETE` | `/api/reviews/:id` | Delete a review |

### Sample `POST /api/messes` Request Payload
```json
{
  "name": "Shree Ganesh Mess & Dining",
  "ownerName": "Ganesh Kulkarni",
  "phone": "+91 98220 12345",
  "whatsapp": "+91 98220 12345",
  "email": "ganesh.mess@gmail.com",
  "address": "Lane No. 3, Near MIT College, Paud Road",
  "area": "Kothrud",
  "city": "Pune",
  "pincode": "411038",
  "latitude": 18.5074,
  "longitude": 73.8077,
  "foodType": "Both",
  "monthlyPrice": 3200,
  "trialPrice": 110,
  "meals": {
    "breakfast": { "available": true, "timing": "7:30 AM - 10:00 AM" },
    "lunch": { "available": true, "timing": "12:00 PM - 3:00 PM" },
    "dinner": { "available": true, "timing": "7:30 PM - 10:30 PM" }
  },
  "menu": {
    "breakfast": ["Poha", "Upma", "Tea"],
    "lunch": ["4 Chapatis", "Paneer Sabzi", "Dal Tadka", "Rice"],
    "dinner": ["4 Rotis", "Sev Bhaji", "Dal Fry", "Jeera Rice"],
    "special": "Sunday Feast: Chicken Sukka / Matar Paneer Thali"
  },
  "facilities": ["Unlimited Chapatis", "RO Drinking Water", "Clean Seating"],
  "description": "Homely Maharashtrian & North Indian food with zero soda."
}
```

---

## 🎓 6. College Viva / Examiner Demonstration Guide

When presenting this project to your external examiner or professor, demonstrate these two core flows:

### Flow 1: Student Nearby Discovery & Review Flow
1. **Home Page**: Show the modern startup aesthetic, trust badges, and click **"Find Mess Near Me"**.
2. **Geolocation Detection**: The browser asks for location permission. When allowed, coordinates are sent to `GET /api/messes/nearby?lat=...&lng=...`.
3. **Map & Distance Calculation**:
   - Point out the blue pulse marker: *"You are here"*.
   - Point out the mess pins showing real-time distance (e.g. `0.8 km away`) calculated using the Haversine formula.
4. **Interactive Filters**: Change the food filter to *Pure Veg*, adjust price to *₹2,000–₹3,000*, or select campus hubs (Kothrud, FC Road, Katraj).
5. **Mess Details**: Click **"View Details"** on any mess.
   - Show the image gallery, daily meal timings, and interactive menu tabs (Breakfast, Lunch, Dinner, Sunday Special).
   - Point to direct action buttons: **Call Mess Owner** and **Chat on WhatsApp**.
6. **Live Review Posting**:
   - Scroll to the reviews section and show the dynamic 5-star to 1-star progress bars.
   - In "Write a Review", select 5 stars, type a feedback comment, and click **Submit Review**.
   - Notice how the review appears instantly, and the average score recalculates without page refresh.

### Flow 2: Mess Owner Registration Flow
1. Click **"Register Your Mess"** in the top navigation.
2. In section 2, click **"Use My Current Location"**:
   - The Geolocation API fetches current latitude and longitude.
   - The interactive Leaflet pin-picker map centers on the location.
   - Drag the pin on the map to demonstrate fine-tuning doorstep coordinates.
3. Fill in monthly subscription price, meal timings, and typical menu.
4. Click **"Register My Mess"**:
   - The form submits a `POST /api/messes` request.
   - A success confirmation modal pops up.
5. Click **"Check in Nearby Discovery"**:
   - The newly registered mess is now live in the database and immediately discoverable based on its stored coordinates.

---

## 🏆 7. Key Engineering Highlights
- **No static mock data**: Dynamic REST API architecture.
- **Geospatial Intelligence**: Real coordinate mathematics via Haversine formula and PostgreSQL coordinate queries.
- **Zero Frontend Framework Fatigue**: Clean Vanilla JavaScript and pure CSS design tokens; fast load times and accessible for college vivas.
- **Fail-Safe Architecture**: Gracefully handles offline states or missing database daemons with zero crashes.

---
© 2026 **Mess Finder** — Designed & Built with pride for college students and bachelors.
