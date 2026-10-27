# Entangled source and performance audit

Updated 2026-10-27. Upstream baseline: [fire17/entangled-grail / versions/v0-original-entangled](https://github.com/fire17/entangled-grail/tree/main/versions/v0-original-entangled).

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

1. **GPU workload:** `ut=15e5` (1,500,000) changed to `ut=65536` (65,536), reducing this configured particle workload by approximately **95.6%**.
2. **Window features:** multi-window management is hard-disabled; its manager is not initialized and the screen-permission/window synchronization flow is bypassed.
3. **Input controls:** mouse, touch, drag, and wheel listeners used by the original control class are removed.
4. **Keyboard actions:** the original Space pause, D debug, and S screenshot-save key handler is removed.
5. **Low-DPI behavior:** the old fallback that doubled the internal render size when devicePixelRatio was 1 or less is removed.
6. **Quality governor:** `index.html` caps effective device-pixel ratio at 1.25 and limits the render target to about 1.5 million pixels. This reduces expensive high-DPI and very-large-screen rendering.
7. **Frame governor:** global animation-frame callbacks are capped at 30 FPS, or 15 FPS for `prefers-reduced-motion`.
8. **Graceful fallback:** if the browser lacks the WebGL API or the renderer fails to initialize, a simple CSS sphere illustration replaces the WebGL artwork instead of leaving a fully blank page.
9. **Portfolio shell:** the root HTML retains the creator name and ArtStation, itch.io, and GitHub links. The page remains local/static, with no external font or runtime CDN.

## Automated verification

- `.github/workflows/verify-original-source.yml` checks all eight upstream archive hashes, required active-runtime tuning, footer links, local dependencies, removal of obsolete recreation files, and exclusion of reference material from Pages.
- `.github/workflows/browser-smoke.yml` runs a Chromium/WebGL smoke test on the checked-out build for desktop, phone, small Android-sized, tablet, and large-monitor viewports. It measures whether the effective pixel ratio/render pixel budget and frame throttle are respected; checks JavaScript exceptions, runtime asset errors, that multi-window storage is not initialized, and that a screenshot contains visible artwork pixels; and uploads a desktop screenshot. The test deliberately avoids running the original 1.5-million-particle renderer as a comparison fixture because that heavy baseline can dominate a low-resource runner.
- GitHub Pages builds must still pass before the browser smoke workflow is triggered. The workflow's latest result is available in Actions.

## Percentage interpretation

- **Archived original source identity:** 8/8 files exact (100%).
- **Active runtime identity:** intentionally modified to disable features and reduce workload; therefore **not 100% identical** to the original bundle.
- **Visual similarity:** the renderer logic and palette source are preserved, but the further-reduced particle budget and disabled interaction/window system may change some details. Pixel-identical parity is not the goal after this performance pass.
- **Hardware guarantee:** no static test can guarantee all devices hit 30 FPS. The design instead caps work and provides a no-WebGL fallback; the device matrix tests representative browser viewports, not every physical hardware/GPU combination.

## Third-party rights

The upstream repository states that the original artwork is © Bjørn Staal and that rights remain with the artist; the upstream MIT license does not automatically relicense the artwork or original bundle. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) and the upstream [NOTICE.md](https://github.com/fire17/entangled-grail/blob/main/NOTICE.md).
