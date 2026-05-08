<<<<<<< HEAD

# TaraBisita Web System

TaraBisita is a full-stack web platform for tourism-focused businesses and tourists.  
It includes role-based dashboards, booking/order workflows, business analytics, messaging, and payment integrations.

## Tech Stack

- **Frontend (`web/`)**: React, Vite, React Router, Zustand, React Hook Form, Tailwind CSS
- **Backend (`server/`)**: Node.js, Express, MongoDB (Mongoose), Socket.IO, Agenda jobs
- **Payments and external services**: Xendit webhook handling, Brevo/Nodemailer email workflows, Cloudinary asset storage

## Repository Structure

This project follows a **monorepo architecture**, where the frontend and backend live in one repository for coordinated development and versioning.

```text
TaraBisita-Web/
├─ server/   # Express API, role-based modules, jobs, migrations
└─ web/      # React + Vite client app
```

## Core System Modules

### Backend roles and domains

- `auth`: account/session and authentication lifecycle
- `business`: profile, menu/public catalog, customer orders, dashboard/insights, billing
- `tourist`: cart, checkout/orders, bookings, messaging
- `admin`: subscription and user/transaction management
- `payments`: centralized webhook + payment orchestration services

### Frontend architecture pattern

Follow this layering pattern:

1. `web/src/services/**` for HTTP/API calls only
2. `web/src/store/**` for state orchestration
3. `web/src/hooks/**` for page/feature controllers
4. `web/src/components/**` for presentational UI sections/modals

## Prerequisites

- Node.js 20+ (recommended)
- pnpm 10+
- MongoDB database (local or cloud URI)

## Local Setup

### 1 Clone and install dependencies

```bash
git clone <your-repo-url>
cd TaraBisita-Web
cd server && pnpm install
cd ../web && pnpm install
```

### 2 Configure environment variables

Create `server/.env` and provide the values your deployment uses.

Minimum commonly required keys:

```env
PORT=
DATABASE_URL=
NODE_ENV=
JWT_SECRET=
CLIENT_URL=
CLIENT_LOCAL=
CLIENT_PRODUCTION=

EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASS=
BREVO_APIKEY=
BREVO_USER=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GEMINI_APIKEY=
GEMINI_MODEL=

# Optional jobs/feature flags
ORDER_COMPLETION_EMAIL_DISABLED=
ORDER_COMPLETION_EMAIL_GROUP_WINDOW_MS=
XENDIT_LEDGER_RECONCILE_MS=
XENDIT_LEDGER_RECONCILE_LIMIT=
XENDIT_LEDGER_RECONCILE_DISABLED=
BOOKING_PAYMENT_EXPIRY_SCAN_EVERY=
BOOKING_PAYMENT_EXPIRY_AUTO_CANCEL_DISABLED=
BOOKING_PAYMENT_TOKEN_SECRET=
STORE_MESSAGING_TOKEN_SECRET=
```

## Run the System

Open two terminals:

### Backend

```bash
cd server
pnpm dev
```

Server default endpoint:

- `http://localhost:<PORT>/api/v1`

### Frontend

```bash
cd web
pnpm dev
```

Then open the Vite local URL shown in the terminal.

## Useful Scripts

### Server (`server/package.json`)

- `pnpm dev` - start API with nodemon
- `pnpm build` - run API in node
- `pnpm seed:admin` - seed admin account data
- `pnpm seed:restaurant-menu` - seed restaurant menu data
- `pnpm seed:resort-business` - seed resort business data
- `pnpm migrate:customer-orders-collection`
- `pnpm migrate:tourist-cart-collection`
- `pnpm migrate:remove-business-theme-color`

### Web (`web/package.json`)

- `pnpm dev` - start Vite dev server
- `pnpm build` - production build
- `pnpm preview` - preview production build
- `pnpm lint` - run ESLint

## API Mounts

From backend `app.js`:

- `/api/v1/auth`
- `/api/v1/business` (includes payment webhooks under business mount)
- `/api/v1/tourist`
- `/api/v1/admin`

## Proper Commits and Documentation

Use clear, focused commits and keep docs in sync with behavior changes.

- Keep commits scoped to one concern (feature/fix/refactor/docs)
- Use imperative commit messages (example: `docs: add system setup guide`)
- Explain **why** in the commit body when context is not obvious
- Update `README.md` whenever setup steps, scripts, architecture, or modules change
- Avoid mixing unrelated file changes in a single commit

Suggested commit format:

```text
<type>: <short summary>

<optional body explaining why and impact>
```

Common types:

- `feat` - new functionality
- `fix` - bug fix
- `refactor` - internal code improvements
- `docs` - documentation-only changes
- `chore` - maintenance or tooling changes
- `test` - test additions/updates
  <<<<<<< HEAD
  =======

