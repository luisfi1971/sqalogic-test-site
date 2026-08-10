# SQALOGIC automation test site

A deliberately imperfect flight-booking app used as a target for automated test
generation and repair.

## Test controls (for the automation side)

Everything below is **per request** and **off by default** — a plain visit
behaves exactly as it always has, including the global "Simulate New Release"
counter.

```
/search?variant=none|id-rotation|text-change|type-change|moved-container|sibling-reorder|element-removed
/search?variant=<name>&sticky=1     # also mirror into the sqa_variant cookie
/search?delay=off|<ms>|seed:<n>     # pin the injected jitter for measurement
/practice                           # archetype pages + a launcher for every variant
```

Full reference, including what each variant changes and why the design replaces
an HTML-rewriting proxy: **[docs/TEST-CONTROLS.md](docs/TEST-CONTROLS.md)**.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
