# HashTag Cafe

Dark-theme QR ordering MVP for a modern cafe, built with Next.js App Router, Tailwind CSS, Firebase Auth, and Firestore.

## Stack

- Next.js 16 App Router
- Tailwind CSS 4
- Firebase Auth + Firestore
- Ready for Vercel deployment

## Routes

- `/menu?table=1`
- `/cart`
- `/admin`
- `/admin/dashboard`
- `/admin/orders`
- `/admin/menu`

## Features

- QR/table-aware customer ordering flow
- Dark premium UI with yellow accent styling
- Image-first menu cards with trending highlights
- Sticky bottom cart bar
- Firebase email/password admin login
- Real-time Firestore order updates with `onSnapshot`
- Admin menu CRUD
- Optional waiter-call requests

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in your Firebase web config:

```bash
copy .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Open:

- `http://localhost:3000/menu?table=1` for the customer flow
- `http://localhost:3000/admin` for the admin panel

This repo now includes a local `.env.local` with your Firebase web config.

## Firebase Setup

1. Create a Firebase project.
2. Enable Firestore Database.
3. Enable Email/Password sign-in in Firebase Authentication.
4. Create a Web App and copy its config into `.env.local`.
5. Create an admin user in Firebase Authentication.
6. Apply the rules in `firebase/firestore.rules`.

### Admin Access Note

The admin UI now uses a simple admin model:

- Firebase Authentication proves the user identity.
- Any user you create in Firebase Authentication with Email/Password can access `/admin`.
- No custom admin claim is required in this setup.

## Environment Variables

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firestore Collections

### `menu`

```ts
{
  name: string;
  price: number;
  category: string;
  image: string;
  type: "veg" | "non-veg";
  popular?: boolean;
}
```

### `orders`

```ts
{
  tableNumber: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; image?: string }>;
  totalAmount: number;
  status: "pending" | "preparing" | "served";
  createdAt: Timestamp;
}
```

### `waiterRequests`

```ts
{
  tableNumber: string;
  status: "pending" | "completed";
  createdAt: Timestamp;
}
```

Waiter requests are stored per table so repeated guest taps keep one active request document instead of creating duplicates.

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add the same Firebase environment variables in Vercel.
4. Deploy.

## Notes

- Cart state is stored in browser localStorage.
- Admin protection is handled in the client with Firebase Auth session state.
- Firestore rules remain the real security boundary.
