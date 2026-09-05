# TFQ0 // Quality Control

An animated GitHub profile for Talal Alqahs. The header is an original, self-contained SVG animation. The README contains a short introduction, public projects, a toolbox, and links to pull requests and issues.

## Preview first

Open `preview.html` in a browser after extracting this package. It is self-contained and works without an installation or internet connection. Use the Dark / Light, Desktop / Mobile, Pause, and Replay controls to inspect the design. Those controls are for this local preview only; they are not part of the GitHub profile.

`preview/animated-header.gif` shows one 16-second cycle. The GIF is for previewing, not the default README asset. The SVGs are sharper and smaller. The full-profile PNGs are local mockups, not screenshots of a deployed GitHub page; GitHub controls the surrounding Markdown styling.

## Publish to your existing profile repository

Your public `TFQ0/TFQ0` profile repository already exists. Use that repository rather than creating a different one.

1. Save a copy of your current README locally before replacing it.
2. In `TFQ0/TFQ0`, choose **Add file → Upload files**. Upload the supplied `README.md` and the entire `assets` folder at the repository root. Do not upload the ZIP itself or nest the files inside a `tfq0-profile` folder.
3. Review and commit the change to your default branch (`main` when checked). For an extra review step, commit to a new branch, review its README, and merge it through a pull request.
4. Visit your profile and refresh. Confirm the header loads and the project links are correct.

The required repository layout is:

```text
TFQ0/
├── README.md
└── assets/
    ├── tfq-control-center-dark.svg
    ├── tfq-control-center-light.svg
    ├── tfq-control-center-mobile-dark.svg
    ├── tfq-control-center-mobile-light.svg
    ├── tfq-control-center-dark-static.svg
    ├── tfq-control-center-light-static.svg
    ├── tfq-control-center-mobile-dark-static.svg
    └── tfq-control-center-mobile-light-static.svg
```

Only `README.md` and `assets/` are needed on GitHub. `SETUP.md`, `preview.html`, and `preview/` are optional reference files. Existing unrelated files in your repository do not need to be removed.

GitHub requires a public repository whose name matches your username, with a nonempty root `README.md`, to display it as a profile README. GitHub also supports the `<picture>` element and relative image paths used by this package. See the official references below.

## How the animation behaves

The 16-second sequence types an illustrative command, advances through four demo checks, holds the completed state, and repeats. A small signal moves along the build / test / learn / repeat line. These are decorative demonstrations, not actual CI results, availability indicators, or live metrics. Nothing executes on your machine.

The README selects a compact, stacked header at viewport widths up to 600px. It includes dark and light variants selected through `prefers-color-scheme`. Theme selection depends on the rendering environment's media preferences; it is not a script that reads your GitHub theme setting.

Visitors requesting reduced motion are served dedicated static SVGs by the parent `<picture>` element. The animated SVGs also include their own motion preference handling. Keep the static sources first in the README. This avoids relying solely on propagation of media preferences into an embedded SVG.

The header uses no JavaScript, external fonts, embedded font files, remote badges, tracking pixels, GitHub Actions, access tokens, or third-party rendering services. The browser preview has local JavaScript only for its preview controls.

## Customize

Edit the wording, tools, and project links directly in `README.md`. The SVGs are editable text files: change `TALAL ALQAHS`, the role text, or the palette values in their `<style>` blocks. Apply matching content changes to the animated and static variants.

To change the loop duration, replace every `16s` in each animated SVG with the same new duration, such as `20s`. Do not change just one timeline or the typing and check states will become unsynchronized. The one-second cursor blink and four-second status pulse are independent accents.

The preview HTML embeds copies of the original SVGs. Editing an asset does not automatically update this preview; inspect the edited SVG in a browser or the README in your repository after making changes.

To use only the dark desktop header, replace the README's complete `<picture>...</picture>` block with this smaller version, retaining its reduced-motion fallback:

```html
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="./assets/tfq-control-center-dark-static.svg">
  <img src="./assets/tfq-control-center-dark.svg" width="100%" alt="Talal Alqahs — Software Test Engineer and Independent Developer. Animated QA demo, not live test results.">
</picture>
```

## Validation and limitations

The assets and local preview were checked in Chromium. Validation covered SVG XML parsing; animation in an actual `<img>` element; all eight light/dark, mobile/desktop, motion/reduced-motion image selections; stable static fallbacks; preview controls; absence of external resource requests; and a 390px-wide preview. See `preview/validation.txt` for the check record.

The package has not been uploaded to your GitHub repository. Live GitHub rendering and other browser engines have not been tested. The preview is an approximation of the Markdown presentation; the SVG artwork itself is the supplied asset. A browser, accessibility preference, or renderer may display a static version instead of motion.

## Public content and references

Project descriptions were checked against the public repository READMEs on 5 September 2026. No private project repository, personal email address, or unverified contact link is included.

- [Your existing profile repository](https://github.com/TFQ0/TFQ0)
- [tfq0seo](https://github.com/TFQ0/tfq0seo), [tfq0tool](https://github.com/TFQ0/tfq0tool), and [ksaa-api-tool](https://github.com/TFQ0/ksaa-api-tool)
- [GitHub: Managing your profile README](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)
- [GitHub: Basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [MDN: SVG as an image and embedded-image restrictions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)
