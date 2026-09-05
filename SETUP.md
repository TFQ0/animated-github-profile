# Project setup and release checks

## Install and run

Use Node.js `^22.13.0` or `>=24.0.0`.

```bash
npm ci
npm run dev
```

Open `http://localhost:4173/`. Vite also prints network URLs when the development server starts.

## Verify a change

```bash
npm run typecheck
npm test
npm run build
```

These checks cover TypeScript, strict config parsing, all eight SVG variants, reduced-motion output, README-to-asset references, deterministic ZIP contents, unsafe input handling, public GitHub import errors, cache validation, and the WebMCP contract.

For a release, also inspect representative long content in desktop/mobile and dark/light previews. Design warnings are advisory because fixed SVG artwork cannot measure browser font metrics during generation.

The preview toolbar can download its currently selected SVG by itself. Use the Export panel's complete ZIP when publishing the full README and all responsive theme variants.

## Production output

`npm run build` creates the static site in `dist/`. The build uses relative asset paths and can be hosted at a domain root or a project subpath.

The `.openai/hosting.json` file connects this repository to its Sites project. Publishing the Studio site and publishing a generated GitHub profile are separate operations.

## Publish a generated GitHub profile

The editor's ZIP contains its own profile-specific `SETUP.md`. In summary:

1. Create or open the public repository `<username>/<username>`.
2. Upload the generated `README.md` and complete `assets/` directory at its root.
3. Keep `profile.config.json` privately or in the repository if you want the profile to remain easy to edit.
4. Commit, visit the GitHub profile, and verify links, text wrapping, theme selection, and reduced motion.

The animated terminal is decorative. It does not execute code or report live checks.
