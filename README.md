# Marketplace MVP — Node.js + MongoDB API

## Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Bearer token)
- **File uploads**: Multer (local `/uploads` folder)
- **Security**: Helmet, CORS, express-rate-limit, bcryptjs

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Seed admin user
npm run seed:admin

# 4. Start server
npm run dev         # development (requires nodemon)
npm start           # production
```

---

## Environment Variables

| Variable        | Default                                   | Description             |
|-----------------|-------------------------------------------|-------------------------|
| `PORT`          | `5000`                                    | Server port             |
| `MONGODB_URI`   | `mongodb://localhost:27017/marketplace`   | MongoDB connection URI  |
| `JWT_SECRET`    | —                                         | JWT signing secret      |
| `JWT_EXPIRES_IN`| `7d`                                      | Token expiry            |
| `NODE_ENV`      | `development`                             | Environment             |
| `CLIENT_URL`    | `*`                                       | CORS allowed origin     |

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint            | Access  | Description         |
|--------|---------------------|---------|---------------------|
| POST   | `/auth/register`    | Public  | Register new user   |
| POST   | `/auth/login`       | Public  | Login               |
| POST   | `/auth/logout`      | Any     | Logout (stateless)  |
| GET    | `/auth/me`          | Any     | Get current user    |

**Register body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@gmail.com",
  "password": "secret123",
  "role": "customer",        // "customer" | "provider"
  "phone": "+254700000000",  // optional
  "location": "Nairobi"      // optional
}
```

**Login body:**
```json
{ "email": "jane@gmail.com", "password": "secret123" }
```

---

### Services (Public)
| Method | Endpoint           | Access    | Description              |
|--------|--------------------|-----------|--------------------------|
| GET    | `/services`        | Public    | Browse/search services   |
| GET    | `/services/:id`    | Public    | Service detail           |

**Query params for GET `/services`:**
- `search` — full-text search
- `category` — filter by category
- `location` — filter by location
- `minPrice` / `maxPrice`
- `page` (default: 1), `limit` (default: 12)

### Services (Provider)
| Method | Endpoint                 | Access    | Description           |
|--------|--------------------------|-----------|-----------------------|
| GET    | `/services/provider/my`  | Provider  | My service listings   |
| POST   | `/services`              | Provider  | Create listing        |
| PUT    | `/services/:id`          | Provider  | Edit listing          |
| DELETE | `/services/:id`          | Provider/Admin | Delete listing   |

**Create/Update body** (multipart/form-data):
- `title`, `description`, `category`, `price`, `location`
- `images[]` — up to 5 image files

---

### Bookings
| Method | Endpoint                   | Access    | Description              |
|--------|----------------------------|-----------|--------------------------|
| POST   | `/bookings`                | Customer  | Create booking           |
| GET    | `/bookings/customer`       | Customer  | My bookings              |
| GET    | `/bookings/provider`       | Provider  | Incoming bookings        |
| GET    | `/bookings/:id`            | Owner     | Booking detail           |
| PATCH  | `/bookings/:id/status`     | Owner     | Update booking status    |

**Create booking body:**
```json
{
  "serviceId": "64abc...",
  "bookingDate": "2026-06-15T10:00:00Z",
  "notes": "Please bring equipment"
}
```

**Update status body:**
```json
{ "status": "accepted" }   // accepted | completed | cancelled
```

- **Provider** can set: `accepted`, `completed`, `cancelled`
- **Customer** can set: `cancelled`

---

### Reviews
| Method | Endpoint                         | Access    | Description              |
|--------|----------------------------------|-----------|--------------------------|
| POST   | `/reviews`                       | Customer  | Leave a review           |
| GET    | `/reviews/service/:serviceId`    | Public    | Reviews for a service    |
| GET    | `/reviews/provider/:providerId`  | Public    | Reviews for a provider   |

**Create review body:**
```json
{
  "bookingId": "64abc...",
  "rating": 5,
  "comment": "Excellent service!"
}
```

> Only possible after a booking status is `completed`. One review per booking.

---

### Users
| Method | Endpoint          | Access | Description              |
|--------|-------------------|--------|--------------------------|
| GET    | `/users/profile`  | Any    | Get own profile          |
| PUT    | `/users/profile`  | Any    | Update own profile       |
| GET    | `/users/:id`      | Any    | View a user's profile    |

**Update profile** (multipart/form-data):
- `name`, `phone`, `location`
- `profileImage` — image file

---

### Admin
All endpoints require `role: admin`.

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/admin/dashboard`             | Stats overview           |
| GET    | `/admin/users`                 | List all users           |
| PATCH  | `/admin/users/:id/suspend`     | Suspend/unsuspend user   |
| DELETE | `/admin/users/:id`             | Delete user              |
| GET    | `/admin/services`              | All services             |
| DELETE | `/admin/services/:id`          | Remove listing           |
| GET    | `/admin/bookings`              | All bookings             |

---

## Authentication

All protected routes require the header:
```
Authorization: Bearer <token>
```

---

## User Roles Summary

| Feature                  | Customer | Provider | Admin |
|--------------------------|----------|----------|-------|
| Browse/search services   | ✅       | ✅       | ✅    |
| View provider profile    | ✅       | ✅       | ✅    |
| Book a service           | ✅       | ❌       | ❌    |
| Leave a review           | ✅       | ❌       | ❌    |
| Create/edit listings     | ❌       | ✅       | ❌    |
| Manage bookings          | ❌       | ✅       | ❌    |
| Manage all users         | ❌       | ❌       | ✅    |
| Remove any listing       | ❌       | ❌       | ✅    |

---

## Booking Status Flow

```
pending → accepted → completed
       ↘          ↘
        cancelled   cancelled
```

---

## Default Admin Credentials
After running `npm run seed:admin`:
- **Email**: `admin@marketplace.com`
- **Password**: `Admin@1234`

> Change these immediately in production!
