# Aeterna — Chronographe 312

A premium watch-brand site for a fictional Swiss house. Static: plain HTML, CSS
and vanilla JavaScript, with no build step and no dependencies to install.

> Demonstration site. No payment is taken and nothing is shipped.

## Running it locally

Any static file server will do. Because a couple of sections prefetch the
scroll video with `fetch()`, opening the `.html` files directly from disk
(`file://`) leaves those two sections dead while the rest of the site looks
fine — so serve it rather than double-clicking it.

```bash
python -m http.server 8138
```

Then open <http://localhost:8138/>.

## Pages

| File | |
| --- | --- |
| `index.html` | Home, with the scroll-driven hero |
| `collection.html` | The twelve references, filterable |
| `product.html` | Product detail, driven by `?ref=<slug>` |
| `craftsmanship.html` | Scroll-scrubbed disassembly film and the eight components |
| `journal.html` | Editorial |
| `about.html` · `contact.html` | |

## Layout

```
assets/
  site.css · site.js        shared chrome, bag and wishlist drawers
  catalogue.js              the twelve watches — single source of truth
  home · collection · craft · product · editorial · contact  (.css/.js)
  hero-scrub.mp4            the scroll film
  watches/                  12 references × 7 images
  parts/ · journal/ · fonts/
```

`catalogue.js` drives the collection grid, the product pages and both drawers.
Changing a watch there changes it everywhere.

## Notes

- State (bag, wishlist) lives in `localStorage`; there is no backend.
- Motion respects `prefers-reduced-motion` throughout.
- All asset paths are relative, so the site can be served from a subdirectory.
- `sitemap.xml`, `robots.txt` and the `<link rel="canonical">` tags still carry
  the placeholder domain `example.com` — update them to the real origin before
  treating the site as published.
