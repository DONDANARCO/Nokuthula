# Vercel Test Deploy Checklist

This site is ready for static deployment on Vercel.

## 1) Final pre-deploy edits

Before deploying, update these placeholders:

- In `index.html` and `booking.html`:
  - Replace the calendar link/embed URLs with your real booking calendar.

## 1.1) AWS DynamoDB setup (for contact/query form storage)

Create one DynamoDB table in AWS:

- Table name: `footmed_form_submissions` (or your preferred name)
- Partition key: `PK` (String)
- Sort key: `SK` (String)

In Vercel project settings, add environment variables:

- `AWS_REGION` (you provided `ap-northeast-1`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_TABLE_NAME` (you provided `NMashabpodiatrist`)
- `DYNAMODB_TABLE_PARTITION_KEY` (`PK`)
- `DYNAMODB_TABLE_SORT_KEY` (`SK`)
- `ADMIN_API_KEY` (choose a strong secret for `/admin.html`)

The forms in `index.html` and `contact.html` already post to `/api/submissions`.
The admin dashboard is available at `/admin.html`.

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
