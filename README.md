# AI Talk Slides

A reveal.js slide deck built with Vite.

**Live:** https://luketheobscure.github.io/code-review-slides/

## View the slides

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173 in your browser.

## Build for static hosting

```bash
pnpm build
pnpm preview
```

The static output lands in `dist/`.

## Deploy

Pushes to `master` deploy automatically via `.github/workflows/deploy.yml`. One-time setup in the repo: **Settings → Pages → Source: GitHub Actions**.

## Navigation

- `→` / `Space` — next slide
- `←` — previous slide
- `Esc` — slide overview
- `F` — fullscreen
- `S` — speaker notes
