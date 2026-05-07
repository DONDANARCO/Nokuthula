# Vercel Test Deploy Checklist

This site is ready for static deployment on Vercel.

## 1) Final pre-deploy edits

Before deploying, update these placeholders:

- In `index.html`, `booking.html`, and `contact.html`:
  - Replace `YOUR_EMAIL@example.com` with your real mailbox in all `formsubmit.co` form actions.
- In `index.html` and `booking.html`:
  - Replace the calendar link/embed URLs with your real booking calendar.

## 2) Deploy from Vercel dashboard (easiest)

1. Push this folder to a GitHub repo.
2. Go to [Vercel](https://vercel.com/new).
3. Import your GitHub repository.
4. Framework preset: **Other**.
5. Build command: leave empty.
6. Output directory: leave empty (root).
7. Click **Deploy**.

## 3) Deploy with CLI (optional)

Run in this folder:

```bash
npm i -g vercel
vercel
```

For production:

```bash
vercel --prod
```

## 4) Post-deploy test

Check these pages load:

- `/`
- `/booking`
- `/contact`
- `/reviews`
- `/gallery`

Check these actions:

- Booking form submits to your mailbox
- Contact form submits to your mailbox
- WhatsApp button opens chat
- Phone link dials `075 958 7273`
- Map loads correctly

## Notes

- `vercel.json` is already included to support clean URLs (`/booking` instead of `/booking.html`).
- Site is fully static, so no build step is required.
