## MERN Shopping Cart CRUD Project

This is a simple **MERN stack** (MongoDB, Express, React, Node.js) project that implements **CRUD operations for a shopping cart**.

### Features

- **Products**
  - Create, read, update, delete products
  - List all products
- **Shopping Cart**
  - Add products to cart
  - Update quantities
  - Remove items
  - View current cart
- **Image Upload**
  - Upload a product image file from the React form (with live preview and progress bar)
  - Files are stored on the server and served over HTTP
  - Type and size validation on both client and server (JPG/PNG/WEBP/GIF/AVIF, max 5 MB)

### Tech Stack

- **Backend**: Node.js, Express, MongoDB (via Mongoose), Multer (file uploads), CORS, dotenv
- **Frontend**: React (Vite), Fetch API

### Project Structure

```text
CURD Operation/
  backend/
    src/
      middleware/
        upload.js      # multer config: storage, filename, type + size limits
      models/
      routes/
        uploads.js     # upload / delete endpoints
      server.js
    uploads/           # uploaded files land here (git-ignored)
    package.json
  frontend/
    src/
      main.jsx
      App.jsx
    index.html
    package.json
  README.md
  package.json
```

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or cloud, e.g. MongoDB Atlas)

### Backend Setup

1. Open a terminal in the project root.
2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Create an `.env` file in `backend` based on `.env.example`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/mern_cart
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
# Optional. Only needed in production behind a proxy/CDN; in development the
# server infers the public URL for uploaded files from the request host.
# PUBLIC_BASE_URL=https://api.example.com
```

4. Start the backend server:

```bash
npm run dev
```

The API will run by default on `http://localhost:5000`.

### Frontend Setup

1. In a new terminal from the project root:

```bash
cd frontend
npm install
```

2. Start the React dev server:

```bash
npm run dev
```

The app will run on `http://localhost:5173` by default.

### Root Scripts (optional)

You can also use the root `package.json` (once created) to run both frontend and backend with a single command using `concurrently`.

### API Overview

- **Products**
  - `GET /api/products` – list all products
  - `POST /api/products` – create product
  - `GET /api/products/:id` – get a single product
  - `PUT /api/products/:id` – update product
  - `DELETE /api/products/:id` – delete product
- **Cart**
  - `GET /api/cart` – get current cart
  - `POST /api/cart` – add item to cart
  - `PUT /api/cart/:itemId` – update cart item quantity
  - `DELETE /api/cart/:itemId` – remove item from cart
- **Uploads**
  - `POST /api/uploads` – upload one image (`multipart/form-data`, field name `file`)
  - `GET /api/uploads/config` – current size limit and allowed mime types
  - `DELETE /api/uploads/:filename` – delete an uploaded file
  - `GET /uploads/:filename` – static access to an uploaded file
- **Loans**
  - `POST /api/loans` – create a loan

Example loan request:

```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Content-Type: application/json" \
  -d '{"borrower":"Jane Doe","amount":10000,"interestRate":7.5,"termMonths":24}'
```

The `status` field is optional and defaults to `pending`. Supported values are
`pending`, `approved`, and `rejected`.

#### Image Upload

The product form accepts either an image URL **or** an uploaded file; a chosen
file takes priority and disables the URL field.

Flow: the browser `POST`s the file to `/api/uploads`, the server validates it,
stores it under `backend/uploads/` with a generated unique name and returns a
public URL, which is then saved as the product's `imageUrl`.

Rules enforced on the server (the client re-checks them only for fast feedback):

| Rule              | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Max file size     | 5 MB                                                               |
| Allowed types     | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif` |
| Files per request | 1 (field name `file`)                                              |

Example:

```bash
curl -F "file=@laptop.jpg" http://localhost:5000/api/uploads
# {"url":"http://localhost:5000/uploads/laptop-1737045-9f2c1a.jpg", ...}
```

Stored filenames are generated server-side (slug + timestamp + random bytes,
extension derived from the validated mime type), so the client never controls
the path written to disk.

### Next Steps

- Add authentication (optional)
- Add pagination and search for products
- Add validation and better error handling
- Move uploads to S3/Cloudinary for production (the AWS SDK is already a
  dependency); swap multer's `diskStorage` for a cloud storage engine
- Delete the stored image file when a product is deleted or its image replaced
