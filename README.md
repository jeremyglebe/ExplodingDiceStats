# Exploding Dice

A small, presentation-style guide to exploding-dice averages and probabilities.

The site is intentionally plain HTML, CSS, and JavaScript. The original Python experiments and math notes remain in the repository; the interactive calculator translates their useful formulas into browser-side JavaScript. Chart.js draws the probability curve.

## Run locally

Serve the repository root with any static file server, then open `index.html`. For example:

```sh
python3 -m http.server 8000
```

## Publish

The workflow in `.github/workflows/deploy-pages.yml` publishes the repository root to GitHub Pages whenever `main` changes. In the repository’s **Settings → Pages**, set the source to **GitHub Actions** once if it is not already selected.

