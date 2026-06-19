# Dostii Delight — Website

A hand-coded, static 5-page site (no WordPress). Built with plain HTML/CSS/JS plus
**Three.js** (3D product hero), **GSAP ScrollTrigger** and **Lenis** (smooth scroll).
All libraries load from a CDN — there is **no build step**.

## Pages
| File | Page |
|------|------|
| `index.html` | Home — 3D scrolling hero |
| `product.html` | Farsan Special product |
| `ingredients.html` | Ingredients |
| `our-story.html` | Our Story |
| `contact.html` | Contact + enquiry form |

## Folder structure
```
WEBSITE/
├── index.html, product.html, ingredients.html, our-story.html, contact.html
├── css/styles.css          ← all styling + brand tokens (top of file)
├── js/site.js              ← smooth scroll, nav, scroll reveals
├── js/hero3d.js            ← Three.js 3D hero
├── assets/
│   ├── images/             ← logo, product photos  (drop final files here)
│   └── models/product.glb  ← 3D model for the hero (generated from mockup)
└── assets-raw/             ← raw files you provide (logo, mockup, photos)
```

## To customise
- **Brand colours / fonts:** edit the `:root` variables at the top of `css/styles.css`.
- **Logo:** add `assets/images/logo.svg` (or .png) and swap the text in the `.brand` link of each page.
- **Product photo:** add `assets/images/farsan-special.jpg`.
- **3D model:** drop `assets/models/product.glb`. Until then a stylized placeholder packet shows.

## Contact form
The enquiry form posts to `contact.php`, which uses Hostinger's PHP mail service to
deliver messages to `contact@dostiidelight.com`. The form includes inline success
and error feedback plus a honeypot field for basic spam protection.

## Deploy to Hostinger
1. In hPanel → **File Manager**, open `public_html`.
2. If WordPress is still there and you're replacing it, back it up first, then clear `public_html`.
3. Upload **everything inside this WEBSITE folder** (the html files + `css`, `js`, `assets`) into `public_html`.
4. Visit your domain — `index.html` loads automatically.
   (No database, no PHP config needed for the static site.)

> Tip: test locally first by running a tiny server in this folder, e.g. `python -m http.server`,
> then open http://localhost:8000 — needed because the 3D model loads via fetch (won't work from file://).
