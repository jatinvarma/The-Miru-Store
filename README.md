# MIRU — Curated Objects E-commerce Store

A full-stack e-commerce website with a refined editorial aesthetic.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 (CDN, no build step)       |
| Backend   | Node.js + Express                   |
| Database  | SQLite (via better-sqlite3)         |
| Auth      | JWT + bcrypt                        |
| Styling   | Custom CSS (Cormorant + DM Mono)    |

## Features

- 🛍️ **Product catalog** — filter by category, search, sort by price
- 🔐 **User authentication** — register, login, JWT sessions
- 🛒 **Shopping cart** — add, remove, update quantity (persisted per user)
- 📦 **Orders** — place orders, view order history
- 📬 **Contact form** — messages saved to database
- 🎨 **Refined design** — editorial aesthetic with serif typography

## Project Structure

```
shop/
├── backend/
│   ├── server.js        # Express API + SQLite DB
│   ├── shop.db          # Auto-created on first run
│   └── package.json
├── frontend/
│   └── index.html       # Complete React app (single file)
├── start.sh             # Start both servers
└── README.md
```

## Setup & Run

### Prerequisites
- Node.js 16+

### Install & Start

```bash
# Install backend dependencies
cd backend
npm install

# Start everything
cd ..
chmod +x start.sh
./start.sh
```

Then open **http://localhost:3000** in your browser.

### Alternatively, run separately:

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend  
cd frontend && npx serve -l 3000 .
```

## API Endpoints

| Method | Route                | Auth | Description          |
|--------|----------------------|------|----------------------|
| POST   | /api/auth/register   | —    | Create account       |
| POST   | /api/auth/login      | —    | Sign in              |
| GET    | /api/auth/me         | ✓    | Get current user     |
| GET    | /api/products        | —    | List products        |
| GET    | /api/products/:id    | —    | Get single product   |
| GET    | /api/cart            | ✓    | Get user's cart      |
| POST   | /api/cart            | ✓    | Add to cart          |
| PUT    | /api/cart/:id        | ✓    | Update quantity      |
| DELETE | /api/cart/:id        | ✓    | Remove from cart     |
| POST   | /api/orders          | ✓    | Place order          |
| GET    | /api/orders          | ✓    | Get order history    |
| POST   | /api/contact         | —    | Submit contact form  |
| GET    | /api/health          | —    | Health check         |

## Customization

- **Products**: Edit seed data in `backend/server.js` (search for `const products = [`)
- **Brand name**: Change "MIRU" in `frontend/index.html`
- **Colors**: Edit CSS variables at the top of `frontend/index.html`
- **JWT secret**: Change `JWT_SECRET` in `backend/server.js` for production
