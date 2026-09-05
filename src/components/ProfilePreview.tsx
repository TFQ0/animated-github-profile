import { lazy, Suspense, type CSSProperties } from "react";
import type { ProfileConfig, SectionKey } from "../domain/profile";
import { renderHeroSvg, type HeroVariant } from "../generator/svg";

interface PreviewProps {
  config: ProfileConfig;
  variant: HeroVariant;
  paused: boolean;
  replayKey: number;
}

const MarkdownPreview = lazy(() => import("./MarkdownPreview"));

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function validHref(value: string): string {
  if (value.startsWith("#")) return value;
  return safeHttpsUrl(value) ?? "#";
}

function PreviewSection({
  config,
  section,
  motion,
}: {
  config: ProfileConfig;
  section: SectionKey;
  motion: HeroVariant["motion"];
}) {
  if (section === "about") {
    return (
      <section className="readme-section" id="preview-about">
        <h2>{config.about.heading || "About"}</h2>
        {config.about.paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph}`}>{paragraph}</p>
        ))}
        {config.about.processLine ? <pre>{config.about.processLine}</pre> : null}
      </section>
    );
  }
  if (section === "repositories") {
    if (config.repositories.length === 0) return null;
    return (
      <section className="readme-section" id="preview-repositories">
        <h2>{config.sectionHeadings.repositories}</h2>
        <div className="repository-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>What it does</th>
                <th>Focus</th>
              </tr>
            </thead>
            <tbody>
              {config.repositories.map((repository) => (
                <tr key={repository.id}>
                  <td>
                    <a href={validHref(repository.url)} target="_blank" rel="noreferrer">
                      {repository.name}
                    </a>
                  </td>
                  <td>{repository.description}</td>
                  <td>{repository.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  if (section === "skills") {
    if (config.skillGroups.length === 0) return null;
    return (
      <section className="readme-section" id="preview-skills">
        <h2>{config.sectionHeadings.skills}</h2>
        {config.skillGroups.map((group) => (
          <div className="skill-group-preview" key={group.id}>
            <strong>{group.label}</strong>
            <div className="skill-pills">
              {group.items.map((item) => (
                <code key={`${group.id}-${item}`}>{item}</code>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }
  if (section === "links") {
    if (config.links.length === 0) return null;
    return (
      <section className="readme-section" id="preview-links">
        <h2>{config.sectionHeadings.links}</h2>
        <p className="preview-links">
          {config.links.map((link, index) => (
            <span key={link.id}>
              {index > 0 ? <span className="link-separator">/</span> : null}
              <a href={validHref(link.url)} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </span>
          ))}
        </p>
      </section>
    );
  }
  if (section === "media") {
    if (config.media.length === 0) return null;
    return (
      <section className="readme-section media-preview-section" id="preview-media">
        <h2>{config.sectionHeadings.media}</h2>
        <div className="media-preview-grid">
          {config.media.map((item) => {
            const primaryUrl = safeHttpsUrl(item.url);
            const reducedMotionUrl = safeHttpsUrl(item.reducedMotionUrl);
            const needsStaticFallback = motion === "static" && item.kind === "gif";
            const imageUrl = needsStaticFallback ? reducedMotionUrl : primaryUrl;
            const sourceUrl = safeHttpsUrl(item.attribution.sourceUrl);
            const licenseUrl = safeHttpsUrl(item.attribution.licenseUrl);
            const hasAttribution = Boolean(
              item.attribution.sourceLabel ||
              sourceUrl ||
              item.attribution.licenseName ||
              licenseUrl,
            );
            const hasDetails = Boolean(item.caption || hasAttribution);
            const widthPercent = Math.min(100, Math.max(25, item.widthPercent));

            return (
              <figure
                className={`media-preview-item media-preview-align-${item.align}`}
                key={item.id}
                style={{ width: `${widthPercent}%` }}
              >
                {imageUrl ? (
                  <img
                    className="media-preview-image"
                    src={imageUrl}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="media-preview-image-unavailable" role="img" aria-label={item.alt}>
                    {needsStaticFallback && primaryUrl
                      ? "Animated media hidden in static preview — add a reduced-motion image."
                      : "Media preview unavailable"}
                  </div>
                )}
                {hasDetails ? (
                  <figcaption className="media-preview-details">
                    {item.caption ? <span className="media-preview-caption">{item.caption}</span> : null}
                    {hasAttribution ? (
                      <span className="media-preview-attribution">
                        {sourceUrl ? (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            referrerPolicy="no-referrer"
                          >
                            {item.attribution.sourceLabel || "Source"}
                          </a>
                        ) : item.attribution.sourceLabel ? (
                          <span>{item.attribution.sourceLabel}</span>
                        ) : null}
                        {(item.attribution.sourceLabel || sourceUrl) &&
                        (item.attribution.licenseName || licenseUrl) ? (
                          <span aria-hidden="true"> · </span>
                        ) : null}
                        {licenseUrl ? (
                          <a
                            href={licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            referrerPolicy="no-referrer"
                          >
                            {item.attribution.licenseName || "License"}
                          </a>
                        ) : item.attribution.licenseName ? (
                          <span>{item.attribution.licenseName}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </section>
    );
  }
  if (!config.custom.heading || !config.custom.markdown.trim()) return null;
  return (
    <section className="readme-section" id="preview-custom">
      <h2>{config.custom.heading}</h2>
      <div className="custom-markdown-preview">
        <Suspense fallback={<p>Rendering Markdown preview…</p>}>
          <MarkdownPreview markdown={config.custom.markdown} />
        </Suspense>
      </div>
    </section>
  );
}

export function ProfilePreview({ config, variant, paused, replayKey }: PreviewProps) {
  const palette = config.appearance[variant.theme];
  const hero = renderHeroSvg(config, variant);
  const style = {
    "--readme-bg": variant.theme === "dark" ? "#0d1117" : "#ffffff",
    "--readme-text": variant.theme === "dark" ? "#e6edf3" : "#1f2328",
    "--readme-border": variant.theme === "dark" ? "#30363d" : "#d0d7de",
    "--readme-code": variant.theme === "dark" ? "#161b22" : "#eff2f5",
    "--readme-accent": palette.accent,
    "--profile-radius": `${config.appearance.cornerRadius}px`,
  } as CSSProperties;
  const navSections = config.sections.filter((section) => {
    if (section === "repositories") return config.repositories.length > 0;
    if (section === "skills") return config.skillGroups.length > 0;
    if (section === "links") return config.links.length > 0;
    if (section === "media") return config.media.length > 0;
    if (section === "custom") return Boolean(config.custom.heading && config.custom.markdown.trim());
    return true;
  });

  return (
    <article
      className={`profile-preview profile-preview-${variant.viewport} ${paused ? "preview-paused" : ""}`}
      style={style}
      data-theme={variant.theme}
      lang={config.accessibility.language}
      dir={config.accessibility.direction}
    >
      <div
        key={`${replayKey}-${variant.theme}-${variant.viewport}-${variant.motion}`}
        className="generated-hero"
        dangerouslySetInnerHTML={{ __html: hero }}
      />
      {navSections.length > 1 ? (
        <nav className="profile-nav" aria-label="Generated profile sections">
          {navSections.map((section) => (
            <span key={section}>
              <a href={`#preview-${section}`}>
                {section === "about"
                  ? config.about.heading
                  : section === "custom"
                    ? config.custom.heading
                    : config.sectionHeadings[section]}
              </a>
            </span>
          ))}
        </nav>
      ) : null}
      {config.sections.map((section) => (
        <PreviewSection key={section} config={config} section={section} motion={variant.motion} />
      ))}
      {config.footer.emphasis || config.footer.line ? (
        <footer className="readme-footer">
          {config.footer.emphasis ? <strong>{config.footer.emphasis}</strong> : null}
          {config.footer.line ? <span>{config.footer.line}</span> : null}
        </footer>
      ) : null}
    </article>
  );
}
