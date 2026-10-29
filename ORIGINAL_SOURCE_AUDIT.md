# Entangled source and performance audit

Updated 2026-10-29. Upstream baseline: [fire17/entangled-grail / versions/v0-original-entangled](https://github.com/fire17/entangled-grail/tree/main/versions/v0-original-entangled).

## Pristine source archive: 8/8 exact matches

The complete eight-file original source folder is preserved under `original-source/versions/v0-original-entangled/`. The Git blob IDs below match the corresponding upstream files exactly:

| Original file | Git blob ID | Status |
|---|---|---|
| `bundle.min.js` | `a554a6a3046692c50125decc6b094238598535f8` | Exact archive |
| `fxhash.min.js` | `8a91ebf2f97f6c30496aae43b90c01141a0de2df` | Exact archive |
| `three.r157.min.js` | `7a384bfb1b51375a18e6480b984e0834f5525d1c` | Exact archive |
| `bundle.beautified.js` | `f5d0cbd700c64d6aedf7094ab1fff06ef1a05cfe` | Exact archive |
| `ITERATION_COLORS.txt` | `04977253db54288e36a7a23240e6fe45c6343811` | Exact archive |
| `index.html` | `0a0da8986b2783f7e072309058284d09f797c0f7` | Exact archive |
| `scheme_map.js` | `2837db3d7a8116edce593f03ebbebb3888443c26` | Exact archive |
| `scheme_slice.js` | `62dd1f36186e55a11f8889000cda761ea9c05d55` | Exact archive |

The eight original files are preserved for comparison and study; they are excluded from the published Pages output.

## Changes in the active website

The active root `bundle.min.js` is intentionally modified. It is no longer a 100%-identical copy of the original runtime:

1. **GPU workload:** `ut=15e5` (1,500,000) changed to a hardware-aware cap: 16,384 particles on low-resource hardware and 32,768 on standard hardware. That is about **98.9% fewer** particles on low-resource devices and **97.8% fewer** on standard devices.
2. **Window features:** multi-window management is hard-disabled; its manager is not initialized and the screen-permission/window synchronization flow is bypassed.
3. **Input controls:** mouse, touch, drag, and wheel listeners used by the original control class are removed.
4. **Keyboard actions:** the original Space pause, D debug, and S screenshot-save key handler is removed.
5. **Low-DPI behavior:** the old fallback that doubled the internal render size when devicePixelRatio was 1 or less is removed.
6. **Quality governor:** `index.html` uses a private, resize-aware render scale capped at 1.0 on low-resource hardware and 1.25 on standard hardware, and limits the render target to about 1 million pixels. It does not override the browser's native `devicePixelRatio`. This reduces expensive high-DPI and very-large-screen rendering.
7. **Frame governor:** global animation-frame callbacks are capped at 24 FPS on low-resource hardware, 30 FPS on standard hardware, or 15 FPS for `prefers-reduced-motion`.
8. **Graceful fallback:** if JavaScript is disabled, WebGL is unavailable, the renderer fails to initialize, the context is lost, or initialization times out, a simple CSS sphere illustration replaces the WebGL artwork instead of leaving a fully blank page. The no-WebGL path skips the performance governor and renderer dependencies.
9. **Modern source structure:** semantic HTML is in `index.html`, responsive styling in `styles.css`, startup and lazy loading in `app.js`, and hardware-aware scheduling/resolution limits in `performance.js`. Native ECMAScript modules run without a framework, build tools, or runtime CDN.
10. **Runtime resilience:** WebGL is feature-detected; renderer loading has a 30-second watchdog, context-loss fallback, and MutationObserver-based canvas accessibility setup. The observer avoids duplicate canvas listeners and disconnects on initialization timeout. The 30-second watchdog does not treat canvas allocation as successful startup: it requires a positive-sized canvas and at least one governed frame callback, and it stops loading later runtime modules after a timeout.
11. **Responsive resize stability:** expensive renderer resize work is debounced to avoid repeated target-buffer allocations while a mobile browser's viewport changes. The app relays visual-viewport, orientation, page-show, and foreground-tab changes to the renderer after a short settle period. A delayed first-frame check keeps the immediate placeholder visible until the actual generator is running.
12. **Instant first paint:** a vivid CSS artwork is shown before runtime modules finish downloading; independent Three.js and fxhash dependencies begin loading in parallel. The placeholder is only hidden once the WebGL canvas is sized and governed frames have started.
13. **Visual legibility:** canvas saturation and contrast are increased; creator text and social links are larger and brighter with a 36 CSS-pixel minimum link target.
14. **Portfolio shell:** the browser tab title is “Volkan Turkut” (not the artwork title), and the page retains the creator name and ArtStation, itch.io, and GitHub links.

## Automated verification

- `.github/workflows/verify-original-source.yml` checks all eight upstream archive hashes, module syntax, required active-runtime tuning, footer links, the no-JavaScript fallback, local dependencies, removal of obsolete recreation files, and exclusion of reference material from Pages.
- `.github/workflows/browser-smoke.yml` runs Chromium/WebGL smoke tests for desktop, phone, small Android-sized, tablet, reduced-motion, and large-monitor profiles, simulating low- and standard-resource hardware. It checks render-pixel/DPR caps, callback throttling, viewport overflow, larger footer text, browser title, color filtering, JavaScript exceptions, failed runtime assets, disabled multi-window/input features, and visible artwork pixels. It also simulates slow initial dependency loading to verify that art appears immediately, and changes viewport sizes from small to large and back on desktop and phone profiles to test canvas sizing and continued frame callbacks. Separate cases exercise no-WebGL, JavaScript-disabled, simulated WebGL-context-loss (including a check that frame counts stop increasing), and stalled-renderer watchdog fallbacks; the no-WebGL case verifies the performance governor and renderer dependencies are not downloaded. The watchdog regression test supplies a pre-sized canvas but stalls the first runtime import to ensure allocation alone cannot suppress recovery. The workflow uploads a desktop screenshot. It deliberately avoids running the original 1.5-million-particle renderer as a comparison fixture because that heavy baseline can dominate a low-resource runner.
- GitHub Pages builds must still pass before the browser smoke workflow is triggered. A separate `.github/workflows/live-smoke.yml` workflow checks the actual published URL and its runtime assets after a successful Pages deployment, including the performance marker and the private source archive exclusion. The workflow's latest result is available in Actions.

## Percentage interpretation

- **Archived original source identity:** 8/8 files exact (100%).
- **Active runtime identity:** intentionally modified to disable features and reduce workload; therefore **not 100% identical** to the original bundle.
- **Visual similarity:** the renderer logic and palette source are preserved, but the further-reduced particle budget and disabled interaction/window system may change some details. Pixel-identical parity is not the goal after this performance pass.
- **Hardware guarantee:** no static test can guarantee all devices hit 30 FPS. The design instead caps work and provides a no-WebGL fallback; the device matrix tests representative browser viewports, not every physical hardware/GPU combination.

## Third-party rights

The upstream repository states that the original artwork is © Bjørn Staal and that rights remain with the artist; the upstream MIT license does not automatically relicense the artwork or original bundle. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) and the upstream [NOTICE.md](https://github.com/fire17/entangled-grail/blob/main/NOTICE.md).
