# Pixel Brawl

A browser-based 2D fighting game built with pure HTML, CSS, and JavaScript — no framework, no build step, no backend, no dependencies.

**Play it live:** https://playpixelbrawl.netlify.app/

For the full breakdown of every mechanic, mode, and system, see [FEATURES.md](FEATURES.md).

## Running locally

Just open `index.html` in a browser — the game only loads same-folder images, so no server is required.

If you'd rather serve it (for example, to test on a phone over the same WiFi network):

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` (or `http://<your-lan-ip>:8000/` from another device).

## Deployment

This site is deployed on **Netlify**, connected directly to this repository — every push to `main` triggers an automatic deploy. There's no build step, so no build command or publish-directory configuration is needed beyond serving the repo root.

## Credits

- **Character sprites** — [2D Fighter 3](https://assetbakery.itch.io/2d-fighter-3), [2D Fighter 4](https://assetbakery.itch.io/-2d-fighter-4), and [2D Fighter 5](https://assetbakery.itch.io/2d-fighter-5) by [Asset Bakery](https://assetbakery.itch.io/), used under their free release terms.
- **Everything else** — code, arenas, sound, and game design by **Raj Patel**.

## License

All rights reserved — see [LICENSE](LICENSE).