> > > > > > > # 38dc81d (docs(readme): add system documentation for setup and commit standards)

# TaraBisita Web System

TaraBisita is a full-stack web platform for tourism-focused businesses and tourists.  
It includes role-based dashboards, booking/order workflows, business analytics, messaging, and payment integrations.

## Tech Stack

- **Frontend (`web/`)**: React, Vite, React Router, Zustand, React Hook Form, Tailwind CSS
- **Backend (`server/`)**: Node.js, Express, MongoDB (Mongoose), Socket.IO, Agenda jobs
- **Payments and external services**: Xendit webhook handling, Brevo/Nodemailer email workflows, Cloudinary asset storage

## Repository Structure

This project follows a **monorepo architecture**, where the frontend and backend live in one repository for coordinated development and versioning.

```text
TaraBisita-Web/
├─ server/   # Express API, role-based modules, jobs, migrations
└─ web/      # React + Vite client app
```

## Core System Modules

### Backend roles and domains

- `auth`: account/session and authentication lifecycle
- `business`: profile, menu/public catalog, customer orders, dashboard/insights, billing
- `tourist`: cart, checkout/orders, bookings, messaging
- `admin`: subscription and user/transaction management
- `payments`: centralized webhook + payment orchestration services

### Frontend architecture pattern

Follow this layering pattern:

1. `web/src/services/**` for HTTP/API calls only
2. `web/src/store/**` for state orchestration
3. `web/src/hooks/**` for page/feature controllers
4. `web/src/components/**` for presentational UI sections/modals

## Prerequisites

- Node.js 20+ (recommended)
- pnpm 10+
- MongoDB database (local or cloud URI)

## Local Setup

### 1 Clone and install dependencies

```bash
git clone <your-repo-url>
cd TaraBisita-Web
cd server && pnpm install
cd ../web && pnpm install
```

### 2 Configure environment variables

Create `server/.env` and provide the values your deployment uses.

Minimum commonly required keys:

```env
PORT=
DATABASE_URL=
NODE_ENV=
JWT_SECRET=
CLIENT_URL=
CLIENT_LOCAL=
CLIENT_PRODUCTION=

EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASS=
BREVO_APIKEY=
BREVO_USER=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GEMINI_APIKEY=
GEMINI_MODEL=

# Optional jobs/feature flags
ORDER_COMPLETION_EMAIL_DISABLED=
ORDER_COMPLETION_EMAIL_GROUP_WINDOW_MS=
XENDIT_LEDGER_RECONCILE_MS=
XENDIT_LEDGER_RECONCILE_LIMIT=
XENDIT_LEDGER_RECONCILE_DISABLED=
BOOKING_PAYMENT_EXPIRY_SCAN_EVERY=
BOOKING_PAYMENT_EXPIRY_AUTO_CANCEL_DISABLED=
BOOKING_PAYMENT_TOKEN_SECRET=
STORE_MESSAGING_TOKEN_SECRET=
```

## Run the System

Open two terminals:

### Backend

```bash
cd server
pnpm dev
```

Server default endpoint:

- `http://localhost:<PORT>/api/v1`

### Frontend

```bash
cd web
pnpm dev
```

Then open the Vite local URL shown in the terminal.

## Useful Scripts

### Server (`server/package.json`)

- `pnpm dev` - start API with nodemon
- `pnpm build` - run API in node
- `pnpm seed:admin` - seed admin account data
- `pnpm seed:restaurant-menu` - seed restaurant menu data
- `pnpm seed:resort-business` - seed resort business data
- `pnpm migrate:customer-orders-collection`
- `pnpm migrate:tourist-cart-collection`
- `pnpm migrate:remove-business-theme-color`

### Web (`web/package.json`)

- `pnpm dev` - start Vite dev server
- `pnpm build` - production build
- `pnpm preview` - preview production build
- `pnpm lint` - run ESLint

## API Mounts

From backend `app.js`:

- `/api/v1/auth`
- `/api/v1/business` (includes payment webhooks under business mount)
- `/api/v1/tourist`
- `/api/v1/admin`

## Proper Commits and Documentation

Use clear, focused commits and keep docs in sync with behavior changes.

- Keep commits scoped to one concern (feature/fix/refactor/docs)
- Use imperative commit messages (example: `docs: add system setup guide`)
- Explain **why** in the commit body when context is not obvious
- Update `README.md` whenever setup steps, scripts, architecture, or modules change
- Avoid mixing unrelated file changes in a single commit

Suggested commit format:

```text
<type>: <short summary>

<optional body explaining why and impact>
```

Common types:

- `feat` - new functionality
- `fix` - bug fix
- `refactor` - internal code improvements
- `docs` - documentation-only changes
- `chore` - maintenance or tooling changes
- `test` - test additions/updates
