# Volkan Turkut

A minimal personal landing page with a full-screen, GPU-driven particle artwork and links to ArtStation, itch.io, and GitHub.

## Rendering

- Self-contained HTML, CSS, WebGL2, and GLSL; no build step or runtime dependency
- Up to 262,144 GPU-updated particles on desktop, with a smaller workload on narrow screens
- Additive particle trails and curl-field motion for a fluid, filament-like cloud
- Same-origin browser windows can discover one another locally and create a color-coded particle tether
- Pointer interaction, reduced-motion support, a lightweight fallback, and a transparent SVG favicon
- No external fonts, images, paid assets, or services

## Credits

This is an independent implementation inspired by [Entangled by Bjørn Staal](https://www.nonfigurativ.com/projects/entangled) and the [alphardex recreation](https://github.com/alphardex/entangled). It does not include either project's source bundle.

## Free hosting with GitHub Pages

This repository is named `volkanturkut.github.io`, so it can be published at:

**https://volkanturkut.github.io/**

Open **Settings → Pages** in this repository. Under **Build and deployment**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. GitHub Pages publishes the static site after deployment finishes.

## Customize

Edit `index.html` to change the design or profile links. The artwork runs in visitors' browsers; no paid runtime or hosting service is required.
