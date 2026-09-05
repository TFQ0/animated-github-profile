import type { ProfileConfig } from "../domain/profile";
import { renderReadme } from "./readme";
import {
  heroFilename,
  heroVariants,
  renderHeroSvg,
  type HeroVariant,
} from "./svg";

export interface GeneratedArtifact {
  path: string;
  content: string;
}

const fixedArchiveDate = new Date("2000-01-01T00:00:00.000Z");

function renderSetup(config: ProfileConfig): string {
  return `# Publish your GitHub profile

1. Create or open the public repository \`${config.identity.username}/${config.identity.username}\`.
2. Upload \`README.md\` and the complete \`assets/\` directory at the repository root.
3. Commit the changes and open your GitHub profile.

Keep \`profile.config.json\` somewhere safe so you can import and edit this profile again.

If this profile uses structured remote media, those images or GIFs are referenced by HTTPS URL and are not included in this ZIP. Viewing them may send a request to their host, and the content may disappear or change later. You are responsible for owning the media or holding permission to publish it and for providing any required notices. Attribution alone does not grant permission. Referencing media does not imply affiliation with or endorsement by its creator, platform, game, studio, publisher, or franchise. The Studio's MIT License does not grant rights to user-supplied or third-party content.

The generated checks and statuses are decorative demonstrations, not live CI results.
`;
}

export function generateHeroArtifact(
  config: ProfileConfig,
  variant: HeroVariant,
): GeneratedArtifact {
  return {
    path: `assets/${heroFilename(variant)}`,
    content: renderHeroSvg(config, variant),
  };
}

export function generateArtifacts(config: ProfileConfig): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = [
    { path: "README.md", content: renderReadme(config) },
    {
      path: "profile.config.json",
      content: `${JSON.stringify(config, null, 2)}\n`,
    },
    { path: "SETUP.md", content: renderSetup(config) },
  ];

  for (const variant of heroVariants) {
    artifacts.push(generateHeroArtifact(config, variant));
  }

  return artifacts;
}

export async function generateZip(config: ProfileConfig): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const artifact of generateArtifacts(config)) {
    zip.file(artifact.path, artifact.content, {
      date: fixedArchiveDate,
      createFolders: false,
    });
  }
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(content: string, filename: string, type = "text/plain"): void {
  downloadBlob(new Blob([content], { type: `${type};charset=utf-8` }), filename);
}
