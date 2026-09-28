# Light Table – Responsive Image Gallery & Accessible Lightbox

A responsive photo gallery that opens images in a full-screen lightbox. Built with **vanilla HTML, CSS and JavaScript** — no frameworks, no build step, no dependencies.

**Live demo:** _add your deployed URL here (GitHub Pages / Netlify)_

## Features

- Photos fetched from the [Picsum API](https://picsum.photos/) (`https://picsum.photos/v2/list?page=1&limit=16`) and rendered dynamically (16 thumbnails)
- CSS Grid layout: **2 columns** (< 768px), **3 columns** (768–1024px), **4 columns** (> 1024px)
- Hover overlay (also shown on keyboard focus) displaying the author's name
- Lightbox with Close, Previous and Next buttons and an "Image X of 16" counter
- Backdrop click, `Escape`, `ArrowLeft` and `ArrowRight` support
- Keyboard focus trap (`Tab` / `Shift+Tab` cycle only through the modal's buttons)
- Focus returns to the originating thumbnail when the lightbox closes
- Loading and error states (with a "Try again" button)
- Respects `prefers-reduced-motion`

## Project structure

```
project-root/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run locally

No installation is required. Use either option:

1. **Open directly:** double-click `index.html` in your browser.
2. **Simple local server** (recommended):
   ```bash
   # Python 3
   python3 -m http.server 8000
   # or Node
   npx serve .
   ```
   Then visit <http://localhost:8000>.

An internet connection is needed to reach the Picsum API.

## Deploy

**GitHub Pages:** push the repo, then go to *Settings → Pages*, choose the `main` branch and the `/ (root)` folder, and save. Your site will be available at `https://<username>.github.io/<repo>/`.

**Netlify:** drag the project folder onto <https://app.netlify.com/drop>, or connect the repository (no build command, publish directory `.`).

## Design choices

### Navigation strategy: wrap-around

The task asks for one boundary strategy, documented here. This project uses **wrap-around navigation**: `currentIndex = (currentIndex ± 1 + n) % n`. Pressing Next on the last image shows the first; pressing Previous on the first shows the last. Buttons are never disabled, so `disabled` / `aria-disabled` are not used for navigation (the two strategies are not mixed).

### Event delegation

A single `click` listener (plus one `keydown` listener for Enter/Space) sits on `.gallery-grid` and uses `event.target.closest('.gallery-item')` to find the clicked thumbnail and read its `data-index`. No per-thumbnail listeners are created.

### State management

Two module-level variables hold the state: `imagesData` (the fetched array) and `currentIndex`. `updateLightbox()` is the single function that syncs the modal image, alt text, counter and author from that state.

### Event listener lifecycle

The document-level `keydown` listener (Escape, arrows, Tab trap) is a named function added in `openLightbox()` and removed in `closeLightbox()`, so it never runs while the modal is closed.

### Accessibility

- Semantic structure: `<main>`, `<section>`, `<figure>`, `<figcaption>`, `<header>`
- Modal uses `role="dialog"`, `aria-modal="true"` and `aria-label`
- Every `<img>` (thumbnails and modal) has a non-empty `alt` ("Photograph by *author*")
- Thumbnails are keyboard-focusable (`tabindex="0"`, `role="button"`) and open with Enter or Space
- Focus moves to the Close button on open; Tab/Shift+Tab wrap inside the modal; focus returns to the trigger on close
- The page behind the modal is marked `inert` and body scrolling is locked while it is open
- The counter is an `aria-live` region so screen readers announce navigation
- Visible `:focus-visible` outlines and a skip link

### Performance

- Thumbnails are inserted with a `DocumentFragment` (one reflow)
- Thumbnails use `loading="lazy"` with explicit dimensions; the lightbox loads a larger version on demand
- The modal fades with `opacity` + `visibility` transitions (never `display`)
- Closing resets the modal image `src` to a 1×1 blank GIF to avoid a flash of the previous photo

### Styling

- CSS classes for styling, IDs reserved for JavaScript hooks
- Mobile-first CSS with three grid breakpoints
- Icons are inline SVG (Lucide-style paths), so no external icon dependency

## Security

No API keys or secrets are used; the Picsum API is public.

## Credits

Photos by [Picsum Photos](https://picsum.photos/) (Unsplash contributors). Icon shapes follow [Lucide](https://lucide.dev/).
