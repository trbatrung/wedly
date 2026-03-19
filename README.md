# Vowo — Wedding Planning App

## Get running in 3 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel (free, live URL)
```bash
npm install -g vercel
vercel
```
That's it — Vercel auto-detects Next.js and deploys.

---

## Pages & URLs

| URL | What it is |
|-----|------------|
| `/` | Landing page (public marketing site) |
| `/dashboard` | Planner dashboard — all weddings overview |
| `/wedding/anderson-kim` | Individual wedding kanban board |
| `/wedding/anderson-kim/vendors` | Vendor CRM |
| `/wedding/anderson-kim/budget` | Budget tracker |
| `/wedding/anderson-kim/timeline` | Day-of timeline |
| `/wedding/anderson-kim/guests` | Guest list |
| `/share/anderson-kim` | Couple's read-only portal |

## Project structure

```
vowo/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── globals.css             # Global styles + CSS variables
│   ├── dashboard/page.tsx      # Planner dashboard
│   ├── wedding/[id]/           # Dynamic wedding workspace
│   │   ├── page.tsx            # Kanban board
│   │   ├── vendors/page.tsx    # Vendor CRM
│   │   ├── budget/page.tsx     # Budget tracker
│   │   ├── timeline/page.tsx   # Day timeline
│   │   └── guests/page.tsx     # Guest list
│   └── share/[token]/page.tsx  # Couple read-only portal
├── components/
│   ├── Sidebar.tsx             # App sidebar (all app pages)
│   └── Nav.tsx                 # Marketing nav
└── lib/
    └── data.ts                 # Mock data (replace with DB later)
```

## Adding a new wedding

In `lib/data.ts`, add a new object to the `weddings` array with a unique `id`.
That ID becomes the URL: `/wedding/your-id`.

## Next steps when ready to go real

1. **Auth** — Add [NextAuth.js](https://next-auth.js.org/) for planner login
2. **Database** — Replace `lib/data.ts` with [Supabase](https://supabase.com/) (free Postgres)
3. **File uploads** — Add [Uploadthing](https://uploadthing.com/) for contracts/images
4. **Emails** — Add [Resend](https://resend.com/) for vendor outreach templates

## Tech stack

- **Next.js 14** — App Router, file-based routing
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility styles
- **Vercel** — Hosting (free tier)
- **Cormorant Garamond + DM Sans** — Typography
