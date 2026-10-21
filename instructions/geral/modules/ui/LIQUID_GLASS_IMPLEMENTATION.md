# JAP Module — Liquid Glass Implementation

**Version:** 1.1  
**Status:** Implementation guidance  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this module only when a task explicitly requests Liquid Glass, glass-like material, translucent layered UI, optical distortion or a related fallback.

Do not apply this visual style to unrelated interfaces.

---

## 2. Goal

Liquid Glass is a responsive translucent material that combines background influence, edge lighting, depth and motion. It is not equivalent to blur alone.

The implementation goal is perceptual quality appropriate to the platform, not physically perfect refraction at any cost.

---

## 3. Fidelity Levels

Choose the lowest level that satisfies the task:

| Level | Technique | Use when |
|---|---|---|
| `L0` | Opaque/tinted fallback | Accessibility, low power or unsupported platform |
| `L1` | Tint, transparency, border, highlight and shadow | Broad compatibility and low cost |
| `L2` | Backdrop blur/material plus responsive highlight | Platform supports native or efficient compositing |
| `L3` | Displacement/refraction shader | The effect is a primary visual feature and performance budget allows it |

Do not implement `L3` when `L1` or `L2` meets the acceptance criteria.

---

## 4. Core Visual Components

A glass-like component MAY combine:

- translucent tint;
- controlled background blur or native material;
- thin light/dark edge contrast;
- subtle inner highlight;
- restrained shadow for separation;
- limited distortion near edges;
- motion linked to pointer, touch or device movement;
- theme-aware foreground contrast.

Avoid stacking several expensive blurred layers over large moving content.

---

## 5. Accessibility Requirements

- Maintain readable foreground contrast in light and dark themes.
- Provide an opaque or less transparent fallback.
- Respect reduced transparency and reduced motion preferences when available.
- Do not encode state only through transparency, blur or color.
- Keep text and critical icons visually stable; do not distort them with the background.
- Test against both simple and visually noisy backgrounds.

Accessibility fallback is part of completion, not an optional improvement, when the target platform exposes the relevant preference.

---

## 6. Performance Rules

- Limit the affected screen area.
- Avoid full-screen blur when a small material region is sufficient.
- Prefer native material APIs over custom shaders when quality is adequate.
- Reduce sample count and animation frequency on constrained devices.
- Do not animate invisible or occluded glass layers.
- Profile on representative low- and mid-tier hardware when high-fidelity effects are required.
- Use static/tinted fallback when the performance target is not met.

Do not claim `60 FPS`, low battery impact or zero CPU cost without measurement.

---

## 7. Apple Platforms

Prefer current native SwiftUI material and Liquid Glass APIs when the deployment target supports them, including task-appropriate use of:

- `glassEffect(_:in:)`;
- `GlassEffectContainer` for coordinated glass shapes;
- platform-provided button or control styles;
- `visualEffect`, `distortionEffect` or `layerEffect` only when custom behavior is required;
- Metal shaders only for justified high-fidelity effects.

Rules:

- guard newer APIs with availability checks;
- provide a fallback for earlier deployment targets;
- do not replace native controls with custom glass solely for appearance;
- respect `accessibilityReduceTransparency` and `accessibilityReduceMotion`;
- verify focus, hover, keyboard and assistive-technology behavior on applicable platforms.

Official reference: [Apple `glassEffect(_:in:)`](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)).

---

## 8. Web

Preferred order:

1. CSS tint, border, highlight and shadow.
2. `backdrop-filter` when supported and appropriate.
3. Carefully scoped SVG or canvas distortion when the background can be sampled correctly.
4. WebGL/WebGPU only for a justified high-fidelity effect.

Always provide a usable fallback for unsupported `backdrop-filter` or graphics APIs.

Do not assume an SVG filter automatically refracts arbitrary content behind a DOM element; verify the actual composition path in the target browser.

---

## 9. Roblox Studio

Roblox `ScreenGui` does not provide a general programmable backdrop-refraction shader equivalent to Metal, WebGL or CSS `backdrop-filter`.

For 2D UI, prefer a lightweight approximation using:

- translucent `Frame` or `CanvasGroup` composition;
- `UIGradient` for controlled highlight/tint;
- `UIStroke` for edge separation;
- restrained shadow images;
- prepared 9-slice textures when a curved optical rim is required;
- minimal motion for hover/press feedback.

For 3D objects, the `Glass` material may contribute a glass-like appearance, but do not describe it as guaranteed physically accurate refraction of every object behind it.

Roblox rules:

- do not add full-screen dynamic effects for a small component;
- do not build a custom rendering system for a simple menu;
- test on mobile as well as desktop when both are supported;
- keep text outside distorted image layers;
- offer an opaque/tinted fallback when clarity or performance is poor.

---

## 10. Validation

Report each applicable check separately:

- visual comparison with acceptance criteria;
- contrast/readability on light, dark and noisy backgrounds;
- reduced-transparency fallback;
- reduced-motion behavior;
- interaction states;
- supported and fallback platform versions;
- representative device performance;
- Roblox `PV` or `MU` category when Roblox validation applies.

Source inspection alone cannot prove final visual quality or performance.

---

## 11. Stop Rule

Stop after the requested component reaches the defined fidelity, accessibility and performance criteria.

Do not propagate Liquid Glass styling to unrelated screens or controls.

**End of module.**

