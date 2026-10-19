# Third-party experiment sources

## Matrix Digital Rain

- Author: Matteo He / **hematteo**.
- Source: https://github.com/hematteo/matrix-rain
- Upstream revision: `3752d0b75fd87911a92682313a02e6520ad88d02`.
- Inspected source: `README.md`, `LICENSE`, `index.html` from that revision.
- License: **CC BY-NC-SA 4.0**; original notice retained in [licenses/matrix-rain.txt](licenses/matrix-rain.txt).
- License text: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
- **Modified for ZY Reklam Matrix hero experiment.**

`src/matrix/renderer.js` adapts the upstream seed/strand, font probing, palette,
projection, glyph rendering, bloom and adaptive governor algorithms. It receives
its host/canvases/options from the TypeScript controller instead of owning the
document, global inputs, URL hash or requestAnimationFrame. ZY additions scope
the effect to the existing hero, honor site motion preferences, account for
expensive draw time, preserve page scroll and provide accessible Turkish controls.
The adaptation of this source retains the same CC BY-NC-SA 4.0 terms.

This is a **local experiment**, not a commercial publication authorization.
The upstream notice excludes commercial use. Additional permission for commercial
publication has not been supplied or verified. Mimo must retain this notice and
resolve that permission before considering commercial publication. No upstream
iframe, external runtime dependency, remotely hosted font or new Three.js renderer
is used. This notice does not relicense unrelated existing ZY Reklam code/assets.
