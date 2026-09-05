import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  cloneDefaultConfig,
  parseProfileConfig,
  profileConfigSchema,
} from "../domain/profile";
import { applyDesignPreset, designPresets } from "../domain/presets";
import { generateArtifacts, generateHeroArtifact, generateZip } from "./artifacts";
import { cleanText, escapeTableCell, sanitizeMarkdown } from "./escape";
import { renderReadme } from "./readme";
import { heroVariants, renderHeroSvg } from "./svg";

describe("profile artifact generation", () => {
  it("generates the complete deterministic profile bundle", () => {
    const config = cloneDefaultConfig();
    const first = generateArtifacts(config);
    const second = generateArtifacts(config);

    expect(first).toEqual(second);
    expect(first).toHaveLength(11);
    expect(new Set(first.map((artifact) => artifact.path)).size).toBe(11);
    expect(first.filter((artifact) => artifact.path.endsWith(".svg"))).toHaveLength(8);
    expect(first.map((artifact) => artifact.path)).toEqual([
      "README.md",
      "profile.config.json",
      "SETUP.md",
      "assets/profile-header-dark.svg",
      "assets/profile-header-light.svg",
      "assets/profile-header-mobile-dark.svg",
      "assets/profile-header-mobile-light.svg",
      "assets/profile-header-dark-static.svg",
      "assets/profile-header-light-static.svg",
      "assets/profile-header-mobile-dark-static.svg",
      "assets/profile-header-mobile-light-static.svg",
    ]);
  });

  it("emits parseable, self-contained SVG for every supported variant", () => {
    const config = cloneDefaultConfig();

    for (const variant of heroVariants) {
      const svg = renderHeroSvg(config, variant);
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");

      expect(document.querySelector("parsererror"), JSON.stringify(variant)).toBeNull();
      expect(document.documentElement.tagName).toBe("svg");
      expect(svg).not.toMatch(/\b(?:undefined|null|NaN)\b/);
      expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=/i);
      expect(svg).not.toMatch(/(?:href|src)=["']https?:/i);

      if (variant.motion === "static") {
        expect(svg).not.toContain("@keyframes");
        expect(svg).not.toContain("animation:");
      } else {
        expect(svg).toContain("@keyframes");
        expect(svg).toContain("prefers-reduced-motion:no-preference");
      }
    }
  });

  it("exports any selected hero variant as the same standalone SVG used by the bundle", () => {
    const config = cloneDefaultConfig();
    const bundle = generateArtifacts(config);

    for (const variant of heroVariants) {
      const artifact = generateHeroArtifact(config, variant);
      expect(artifact.path).toMatch(/^assets\/profile-header.*\.svg$/);
      expect(artifact.content).toBe(renderHeroSvg(config, variant));
      expect(bundle).toContainEqual(artifact);
    }
  });

  it("fits schema-valid wide text inside fixed SVG regions", () => {
    const config = cloneDefaultConfig();
    config.identity.brandMark = "WWWWWWWWWWWW";
    config.identity.profileLabel = "WWWWWWWWWWWWWWWWWWWW";
    config.hero.headline = ["W".repeat(24), "W".repeat(24), "W".repeat(24)];
    const valid = profileConfigSchema.parse(config);
    const svg = renderHeroSvg(valid, {
      viewport: "mobile",
      theme: "dark",
      motion: "static",
    });

    expect(svg).toContain("textLength=");
    expect(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")).toBeNull();
  });

  it("keeps workflow labels inside the content surface above one footer boundary", () => {
    const config = cloneDefaultConfig();

    const desktop = renderHeroSvg(config, {
      viewport: "desktop",
      theme: "dark",
      motion: "static",
    });
    const mobile = renderHeroSvg(config, {
      viewport: "mobile",
      theme: "dark",
      motion: "static",
    });

    expect(desktop).toContain('<rect x="1" y="64" width="1198" height="503" class="surface"/>');
    expect(desktop).toContain('<path d="M30 567H1170" class="line"/>');
    expect(mobile).toContain('<rect x="1" y="64" width="618" height="823" class="surface"/>');
    expect(mobile).toContain('<path d="M30 887H590" class="line"/>');
  });

  it("keeps README asset references in sync with the generated files", () => {
    const artifacts = generateArtifacts(cloneDefaultConfig());
    const paths = new Set(artifacts.map((artifact) => artifact.path));
    const readme = artifacts.find((artifact) => artifact.path === "README.md")!.content;
    const references = [...readme.matchAll(/(?:src|srcset)="\.\/([^"]+)"/g)].map(
      (match) => match[1]!,
    );

    expect(references).toHaveLength(9);
    expect(new Set(references).size).toBe(8);
    for (const reference of references) expect(paths.has(reference)).toBe(true);
  });

  it("escapes hostile XML, HTML attributes, and unsafe custom Markdown links", () => {
    const config = cloneDefaultConfig();
    config.identity.displayName = `A "quoted" <name>`;
    config.hero.checks[0] = `</text><script>x</script>`;
    config.custom = {
      heading: "Notes",
      markdown: `<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))`,
    };
    config.sections.push("custom");

    const svg = renderHeroSvg(config, heroVariants[0]!);
    const readme = renderReadme(config);

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;/text&gt;&lt;script&gt;x&lt;/script&gt;");
    expect(readme).toContain("A &quot;quoted&quot; &lt;name&gt;");
    expect(readme).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(readme).not.toContain("](javascript:");
  });

  it("sanitizes reference links without rewriting code or balanced HTTPS links", () => {
    const markdown = [
      "[unsafe][target]",
      "[target]: javascript:alert(1)",
      "[safe](https://example.com/wiki/Function_(mathematics))",
      "`[code](javascript:example)`",
      "```md",
      "[fenced](javascript:example)",
      "```",
    ].join("\n");
    const sanitized = sanitizeMarkdown(markdown);

    expect(sanitized).toContain("[target]: #");
    expect(sanitized).toContain("[safe](https://example.com/wiki/Function_%28mathematics%29)");
    expect(sanitized).toContain("`[code](javascript:example)`");
    expect(sanitized).toContain("[fenced](javascript:example)");
  });

  it("normalizes table line endings and removes invalid Unicode surrogates", () => {
    expect(escapeTableCell("first\rsecond\nthird\r\nfourth")).toBe(
      "first second third fourth",
    );
    expect(cleanText(`safe\ud800 text \ud83d\ude80`)).toBe("safe text 🚀");
  });

  it("round-trips valid config and rejects unknown or unsafe values", () => {
    const config = cloneDefaultConfig();
    const roundTripped = parseProfileConfig(JSON.parse(JSON.stringify(config)));

    expect(roundTripped).toEqual(config);
    expect(profileConfigSchema.safeParse({ ...config, unexpected: true }).success).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        identity: { ...config.identity, username: "bad--name" },
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "unsafe", label: "Unsafe", url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "credentials", label: "Credentials", url: "https://user:pass@example.com" }],
      }).success,
    ).toBe(false);
    expect(
      profileConfigSchema.safeParse({
        ...config,
        links: [{ id: "broken", label: "Broken", url: "not a url" }],
      }).success,
    ).toBe(false);
    expect(() => parseProfileConfig({ schemaVersion: 3 })).toThrow(
      "Unsupported profile configuration version: 3",
    );

    const earlierV1 = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
    earlierV1.schemaVersion = 1;
    delete earlierV1.template;
    delete earlierV1.accessibility;
    delete earlierV1.media;
    delete (earlierV1.hero as Record<string, unknown>).labels;
    delete (earlierV1.appearance as Record<string, unknown>).fontId;
    delete (earlierV1.sectionHeadings as Record<string, unknown>).media;
    const migrated = parseProfileConfig(earlierV1);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.template).toEqual({ id: "quality-control", version: 1 });
    expect(migrated.hero.labels.passed).toBe("PASS");
    expect(migrated.accessibility.language).toBe("en");
    expect(migrated.appearance.fontId).toBe("modern");
    expect(migrated.media).toEqual([]);
    expect(migrated.sections).not.toContain("media");
  });

  it("applies every trusted design without replacing personal content", () => {
    const source = cloneDefaultConfig();
    source.identity.displayName = "Personal Name";
    source.custom = { heading: "Personal notes", markdown: "Keep this content." };
    const original = structuredClone(source);

    expect(new Set(designPresets.map((preset) => preset.id)).size).toBe(designPresets.length);
    for (const preset of designPresets) {
      const applied = applyDesignPreset(source, preset.id);
      expect(applied).not.toBe(source);
      expect(applied.identity).toEqual(source.identity);
      expect(applied.repositories).toEqual(source.repositories);
      expect(applied.custom).toEqual(source.custom);
      expect(applied.template.id).toBe(preset.id);
      expect(profileConfigSchema.safeParse(applied).success).toBe(true);

      for (const variant of heroVariants) {
        const svg = renderHeroSvg(applied, variant);
        expect(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")).toBeNull();
        expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=/i);
        expect(svg).not.toMatch(/(?:href|src)=["']https?:/i);
      }
    }
    expect(source).toEqual(original);
  });

  it("validates and safely renders structured remote media without bundling it", () => {
    const config = cloneDefaultConfig();
    config.media = [
      {
        id: "featured-animation",
        kind: "gif",
        url: "https://cdn.example.com/scene.gif?first=1&second=2",
        reducedMotionUrl: "https://cdn.example.com/scene-still.png",
        alt: `A "neon" scene <without flashing>`,
        caption: "A custom visual & short caption.",
        widthPercent: 75,
        align: "center",
        attribution: {
          sourceLabel: "Original creator <studio>",
          sourceUrl: "https://example.com/source?first=1&second=2",
          licenseName: "Used with permission",
          licenseUrl: "https://example.com/terms",
        },
      },
    ];
    config.sections = ["media"];
    const valid = profileConfigSchema.parse(config);
    const readme = renderReadme(valid);

    expect(readme).toContain('<a id="media"></a>');
    expect(readme).toContain('media="(prefers-reduced-motion: reduce)"');
    expect(readme).toContain("scene.gif?first=1&amp;second=2");
    expect(readme).toContain('alt="A &quot;neon&quot; scene &lt;without flashing&gt;"');
    expect(readme).toContain("Original creator &lt;studio&gt;");
    expect(readme).toContain('width="75%"');

    const svg = renderHeroSvg(valid, heroVariants[0]!);
    expect(svg).not.toContain("cdn.example.com");
    const artifacts = generateArtifacts(valid);
    expect(artifacts).toHaveLength(11);
    expect(artifacts.some((artifact) => artifact.path.includes("featured-animation"))).toBe(false);
  });

  it("rejects unsafe media, invalid font IDs, and duplicate media IDs", () => {
    const config = cloneDefaultConfig();
    const media = {
      id: "media-one",
      kind: "image" as const,
      url: "https://example.com/image.png",
      reducedMotionUrl: "",
      alt: "Example artwork",
      caption: "",
      widthPercent: 100,
      align: "center" as const,
      attribution: { sourceLabel: "", sourceUrl: "", licenseName: "", licenseUrl: "" },
    };

    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "http://example.com/a.gif" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "data:image/gif;base64,AA==" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, url: "https://user:pass@example.com/a.gif" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [{ ...media, alt: "" }] }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, appearance: { ...config.appearance, fontId: "url(https://evil.example/font)" } }).success).toBe(false);
    expect(profileConfigSchema.safeParse({ ...config, media: [media, { ...media, id: "MEDIA-ONE" }] }).success).toBe(false);
  });

  it("emits stable targets for every generated navigation link", () => {
    const config = cloneDefaultConfig();
    config.custom = { heading: "Anything you like", markdown: "Custom content." };
    config.sections.push("custom");
    const readme = renderReadme(config);
    const targets = [...readme.matchAll(/<a href="#([^"]+)">/g)].map((match) => match[1]!);

    expect(targets).toEqual(["about", "selected-work", "skills", "links", "custom"]);
    for (const target of targets) expect(readme).toContain(`<a id="${target}"></a>`);
  });

  it("creates a ZIP whose entries match the generated artifacts", async () => {
    const config = cloneDefaultConfig();
    const expected = generateArtifacts(config);
    const zipBlob = await generateZip(config);
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());

    for (const artifact of expected) {
      expect(await zip.file(artifact.path)?.async("string")).toBe(artifact.content);
    }
    expect(zip.files["assets/"]).toBeUndefined();

    const secondZipBlob = await generateZip(config);
    expect(new Uint8Array(await secondZipBlob.arrayBuffer())).toEqual(
      new Uint8Array(await zipBlob.arrayBuffer()),
    );
  });
});
