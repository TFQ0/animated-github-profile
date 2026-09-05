import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import {
  cloneDefaultConfig,
  createId,
  createBlankConfig,
  parseProfileConfig,
  profileConfigSchema,
  type FontId,
  type MediaItem,
  type Palette,
  type ProfileConfig,
  type ProfileLink,
  type Repository,
  type SectionKey,
  type SkillGroup,
} from "./domain/profile";
import {
  applyDesignPreset,
  designPresets,
  isDesignPresetActive,
} from "./domain/presets";
import {
  downloadBlob,
  downloadText,
  generateArtifacts,
  generateHeroArtifact,
  generateZip,
} from "./generator/artifacts";
import { renderReadme } from "./generator/readme";
import type {
  HeroMotion,
  HeroTheme,
  HeroVariant,
  HeroViewport,
} from "./generator/svg";
import {
  fetchPublicRepositories,
  parseCachedRepositories,
  type ImportedRepository,
} from "./services/github";
import {
  ColorField,
  CommaListField,
  EditorCard,
  ItemActions,
  SelectField,
  TextArea,
  TextField,
} from "./components/Fields";
import { ProfilePreview } from "./components/ProfilePreview";
import { registerProfileWebMcpTools } from "./webmcp";

type PanelKey =
  | "design"
  | "profile"
  | "hero"
  | "projects"
  | "skills"
  | "links"
  | "media"
  | "style"
  | "sections"
  | "export";

type Notice = { tone: "success" | "error" | "info"; message: string } | null;

type DesignSnapshot = {
  template: ProfileConfig["template"];
  appearance: ProfileConfig["appearance"];
  layout: ProfileConfig["layout"];
  workflowStyle: ProfileConfig["hero"]["workflow"]["style"];
};

const storageKey = "animated-profile-studio:config:v3";
const legacyStorageKeys = [
  "animated-profile-studio:config:v2",
  "animated-profile-studio:config:v1",
] as const;
const githubCachePrefix = "animated-profile-studio:github:";
// Recognizes the content bundled before this neutral sample without shipping it as readable data.
const retiredBundledContentFingerprint = 3_805_495_506;
const allSections: SectionKey[] = [
  "about",
  "repositories",
  "skills",
  "links",
  "media",
  "custom",
];

const panels: Array<{
  key: PanelKey;
  label: string;
  short: string;
  description: string;
  group: "start" | "content" | "finish";
}> = [
  { key: "design", label: "Design", short: "01", description: "Templates, layout, and shapes", group: "start" },
  { key: "profile", label: "Profile", short: "02", description: "Identity and about", group: "content" },
  { key: "hero", label: "Hero", short: "03", description: "Header and motion", group: "content" },
  { key: "projects", label: "Projects", short: "04", description: "Featured repositories", group: "content" },
  { key: "skills", label: "Skills", short: "05", description: "Tools and strengths", group: "content" },
  { key: "links", label: "Links", short: "06", description: "Social destinations", group: "content" },
  { key: "media", label: "Media", short: "07", description: "Images and GIFs", group: "content" },
  { key: "style", label: "Colors", short: "08", description: "Palette and corners", group: "finish" },
  { key: "sections", label: "Sections", short: "09", description: "Order and wording", group: "finish" },
  { key: "export", label: "Export", short: "10", description: "Review and download", group: "finish" },
];

const panelGroups = [
  { key: "start", label: "Start" },
  { key: "content", label: "Content" },
  { key: "finish", label: "Finish" },
] as const;

const fontOptions: ReadonlyArray<{ value: FontId; label: string }> = [
  { value: "modern", label: "Modern sans" },
  { value: "mono", label: "Terminal mono" },
  { value: "classic", label: "Classic serif" },
  { value: "rounded", label: "Rounded display" },
];

const compositionOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["composition"]; label: string }> = [
  { value: "split", label: "Split dashboard" },
  { value: "stacked", label: "Centered console" },
  { value: "terminal-focus", label: "Terminal scoreboard" },
  { value: "hud-grid", label: "Diagonal HUD" },
  { value: "bento", label: "Bento cards" },
  { value: "poster", label: "Signal poster" },
];

const contentOrderOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["contentOrder"]; label: string }> = [
  { value: "identity-first", label: "Identity first" },
  { value: "terminal-first", label: "Terminal first" },
];

const densityOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["density"]; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

const shapeSystemOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["shapeSystem"]; label: string }> = [
  { value: "rounded", label: "Rounded panels" },
  { value: "terminal", label: "Terminal blocks" },
  { value: "pixel", label: "Pixel corners" },
  { value: "hud", label: "Chamfered HUD" },
];

const patternOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["pattern"]; label: string }> = [
  { value: "dots", label: "Dot matrix" },
  { value: "grid", label: "Blueprint grid" },
  { value: "scanlines", label: "Scanlines" },
  { value: "circuit", label: "Circuit traces" },
  { value: "none", label: "Clean surface" },
];

const terminalStyleOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["terminalStyle"]; label: string }> = [
  { value: "window", label: "Window chrome" },
  { value: "panel", label: "System panel" },
  { value: "minimal", label: "Minimal strip" },
];

const textAlignOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["textAlign"]; label: string }> = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
];

const workflowStyleOptions: ReadonlyArray<{ value: ProfileConfig["hero"]["workflow"]["style"]; label: string }> = [
  { value: "timeline", label: "Timeline" },
  { value: "command-chain", label: "Command chain" },
  { value: "arcade-track", label: "Arcade track" },
  { value: "telemetry", label: "Telemetry rail" },
  { value: "cards", label: "Step cards" },
  { value: "minimal", label: "Minimal markers" },
];

const workflowShapeOptions: ReadonlyArray<{ value: ProfileConfig["hero"]["workflow"]["steps"][number]["shape"]; label: string }> = [
  { value: "auto", label: "Follow design" },
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
  { value: "hexagon", label: "Hexagon" },
];

const decorationShapeOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["decorations"][number]["shape"]; label: string }> = [
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
  { value: "cross", label: "Cross" },
  { value: "line", label: "Line" },
];

const decorationToneOptions: ReadonlyArray<{ value: ProfileConfig["layout"]["decorations"][number]["tone"]; label: string }> = [
  { value: "accent", label: "Accent" },
  { value: "accent-soft", label: "Soft accent" },
  { value: "line", label: "Line" },
  { value: "muted", label: "Muted" },
];

function sectionLabel(section: SectionKey): string {
  if (section === "repositories") return "Featured projects";
  if (section === "media") return "Images & GIFs";
  return section.charAt(0).toUpperCase() + section.slice(1);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const currentItem = next[index]!;
  next[index] = next[target]!;
  next[target] = currentItem;
  return next;
}

function profileContentFingerprint(config: ProfileConfig): number {
  const value = JSON.stringify([
    [
      config.identity.username,
      config.identity.displayName,
      config.identity.brandMark,
      config.identity.headerLabel,
      config.identity.profileLabel,
      config.identity.eyebrow,
      config.identity.primaryRole,
      config.identity.secondaryRole,
    ],
    [
      config.hero.headline,
      config.hero.command,
      config.hero.checks,
      config.hero.completionMessage,
      config.hero.idleMessage,
      [
        config.hero.labels.host,
        config.hero.labels.demoRun,
        config.hero.labels.queued,
        config.hero.labels.running,
        config.hero.labels.passed,
        config.hero.labels.workflow,
      ],
      config.hero.workflow.steps.map((step) => [step.id, step.label]),
      config.hero.footerLeft,
      config.hero.footerRight,
    ],
    [config.about.heading, config.about.paragraphs, config.about.processLine],
    config.repositories.map((repository) => [
      repository.id,
      repository.name,
      repository.url,
      repository.description,
      repository.focus,
    ]),
    config.skillGroups.map((group) => [group.id, group.label, group.items]),
    config.links.map((link) => [link.id, link.label, link.url]),
    [config.custom.heading, config.custom.markdown],
    [
      config.sectionHeadings.repositories,
      config.sectionHeadings.skills,
      config.sectionHeadings.links,
      config.sectionHeadings.media,
    ],
    [config.footer.emphasis, config.footer.line],
  ]);
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function loadInitialConfig(): ProfileConfig {
  for (const key of [storageKey, ...legacyStorageKeys]) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = parseProfileConfig(JSON.parse(saved));
        if (profileContentFingerprint(parsed) === retiredBundledContentFingerprint) {
          const replacement = cloneDefaultConfig();
          replacement.template = parsed.template;
          replacement.layout = parsed.layout;
          replacement.appearance = parsed.appearance;
          replacement.accessibility = parsed.accessibility;
          replacement.media = parsed.media;
          replacement.sections = parsed.sections;
          replacement.hero.animationDuration = parsed.hero.animationDuration;
          replacement.hero.workflow.style = parsed.hero.workflow.style;
          replacement.hero.workflow.steps = replacement.hero.workflow.steps.map((step, index) => ({
            ...step,
            shape: parsed.hero.workflow.steps[index]?.shape ?? step.shape,
          }));
          localStorage.removeItem(key);
          return replacement;
        }

        return parsed;
      }
    } catch {
      // Try the legacy draft before falling back to the built-in example.
    }
  }
  return cloneDefaultConfig();
}

function isSafeHttpsInput(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channels = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(first: string, second: string): number | null {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  if (firstLuminance === null || secondLuminance === null) return null;
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getWarnings(config: ProfileConfig): string[] {
  const warnings: string[] = [];
  if (config.hero.headline.some((line) => line.length > 18)) {
    warnings.push("A headline line may be tight on the mobile header.");
  }
  if (config.hero.command.length > 24) {
    warnings.push("The terminal command may be clipped on smaller layouts.");
  }
  if (config.hero.checks.some((check) => check.length > 18)) {
    warnings.push("A check label may overlap its status on mobile.");
  }
  if (config.identity.secondaryRole.length > 40) {
    warnings.push("The secondary role may be tight on mobile.");
  }
  if (config.identity.brandMark.length > 7 || config.identity.headerLabel.length > 20) {
    warnings.push("The header mark and label may compete for space.");
  }
  if (config.identity.profileLabel.length > 14) {
    warnings.push("The profile badge may be tight in the mobile header.");
  }
  if (config.identity.eyebrow.length > 24) {
    warnings.push("The eyebrow name may be tight on mobile.");
  }
  if (config.hero.footerLeft.length > 24 || config.hero.footerRight.length > 34) {
    warnings.push("A hero footer label may be clipped on mobile.");
  }
  const gifsWithoutFallback = config.media.filter(
    (item) => item.kind === "gif" && !item.reducedMotionUrl,
  ).length;
  if (gifsWithoutFallback) {
    warnings.push(
      `${gifsWithoutFallback} animated media item${gifsWithoutFallback === 1 ? " has" : "s have"} no reduced-motion fallback.`,
    );
  }
  const mediaWithoutSource = config.media.filter(
    (item) => !item.attribution.sourceLabel && !item.attribution.licenseName,
  ).length;
  if (mediaWithoutSource) {
    warnings.push(
      `Verify usage rights for ${mediaWithoutSource} media item${mediaWithoutSource === 1 ? "" : "s"}; attribution alone does not grant permission.`,
    );
  }
  for (const theme of ["dark", "light"] as const) {
    const palette = config.appearance[theme];
    const foregrounds = [
      ["text", palette.text],
      ["muted", palette.muted],
      ["accent", palette.accent],
    ] as const;
    const backgrounds = [
      ["background", palette.background],
      ["surface", palette.surface],
      ["terminal", palette.terminal],
    ] as const;
    const failures: string[] = [];
    for (const [foregroundName, foreground] of foregrounds) {
      for (const [backgroundName, background] of backgrounds) {
        const ratio = contrastRatio(foreground, background);
        if (ratio !== null && ratio < 4.5) {
          failures.push(`${foregroundName}/${backgroundName} ${ratio.toFixed(1)}:1`);
        }
      }
    }
    const accentSoftRatio = contrastRatio(palette.accent, palette.accentSoft);
    if (accentSoftRatio !== null && accentSoftRatio < 4.5) {
      failures.push(`accent/accent soft ${accentSoftRatio.toFixed(1)}:1`);
    }
    if (failures.length) {
      warnings.push(
        `${theme === "dark" ? "Dark" : "Light"} palette has low contrast: ${failures.slice(0, 3).join(", ")}${failures.length > 3 ? ` (+${failures.length - 3} more)` : ""}.`,
      );
    }
  }
  return warnings;
}

function sanitizedDownloadName(username: string): string {
  const clean = username.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return `${clean || "github"}-profile`;
}

export default function App() {
  const [config, setConfig] = useState<ProfileConfig>(loadInitialConfig);
  const [activePanel, setActivePanel] = useState<PanelKey>("design");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [theme, setTheme] = useState<HeroTheme>("dark");
  const [viewport, setViewport] = useState<HeroViewport>("desktop");
  const [motion, setMotion] = useState<HeroMotion>(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "static" : "animated",
  );
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [repoQuery, setRepoQuery] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [importedRepositories, setImportedRepositories] = useState<ImportedRepository[]>([]);
  const [isImportingRepositories, setIsImportingRepositories] = useState(false);
  const [repositoryError, setRepositoryError] = useState("");
  const [showForks, setShowForks] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [designUndo, setDesignUndo] = useState<DesignSnapshot | null>(null);
  const configFileInput = useRef<HTMLInputElement>(null);
  const editorPane = useRef<HTMLElement>(null);
  const editorScroll = useRef<HTMLDivElement>(null);
  const stepRail = useRef<HTMLElement>(null);
  const importAbortController = useRef<AbortController | null>(null);
  const configSnapshot = useRef(config);
  configSnapshot.current = config;

  const validation = useMemo(() => profileConfigSchema.safeParse(config), [config]);
  const warnings = useMemo(() => getWarnings(config), [config]);
  const readme = useMemo(() => {
    if (!validation.success) return "";
    return renderReadme(validation.data);
  }, [validation]);
  const artifacts = useMemo(
    () => (validation.success ? generateArtifacts(validation.data) : []),
    [validation],
  );
  const orderedSectionOptions = useMemo(
    () => [
      ...config.sections,
      ...allSections.filter((section) => !config.sections.includes(section)),
    ],
    [config.sections],
  );
  const variant: HeroVariant = { theme, viewport, motion };

  const activePanelIndex = panels.findIndex((panel) => panel.key === activePanel);
  const activePanelDetails = panels[activePanelIndex] ?? panels[0]!;

  function selectPanel(panel: PanelKey) {
    setActivePanel(panel);
    window.requestAnimationFrame(() => {
      editorScroll.current?.scrollTo({ top: 0 });
      stepRail.current
        ?.querySelector<HTMLElement>(`#step-${panel}`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
      if (window.matchMedia("(max-width: 1050px)").matches) {
        const switchHeight = document.querySelector<HTMLElement>(".mobile-view-switch")?.offsetHeight ?? 0;
        const railHeight = stepRail.current?.offsetHeight ?? 0;
        const editorTop = editorPane.current?.offsetTop ?? 0;
        window.scrollTo({ top: Math.max(0, editorTop - switchHeight - railHeight) });
      }
    });
  }

  function selectMobilePane(pane: "edit" | "preview") {
    setMobilePane(pane);
    window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1050px)").matches) window.scrollTo({ top: 0 });
      document.getElementById(pane === "edit" ? "editor-heading" : "preview-heading")?.focus();
    });
  }

  useEffect(() => {
    if (!validation.success) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(validation.data));
      } catch {
        setNotice({
          tone: "info",
          message: "Your browser could not save this draft locally. Export the config to keep it.",
        });
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [validation]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(
    () =>
      registerProfileWebMcpTools({
        readDraft: () => {
          const current = configSnapshot.current;
          const result = profileConfigSchema.safeParse(current);
          return {
            config: current,
            valid: result.success,
            issues: result.success
              ? []
              : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
            generatedFiles: result.success
              ? generateArtifacts(result.data).map((artifact) => artifact.path)
              : [],
          };
        },
        stageConfig: (nextConfig) => {
          configSnapshot.current = nextConfig;
          setConfig(nextConfig);
          setRepoQuery(nextConfig.identity.username);
          selectPanel("profile");
          setNotice({ tone: "success", message: "An agent staged a valid profile configuration." });
        },
        onRegistrationError: (error) => {
          console.warn("Profile Studio agent tools could not be registered.", error);
        },
      }),
    [],
  );

  function updateIdentity<K extends keyof ProfileConfig["identity"]>(
    key: K,
    value: ProfileConfig["identity"][K],
  ) {
    setConfig((current) => ({
      ...current,
      identity: { ...current.identity, [key]: value },
    }));
  }

  function updateHero<K extends keyof ProfileConfig["hero"]>(
    key: K,
    value: ProfileConfig["hero"][K],
  ) {
    setConfig((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
  }

  function updateRepository(index: number, patch: Partial<Repository>) {
    setConfig((current) => ({
      ...current,
      repositories: current.repositories.map((repository, itemIndex) =>
        itemIndex === index ? { ...repository, ...patch } : repository,
      ),
    }));
  }

  function updateSkillGroup(index: number, patch: Partial<SkillGroup>) {
    setConfig((current) => ({
      ...current,
      skillGroups: current.skillGroups.map((group, itemIndex) =>
        itemIndex === index ? { ...group, ...patch } : group,
      ),
    }));
  }

  function updateLink(index: number, patch: Partial<ProfileLink>) {
    setConfig((current) => ({
      ...current,
      links: current.links.map((link, itemIndex) =>
        itemIndex === index ? { ...link, ...patch } : link,
      ),
    }));
  }

  function updateMediaItem(index: number, patch: Partial<MediaItem>) {
    setConfig((current) => ({
      ...current,
      media: current.media.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addMediaItem() {
    if (config.media.length >= 6) return;
    setConfig((current) => ({
      ...current,
      media: [
        ...current.media,
        {
          id: createId("media"),
          kind: "gif",
          url: "",
          reducedMotionUrl: "",
          alt: "",
          caption: "",
          widthPercent: 100,
          align: "center",
          attribution: {
            sourceLabel: "",
            sourceUrl: "",
            licenseName: "",
            licenseUrl: "",
          },
        },
      ],
      sections: current.sections.includes("media")
        ? current.sections
        : [...current.sections, "media"],
    }));
  }

  function updatePalette(themeKey: HeroTheme, key: keyof Palette, value: string) {
    setConfig((current) => ({
      ...current,
      appearance: {
        ...current.appearance,
        [themeKey]: { ...current.appearance[themeKey], [key]: value },
      },
    }));
  }

  function updateLayout<K extends keyof ProfileConfig["layout"]>(
    key: K,
    value: ProfileConfig["layout"][K],
  ) {
    setConfig((current) => ({
      ...current,
      layout: { ...current.layout, [key]: value },
    }));
  }

  function updateDecoration(
    index: number,
    patch: Partial<ProfileConfig["layout"]["decorations"][number]>,
  ) {
    setConfig((current) => ({
      ...current,
      layout: {
        ...current.layout,
        decorations: current.layout.decorations.map((decoration, itemIndex) =>
          itemIndex === index ? { ...decoration, ...patch } : decoration,
        ),
      },
    }));
  }

  function addDecoration() {
    if (config.layout.decorations.length >= 8) return;
    const shapes = ["circle", "square", "diamond", "cross", "line"] as const;
    const index = config.layout.decorations.length;
    setConfig((current) => ({
      ...current,
      layout: {
        ...current.layout,
        decorations: [
          ...current.layout.decorations,
          {
            id: createId("shape"),
            shape: shapes[index % shapes.length]!,
            x: Math.min(88, 18 + index * 13),
            y: index % 2 === 0 ? 18 : 78,
            size: 32,
            rotation: index * 15,
            tone: "accent",
            style: "outline",
            opacity: 0.55,
          },
        ],
      },
    }));
  }

  function firstValidationMessage(): string {
    if (validation.success) return "";
    const issue = validation.error.issues[0];
    return issue ? `${issue.path.join(".")}: ${issue.message}` : "Fix the highlighted profile settings.";
  }

  async function copyReadme() {
    if (!validation.success) {
      setNotice({ tone: "error", message: firstValidationMessage() });
      return;
    }
    try {
      await navigator.clipboard.writeText(readme);
      setNotice({ tone: "success", message: "README copied to your clipboard." });
    } catch {
      setNotice({ tone: "error", message: "The README could not be copied. Use the Export panel instead." });
    }
  }

  async function downloadBundle() {
    if (!validation.success) {
      setNotice({ tone: "error", message: firstValidationMessage() });
      selectPanel("export");
      return;
    }
    setIsExporting(true);
    try {
      const blob = await generateZip(validation.data);
      downloadBlob(blob, `${sanitizedDownloadName(config.identity.username)}.zip`);
      setNotice({ tone: "success", message: "Your complete profile bundle is ready." });
    } catch {
      setNotice({ tone: "error", message: "The profile bundle could not be created." });
    } finally {
      setIsExporting(false);
    }
  }

  function downloadConfig() {
    if (!validation.success) {
      setNotice({ tone: "error", message: firstValidationMessage() });
      return;
    }
    downloadText(
      `${JSON.stringify(validation.data, null, 2)}\n`,
      `${sanitizedDownloadName(config.identity.username)}.config.json`,
      "application/json",
    );
    setNotice({ tone: "success", message: "Configuration downloaded." });
  }

  function downloadCurrentHero() {
    if (!validation.success) {
      setNotice({ tone: "error", message: firstValidationMessage() });
      return;
    }
    const artifact = generateHeroArtifact(validation.data, variant);
    const filename = artifact.path.slice(artifact.path.lastIndexOf("/") + 1);
    downloadText(artifact.content, filename, "image/svg+xml");
    setNotice({ tone: "success", message: `${filename} downloaded.` });
  }

  async function importConfig(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 100_000) {
      setNotice({ tone: "error", message: "That configuration file is too large." });
      return;
    }
    try {
      const imported = parseProfileConfig(JSON.parse(await file.text()));
      setConfig(imported);
      setRepoQuery(imported.identity.username);
      setNotice({ tone: "success", message: "Configuration loaded." });
    } catch {
      setNotice({ tone: "error", message: "This is not a valid Profile Studio configuration." });
    }
  }

  function resetProfile() {
    if (!window.confirm("Reset every field to the fictional sample profile?")) return;
    setConfig(cloneDefaultConfig());
    setRepoQuery("");
    setImportedRepositories([]);
    setNotice({ tone: "info", message: "The fictional sample profile has been restored." });
  }

  function startBlankProfile() {
    if (!window.confirm("Replace the current draft with a clean starter profile?")) return;
    const blank = createBlankConfig();
    setConfig(blank);
    setRepoQuery("");
    setImportedRepositories([]);
    setNotice({ tone: "info", message: "A clean starter profile is ready." });
  }

  async function importRepositories() {
    const username = repoQuery.trim();
    if (!username) {
      setRepositoryError("Enter a GitHub username first.");
      return;
    }
    setIsImportingRepositories(true);
    setRepositoryError("");
    importAbortController.current?.abort();
    const controller = new AbortController();
    importAbortController.current = controller;
    try {
      const cacheKey = `${githubCachePrefix}${username.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { savedAt?: unknown; items?: unknown };
          if (
            typeof parsed.savedAt === "number" &&
            Date.now() - parsed.savedAt < 15 * 60 * 1000
          ) {
            setImportedRepositories(parseCachedRepositories(parsed.items));
            return;
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }
      const repositories = await fetchPublicRepositories(username, controller.signal);
      setImportedRepositories(repositories);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), items: repositories }));
      } catch {
        // Cache failure does not affect importing.
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setRepositoryError(error instanceof Error ? error.message : "Repositories could not be loaded.");
    } finally {
      if (importAbortController.current === controller) setIsImportingRepositories(false);
    }
  }

  function addImportedRepository(repository: ImportedRepository) {
    if (config.repositories.some((item) => item.id === repository.id)) return;
    if (config.repositories.length >= 6) {
      setNotice({ tone: "info", message: "The first release supports up to six featured projects." });
      return;
    }
    setConfig((current) => ({
      ...current,
      repositories: [
        ...current.repositories,
        {
          id: repository.id.slice(0, 160),
          name: repository.name.slice(0, 100),
          url: repository.url,
          description: repository.description.slice(0, 180),
          focus: repository.focus.slice(0, 80),
          source: { provider: "github", fullName: repository.id.slice(0, 140) },
        },
      ],
    }));
  }

  function addManualRepository() {
    if (config.repositories.length >= 6) return;
    setConfig((current) => ({
      ...current,
      repositories: [
        ...current.repositories,
        {
          id: createId("repository"),
          name: "new-project",
          url: `https://github.com/${current.identity.username}/new-project`,
          description: "What this project does.",
          focus: "Technology · Focus",
        },
      ],
    }));
  }

  function toggleSection(section: SectionKey) {
    setConfig((current) => {
      const enabled = current.sections.includes(section);
      if (enabled && current.sections.length === 1) return current;
      return {
        ...current,
        sections: enabled
          ? current.sections.filter((item) => item !== section)
          : [...current.sections, section],
      };
    });
  }

  const visibleImportedRepositories = importedRepositories
    .filter((repository) => showForks || !repository.fork)
    .filter((repository) => showArchived || !repository.archived)
    .filter((repository) =>
      `${repository.name} ${repository.description}`.toLowerCase().includes(repoSearch.toLowerCase()),
    )
    .slice(0, 50);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="visually-hidden">Animated GitHub Profile Studio</h1>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">›_</span>
          <span>
            <strong>Profile Studio</strong>
            <small>Animated GitHub profiles</small>
          </span>
        </div>
        <div className="header-status" role="status" aria-live="polite" aria-atomic="true">
          <span className={`status-dot ${validation.success ? "status-good" : "status-error"}`} />
          <span>{validation.success ? "Ready · saved locally" : "Review needed · valid draft kept"}</span>
        </div>
        <div className="header-actions">
          <input
            ref={configFileInput}
            hidden
            tabIndex={-1}
            type="file"
            accept="application/json,.json"
            onChange={importConfig}
          />
          <button className="button button-ghost" type="button" onClick={() => configFileInput.current?.click()}>
            Import config
          </button>
          <button className="button button-ghost" type="button" onClick={copyReadme}>
            Copy README
          </button>
          <button className="button button-primary" type="button" onClick={downloadBundle} disabled={isExporting}>
            {isExporting ? "Building…" : "Download ZIP"}
          </button>
        </div>
      </header>

      <div className="mobile-view-switch" role="group" aria-label="Workspace view">
        <button type="button" aria-controls="editor-pane" aria-pressed={mobilePane === "edit"} onClick={() => selectMobilePane("edit")}>Edit</button>
        <button type="button" aria-controls="preview-pane" aria-pressed={mobilePane === "preview"} onClick={() => selectMobilePane("preview")}>Preview</button>
      </div>

      <main className={`studio-workspace mobile-pane-${mobilePane}`}>
        <nav ref={stepRail} className="step-rail" aria-label="Profile builder steps">
          <div className="step-rail-heading">
            <span>Build flow</span>
            <strong>{String(activePanelIndex + 1).padStart(2, "0")} / {panels.length}</strong>
          </div>
          <div className="step-groups">
            {panelGroups.map((group) => (
              <div className="step-group" key={group.key}>
                <span className="step-group-label">{group.label}</span>
                {panels.filter((panel) => panel.group === group.key).map((panel) => {
                  const active = activePanel === panel.key;
                  return (
                    <button
                      key={panel.key}
                      type="button"
                      id={`step-${panel.key}`}
                      aria-controls={`panel-${panel.key}`}
                      aria-current={active ? "step" : undefined}
                      className={active ? "step-button step-button-active" : "step-button"}
                      onClick={() => selectPanel(panel.key)}
                    >
                      <span className="step-index" aria-hidden="true">{panel.short}</span>
                      <span className="step-copy">
                        <strong>{panel.label}</strong>
                        <small>{panel.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className={validation.success ? "step-summary step-summary-good" : "step-summary step-summary-error"}>
            <span aria-hidden="true">{validation.success ? "✓" : "!"}</span>
            <div>
              <strong>{validation.success ? "Ready to export" : "Needs attention"}</strong>
              <small>{warnings.length ? `${warnings.length} review note${warnings.length === 1 ? "" : "s"}` : "No review notes"}</small>
            </div>
          </div>
        </nav>

        <aside ref={editorPane} id="editor-pane" className="editor-pane" aria-labelledby="editor-heading">
          <div className="editor-intro">
            <div>
              <span className="workspace-eyebrow">STEP {activePanelDetails.short} / {panels.length}</span>
              <h2 id="editor-heading" tabIndex={-1}>{activePanelDetails.label}</h2>
              <p>{activePanelDetails.description}</p>
            </div>
            <span className="editor-current-step" aria-hidden="true">{activePanelDetails.short}</span>
          </div>

          <div ref={editorScroll} className="editor-scroll" role="region" id={`panel-${activePanel}`} aria-labelledby="editor-heading">
            {activePanel === "design" ? (
              <>
                <EditorCard
                  title="Choose a design"
                  eyebrow="Distinct responsive templates"
                  actions={designUndo ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setConfig((current) => ({
                          ...current,
                          template: structuredClone(designUndo.template),
                          appearance: structuredClone(designUndo.appearance),
                          layout: structuredClone(designUndo.layout),
                          hero: {
                            ...current.hero,
                            workflow: {
                              ...current.hero.workflow,
                              style: designUndo.workflowStyle,
                            },
                          },
                        }));
                        setDesignUndo(null);
                        setNotice({ tone: "info", message: "The previous design was restored." });
                      }}
                    >
                      Undo
                    </button>
                  ) : null}
                >
                  <p className="card-intro">Each template changes the composition, panels, workflow, type, and color system while preserving your profile content.</p>
                  <div className="preset-grid" role="group" aria-label="Profile designs">
                    {designPresets.map((preset) => {
                      const selected = isDesignPresetActive(config, preset.id);
                      const customized = !selected && config.template.id === preset.id;
                      return (
                        <button
                          className={selected ? "preset-card preset-card-selected" : "preset-card"}
                          type="button"
                          aria-pressed={selected}
                          key={preset.id}
                          onClick={() => {
                            setDesignUndo({
                              template: structuredClone(config.template),
                              appearance: structuredClone(config.appearance),
                              layout: structuredClone(config.layout),
                              workflowStyle: config.hero.workflow.style,
                            });
                            setConfig((current) => applyDesignPreset(current, preset.id));
                            setNotice({ tone: "success", message: `${preset.name} design applied. Your content was preserved.` });
                          }}
                        >
                          <span
                            className="preset-preview"
                            data-composition={preset.layout.composition}
                            data-shape-system={preset.layout.shapeSystem}
                            style={{
                              "--preset-bg": preset.appearance.dark.background,
                              "--preset-surface": preset.appearance.dark.surface,
                              "--preset-terminal": preset.appearance.dark.terminal,
                              "--preset-line": preset.appearance.dark.line,
                              "--preset-accent": preset.appearance.dark.accent,
                              "--preset-soft": preset.appearance.dark.accentSoft,
                            } as CSSProperties}
                            aria-hidden="true"
                          >
                            <span className="preset-mini-copy"><i /><i /><i /></span>
                            <span className="preset-mini-terminal"><i /><i /><i /></span>
                            <span className="preset-mini-workflow"><i /><i /><i /><i /></span>
                            <span className="preset-mini-shape" />
                          </span>
                          <span className="preset-copy"><strong>{preset.name}</strong><small>{preset.description}</small></span>
                          <span className="preset-state">{selected ? "Active" : customized ? "Customized" : "Apply"}</span>
                        </button>
                      );
                    })}
                  </div>
                </EditorCard>
                <EditorCard title="Custom layout" eyebrow="Responsive composition controls">
                  <p className="card-intro">Build your own arrangement from safe layout rules. Desktop and mobile coordinates are calculated automatically.</p>
                  <div className="field-grid">
                    <SelectField
                      label="Composition"
                      value={config.layout.composition}
                      options={compositionOptions}
                      onChange={(value) => updateLayout("composition", value as ProfileConfig["layout"]["composition"])}
                    />
                    <SelectField
                      label="Content order"
                      value={config.layout.contentOrder}
                      options={contentOrderOptions}
                      onChange={(value) => updateLayout("contentOrder", value as ProfileConfig["layout"]["contentOrder"])}
                    />
                    <SelectField
                      label="Spacing"
                      value={config.layout.density}
                      options={densityOptions}
                      onChange={(value) => updateLayout("density", value as ProfileConfig["layout"]["density"])}
                    />
                    <SelectField
                      label="Panel shapes"
                      value={config.layout.shapeSystem}
                      options={shapeSystemOptions}
                      onChange={(value) => updateLayout("shapeSystem", value as ProfileConfig["layout"]["shapeSystem"])}
                    />
                    <SelectField
                      label="Background"
                      value={config.layout.pattern}
                      options={patternOptions}
                      onChange={(value) => updateLayout("pattern", value as ProfileConfig["layout"]["pattern"])}
                    />
                    <SelectField
                      label="Console treatment"
                      value={config.layout.terminalStyle}
                      options={terminalStyleOptions}
                      onChange={(value) => updateLayout("terminalStyle", value as ProfileConfig["layout"]["terminalStyle"])}
                    />
                    <SelectField
                      label="Text alignment"
                      value={config.layout.textAlign}
                      options={textAlignOptions}
                      onChange={(value) => updateLayout("textAlign", value as ProfileConfig["layout"]["textAlign"])}
                    />
                    <SelectField
                      label="Workflow design"
                      value={config.hero.workflow.style}
                      options={workflowStyleOptions}
                      onChange={(value) => updateHero("workflow", {
                        ...config.hero.workflow,
                        style: value as ProfileConfig["hero"]["workflow"]["style"],
                      })}
                    />
                  </div>
                  <p className="privacy-note"><span aria-hidden="true">●</span> These controls never inject CSS or SVG markup; they select trusted responsive renderers.</p>
                  <button
                    className="button button-secondary button-full"
                    type="button"
                    onClick={() => {
                      const preset = designPresets.find((candidate) => candidate.id === config.template.id);
                      if (!preset) return;
                      setConfig((current) => ({
                        ...current,
                        layout: structuredClone(preset.layout),
                        hero: {
                          ...current.hero,
                          workflow: { ...current.hero.workflow, style: preset.workflowStyle },
                        },
                      }));
                      setNotice({ tone: "info", message: `${preset.name} layout defaults restored.` });
                    }}
                  >
                    Reset layout to template
                  </button>
                </EditorCard>
                <EditorCard
                  title="Decorative shapes"
                  eyebrow="Optional visual layer"
                  actions={<span className="card-count">{config.layout.decorations.length}/8</span>}
                >
                  <p className="card-intro">Add lightweight geometry behind the content. Percentage positions adapt to every exported size.</p>
                  {config.layout.decorations.length === 0 ? (
                    <div className="empty-state compact-empty-state"><strong>No extra shapes</strong><span>Your selected template still keeps its built-in details.</span></div>
                  ) : null}
                  <div className="decoration-list">
                    {config.layout.decorations.map((decoration, index) => (
                      <div className="decoration-item" key={decoration.id}>
                        <div className="decoration-heading">
                          <span className={`decoration-icon decoration-icon-${decoration.shape}`} aria-hidden="true" />
                          <strong>Shape {index + 1}</strong>
                        </div>
                        <div className="field-grid">
                          <SelectField
                            label="Shape"
                            value={decoration.shape}
                            options={decorationShapeOptions}
                            onChange={(value) => updateDecoration(index, { shape: value as typeof decoration.shape })}
                          />
                          <SelectField
                            label="Color role"
                            value={decoration.tone}
                            options={decorationToneOptions}
                            onChange={(value) => updateDecoration(index, { tone: value as typeof decoration.tone })}
                          />
                          <SelectField
                            label="Treatment"
                            value={decoration.style}
                            options={[{ value: "outline", label: "Outline" }, { value: "fill", label: "Filled" }]}
                            onChange={(value) => updateDecoration(index, { style: value as typeof decoration.style })}
                          />
                          <label className="field range-field">
                            <span className="field-label-row"><span>Size</span><strong>{decoration.size}px</strong></span>
                            <input type="range" min="8" max="120" step="4" value={decoration.size} onChange={(event) => updateDecoration(index, { size: Number(event.target.value) })} />
                          </label>
                          <label className="field range-field">
                            <span className="field-label-row"><span>Horizontal</span><strong>{decoration.x}%</strong></span>
                            <input type="range" min="4" max="96" value={decoration.x} onChange={(event) => updateDecoration(index, { x: Number(event.target.value) })} />
                          </label>
                          <label className="field range-field">
                            <span className="field-label-row"><span>Vertical</span><strong>{decoration.y}%</strong></span>
                            <input type="range" min="8" max="92" value={decoration.y} onChange={(event) => updateDecoration(index, { y: Number(event.target.value) })} />
                          </label>
                          <label className="field range-field">
                            <span className="field-label-row"><span>Rotation</span><strong>{decoration.rotation}°</strong></span>
                            <input type="range" min="-180" max="180" step="15" value={decoration.rotation} onChange={(event) => updateDecoration(index, { rotation: Number(event.target.value) })} />
                          </label>
                          <label className="field range-field">
                            <span className="field-label-row"><span>Opacity</span><strong>{Math.round(decoration.opacity * 100)}%</strong></span>
                            <input type="range" min="0.15" max="1" step="0.05" value={decoration.opacity} onChange={(event) => updateDecoration(index, { opacity: Number(event.target.value) })} />
                          </label>
                        </div>
                        <ItemActions
                          index={index}
                          length={config.layout.decorations.length}
                          onMove={(direction) => updateLayout("decorations", moveItem(config.layout.decorations, index, direction))}
                          onRemove={() => updateLayout("decorations", config.layout.decorations.filter((_, itemIndex) => itemIndex !== index))}
                          removeLabel="Remove shape"
                        />
                      </div>
                    ))}
                  </div>
                  {config.layout.decorations.length < 8 ? <button className="button button-secondary button-full" type="button" onClick={addDecoration}>Add decorative shape</button> : null}
                </EditorCard>
                <EditorCard title="Typography" eyebrow="Safe system font stacks">
                  <SelectField
                    label="Font style"
                    value={config.appearance.fontId}
                    options={fontOptions}
                    hint="Fonts are allowlisted and require no remote download. Exact rendering can vary by operating system."
                    onChange={(value) => setConfig((current) => ({
                      ...current,
                      appearance: { ...current.appearance, fontId: value as FontId },
                    }))}
                  />
                </EditorCard>
                <EditorCard title="Choose your starting point" eyebrow="Content samples">
                  <div className="starter-actions">
                    <button className="button button-secondary" type="button" onClick={startBlankProfile}>Start a blank profile</button>
                    <button className="button button-secondary" type="button" onClick={resetProfile}>Load fictional sample</button>
                  </div>
                  <p className="privacy-note"><span aria-hidden="true">●</span> Applying a design changes visuals only. Loading a sample replaces all current content after confirmation.</p>
                </EditorCard>
              </>
            ) : null}

            {activePanel === "profile" ? (
              <>
                <EditorCard title="Identity" eyebrow="Public profile">
                  <div className="field-grid">
                    <TextField label="GitHub username" value={config.identity.username} maxLength={39} onChange={(value) => updateIdentity("username", value)} />
                    <TextField label="Display name" value={config.identity.displayName} maxLength={36} onChange={(value) => updateIdentity("displayName", value)} />
                    <TextField label="Header mark" value={config.identity.brandMark} maxLength={12} onChange={(value) => updateIdentity("brandMark", value)} />
                    <TextField label="Header label" value={config.identity.headerLabel} maxLength={28} onChange={(value) => updateIdentity("headerLabel", value)} />
                  </div>
                  <TextField label="Eyebrow name" value={config.identity.eyebrow} maxLength={32} onChange={(value) => updateIdentity("eyebrow", value)} />
                  <TextField label="Primary role" value={config.identity.primaryRole} maxLength={44} onChange={(value) => updateIdentity("primaryRole", value)} />
                  <TextField label="Secondary role" value={config.identity.secondaryRole} maxLength={54} onChange={(value) => updateIdentity("secondaryRole", value)} />
                </EditorCard>
                <EditorCard title="About" eyebrow="README section">
                  <TextField label="Heading" value={config.about.heading} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, about: { ...current.about, heading: value } }))} />
                  {config.about.paragraphs.map((paragraph, index) => (
                    <div className="stacked-item" key={`paragraph-${index}`}>
                      <TextArea label={`Paragraph ${index + 1}`} value={paragraph} maxLength={600} rows={4} onChange={(value) => setConfig((current) => ({ ...current, about: { ...current.about, paragraphs: current.about.paragraphs.map((item, itemIndex) => itemIndex === index ? value : item) } }))} />
                      {config.about.paragraphs.length > 1 ? <button className="text-button danger-button" type="button" onClick={() => setConfig((current) => ({ ...current, about: { ...current.about, paragraphs: current.about.paragraphs.filter((_, itemIndex) => itemIndex !== index) } }))}>Remove paragraph</button> : null}
                    </div>
                  ))}
                  {config.about.paragraphs.length < 3 ? <button className="button button-secondary button-full" type="button" onClick={() => setConfig((current) => ({ ...current, about: { ...current.about, paragraphs: [...current.about.paragraphs, "Add another detail about your work."] } }))}>Add paragraph</button> : null}
                  <TextField label="Process line" value={config.about.processLine} maxLength={120} onChange={(value) => setConfig((current) => ({ ...current, about: { ...current.about, processLine: value } }))} />
                </EditorCard>
                <EditorCard title="Accessibility" eyebrow="Language and image description">
                  <div className="field-grid">
                    <TextField label="Language tag" value={config.accessibility.language} maxLength={35} placeholder="en or ar-SA" onChange={(value) => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, language: value } }))} />
                    <div className="field"><span className="field-label-row"><span>Text direction</span></span><div className="toggle-row">{(["ltr", "rtl", "auto"] as const).map((direction) => <label key={direction}><input type="radio" name="text-direction" checked={config.accessibility.direction === direction} onChange={() => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, direction } }))} /> {direction.toUpperCase()}</label>)}</div></div>
                  </div>
                  <TextArea label="Image alt override" value={config.accessibility.imageAlt} maxLength={240} rows={3} hint="Leave empty to derive a motion-neutral description from your profile." onChange={(value) => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, imageAlt: value } }))} />
                  <TextField label="SVG title override" value={config.accessibility.svgTitle} maxLength={120} hint="Leave empty to use your display name and header label." onChange={(value) => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, svgTitle: value } }))} />
                  <TextArea label="Animated SVG description" value={config.accessibility.animatedDescription} maxLength={300} rows={3} hint="Optional. The not-live disclosure is always added." onChange={(value) => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, animatedDescription: value } }))} />
                  <TextArea label="Static SVG description" value={config.accessibility.staticDescription} maxLength={300} rows={3} hint="Optional. The not-live disclosure is always added." onChange={(value) => setConfig((current) => ({ ...current, accessibility: { ...current.accessibility, staticDescription: value } }))} />
                </EditorCard>
              </>
            ) : null}

            {activePanel === "hero" ? (
              <>
                <EditorCard title="Headline" eyebrow="Three-line statement">
                  {config.hero.headline.map((line, index) => (
                    <TextField key={`headline-${index}`} label={`Line ${index + 1}`} value={line} maxLength={24} onChange={(value) => updateHero("headline", config.hero.headline.map((item, itemIndex) => itemIndex === index ? value : item) as ProfileConfig["hero"]["headline"])} />
                  ))}
                  <TextField label="Profile badge" value={config.identity.profileLabel} maxLength={20} onChange={(value) => updateIdentity("profileLabel", value)} />
                </EditorCard>
                <EditorCard title="Terminal" eyebrow="Animated demonstration">
                  <TextField label="Command" value={config.hero.command} maxLength={30} onChange={(value) => updateHero("command", value)} />
                  <div className="list-heading"><strong>Checks</strong><span>{config.hero.checks.length}/4</span></div>
                  {config.hero.checks.map((check, index) => (
                    <div className="compact-list-item" key={`check-${index}`}>
                      <TextField label={`Check ${index + 1}`} value={check} maxLength={24} onChange={(value) => updateHero("checks", config.hero.checks.map((item, itemIndex) => itemIndex === index ? value : item))} />
                      <ItemActions index={index} length={config.hero.checks.length} onMove={(direction) => updateHero("checks", moveItem(config.hero.checks, index, direction))} onRemove={() => config.hero.checks.length > 1 && updateHero("checks", config.hero.checks.filter((_, itemIndex) => itemIndex !== index))} />
                    </div>
                  ))}
                  {config.hero.checks.length < 4 ? <button className="button button-secondary button-full" type="button" onClick={() => updateHero("checks", [...config.hero.checks, "New check"])}>Add check</button> : null}
                  <TextField label="Completion message" value={config.hero.completionMessage} maxLength={44} onChange={(value) => updateHero("completionMessage", value)} />
                  <TextField label="Idle message" value={config.hero.idleMessage} maxLength={44} onChange={(value) => updateHero("idleMessage", value)} />
                  <div className="field-grid">
                    <TextField label="Terminal host" value={config.hero.labels.host} maxLength={16} onChange={(value) => updateHero("labels", { ...config.hero.labels, host: value })} />
                    <TextField label="Run label" value={config.hero.labels.demoRun} maxLength={12} onChange={(value) => updateHero("labels", { ...config.hero.labels, demoRun: value })} />
                    <TextField label="Queued label" value={config.hero.labels.queued} maxLength={8} onChange={(value) => updateHero("labels", { ...config.hero.labels, queued: value })} />
                    <TextField label="Running label" value={config.hero.labels.running} maxLength={8} onChange={(value) => updateHero("labels", { ...config.hero.labels, running: value })} />
                    <TextField label="Passed label" value={config.hero.labels.passed} maxLength={6} onChange={(value) => updateHero("labels", { ...config.hero.labels, passed: value })} />
                    <TextField label="Workflow label" value={config.hero.labels.workflow} maxLength={18} onChange={(value) => updateHero("labels", { ...config.hero.labels, workflow: value })} />
                  </div>
                </EditorCard>
                <EditorCard title="Workflow" eyebrow="Bottom sequence">
                  <div className="list-heading"><strong>Steps</strong><span>{config.hero.workflow.steps.length}/6</span></div>
                  {config.hero.workflow.steps.map((step, index) => (
                    <div className="compact-list-item" key={step.id}>
                      <div className="field-grid">
                        <TextField
                          label={`Step ${index + 1}`}
                          value={step.label}
                          maxLength={12}
                          onChange={(value) => updateHero("workflow", {
                            ...config.hero.workflow,
                            steps: config.hero.workflow.steps.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: value } : item,
                            ),
                          })}
                        />
                        <SelectField
                          label="Marker shape"
                          value={step.shape}
                          options={workflowShapeOptions}
                          onChange={(value) => updateHero("workflow", {
                            ...config.hero.workflow,
                            steps: config.hero.workflow.steps.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, shape: value as typeof step.shape } : item,
                            ),
                          })}
                        />
                      </div>
                      <ItemActions
                        index={index}
                        length={config.hero.workflow.steps.length}
                        onMove={(direction) => updateHero("workflow", {
                          ...config.hero.workflow,
                          steps: moveItem(config.hero.workflow.steps, index, direction),
                        })}
                        onRemove={() => config.hero.workflow.steps.length > 2 && updateHero("workflow", {
                          ...config.hero.workflow,
                          steps: config.hero.workflow.steps.filter((_, itemIndex) => itemIndex !== index),
                        })}
                      />
                    </div>
                  ))}
                  {config.hero.workflow.steps.length < 6 ? (
                    <button
                      className="button button-secondary button-full"
                      type="button"
                      onClick={() => updateHero("workflow", {
                        ...config.hero.workflow,
                        steps: [
                          ...config.hero.workflow.steps,
                          { id: createId("workflow"), label: "NEXT", shape: "auto" },
                        ],
                      })}
                    >
                      Add step
                    </button>
                  ) : null}
                  <label className="field range-field">
                    <span className="field-label-row"><span>Animation cycle</span><strong>{config.hero.animationDuration}s</strong></span>
                    <input type="range" min="8" max="30" step="1" value={config.hero.animationDuration} onChange={(event) => updateHero("animationDuration", Number(event.target.value))} />
                  </label>
                  <TextField label="Left footer" value={config.hero.footerLeft} maxLength={32} onChange={(value) => updateHero("footerLeft", value)} />
                  <TextField label="Right footer" value={config.hero.footerRight} maxLength={44} onChange={(value) => updateHero("footerRight", value)} />
                </EditorCard>
              </>
            ) : null}

            {activePanel === "projects" ? (
              <>
                <EditorCard title="Import from GitHub" eyebrow="Public repositories">
                  <div className="inline-form">
                    <TextField label="GitHub username" value={repoQuery} maxLength={39} onChange={setRepoQuery} />
                    <button className="button button-primary inline-form-button" type="button" onClick={importRepositories} disabled={isImportingRepositories}>{isImportingRepositories ? "Loading…" : "Load"}</button>
                  </div>
                  <p className="privacy-note"><span aria-hidden="true">●</span> Loads up to 300 recent public repositories. No login or token is requested.</p>
                  {repositoryError ? <p className="inline-error" role="alert">{repositoryError}</p> : null}
                  {importedRepositories.length > 0 ? (
                    <>
                      <TextField label="Search loaded repositories" value={repoSearch} onChange={setRepoSearch} placeholder="Search by name or description" />
                      <div className="toggle-row">
                        <label><input type="checkbox" checked={showForks} onChange={(event) => setShowForks(event.target.checked)} /> Include forks</label>
                        <label><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Include archived</label>
                      </div>
                      <div className="import-results" aria-label="Loaded GitHub repositories">
                        {visibleImportedRepositories.map((repository) => {
                          const selected = config.repositories.some((item) => item.id === repository.id);
                          return (
                            <div className="import-result" key={repository.id}>
                              <div><strong>{repository.name}</strong><span>{repository.focus || "Repository"} · ★ {repository.stars}</span></div>
                              <button className={selected ? "button button-selected" : "button button-secondary"} type="button" disabled={selected} onClick={() => addImportedRepository(repository)}>{selected ? "Selected" : "Add"}</button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </EditorCard>
                <EditorCard title="Featured projects" eyebrow={`${config.repositories.length}/6 selected`} actions={<button className="text-button" type="button" disabled={config.repositories.length >= 6} onClick={addManualRepository}>Add manually</button>}>
                  {config.repositories.length === 0 ? <div className="empty-state"><strong>No projects selected</strong><span>Import public repositories or add one manually.</span></div> : null}
                  {config.repositories.map((repository, index) => (
                    <div className="editable-list-item" key={repository.id}>
                      <div className="item-index">{String(index + 1).padStart(2, "0")}</div>
                      <TextField label="Project name" value={repository.name} maxLength={100} onChange={(value) => updateRepository(index, { name: value })} />
                      <TextField label="HTTPS URL" value={repository.url} type="url" onChange={(value) => updateRepository(index, { url: value })} />
                      <TextArea label="Description" value={repository.description} maxLength={180} rows={3} onChange={(value) => updateRepository(index, { description: value })} />
                      <TextField label="Focus / tags" value={repository.focus} maxLength={80} onChange={(value) => updateRepository(index, { focus: value })} />
                      <ItemActions index={index} length={config.repositories.length} onMove={(direction) => setConfig((current) => ({ ...current, repositories: moveItem(current.repositories, index, direction) }))} onRemove={() => setConfig((current) => ({ ...current, repositories: current.repositories.filter((_, itemIndex) => itemIndex !== index) }))} removeLabel="Remove project" />
                    </div>
                  ))}
                </EditorCard>
              </>
            ) : null}

            {activePanel === "skills" ? (
              <EditorCard title="Skill groups" eyebrow="Organize your toolbox" actions={<button className="text-button" type="button" disabled={config.skillGroups.length >= 6} onClick={() => setConfig((current) => ({ ...current, skillGroups: [...current.skillGroups, { id: createId("skills"), label: "New group", items: ["New skill"] }] }))}>Add group</button>}>
                {config.skillGroups.map((group, index) => (
                  <div className="editable-list-item" key={group.id}>
                    <div className="item-index">{String(index + 1).padStart(2, "0")}</div>
                    <TextField label="Group name" value={group.label} maxLength={40} onChange={(value) => updateSkillGroup(index, { label: value })} />
                    <CommaListField label="Skills" items={group.items} onCommit={(items) => updateSkillGroup(index, { items })} />
                    <ItemActions index={index} length={config.skillGroups.length} onMove={(direction) => setConfig((current) => ({ ...current, skillGroups: moveItem(current.skillGroups, index, direction) }))} onRemove={() => setConfig((current) => ({ ...current, skillGroups: current.skillGroups.filter((_, itemIndex) => itemIndex !== index) }))} removeLabel="Remove group" />
                  </div>
                ))}
              </EditorCard>
            ) : null}

            {activePanel === "links" ? (
              <EditorCard title="Profile links" eyebrow="Social and open source" actions={<button className="text-button" type="button" disabled={config.links.length >= 8} onClick={() => setConfig((current) => ({ ...current, links: [...current.links, { id: createId("link"), label: "New link", url: "https://github.com/" }] }))}>Add link</button>}>
                <TextField label="Section heading" value={config.sectionHeadings.links} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, sectionHeadings: { ...current.sectionHeadings, links: value } }))} />
                {config.links.map((link, index) => (
                  <div className="editable-list-item" key={link.id}>
                    <div className="item-index">{String(index + 1).padStart(2, "0")}</div>
                    <TextField label="Label" value={link.label} maxLength={40} onChange={(value) => updateLink(index, { label: value })} />
                    <TextField label="HTTPS URL" value={link.url} type="url" onChange={(value) => updateLink(index, { url: value })} />
                    <ItemActions index={index} length={config.links.length} onMove={(direction) => setConfig((current) => ({ ...current, links: moveItem(current.links, index, direction) }))} onRemove={() => setConfig((current) => ({ ...current, links: current.links.filter((_, itemIndex) => itemIndex !== index) }))} removeLabel="Remove link" />
                  </div>
                ))}
              </EditorCard>
            ) : null}

            {activePanel === "media" ? (
              <>
                <EditorCard
                  title="Images & animated GIFs"
                  eyebrow={`${config.media.length}/6 remote items`}
                  actions={<button className="text-button" type="button" disabled={config.media.length >= 6} onClick={addMediaItem}>Add media</button>}
                >
                  <div className="rights-notice">
                    <span aria-hidden="true">!</span>
                    <p><strong>Use media you own or may republish.</strong> Anime and game artwork is usually third-party content; attribution alone does not grant permission.</p>
                  </div>
                  <TextField
                    label="Section heading"
                    value={config.sectionHeadings.media}
                    maxLength={70}
                    onChange={(value) => setConfig((current) => ({
                      ...current,
                      sectionHeadings: { ...current.sectionHeadings, media: value },
                    }))}
                  />
                  <p className="privacy-note"><span aria-hidden="true">●</span> The Studio references HTTPS URLs; it does not download or bundle these files. Previewing or visiting the profile contacts the media host.</p>
                  {config.media.length === 0 ? <div className="empty-state"><strong>No media yet</strong><span>Add an HTTPS image or GIF URL, then place this section anywhere in Sections.</span></div> : null}
                </EditorCard>
                {config.media.map((item, index) => (
                  <EditorCard
                    key={item.id}
                    title={`Media ${String(index + 1).padStart(2, "0")}`}
                    eyebrow={item.kind === "gif" ? "Animated image" : "Still image"}
                  >
                    {!isSafeHttpsInput(item.url) || !item.alt.trim() ? (
                      <p className="inline-error" role="alert">Add a valid HTTPS media URL and meaningful alt text to make this item export-ready.</p>
                    ) : null}
                    <SelectField
                      label="Media type"
                      value={item.kind}
                      options={[{ value: "gif", label: "Animated GIF" }, { value: "image", label: "Still image" }]}
                      onChange={(value) => updateMediaItem(index, { kind: value as MediaItem["kind"] })}
                    />
                    <TextField
                      label="HTTPS media URL"
                      value={item.url}
                      type="url"
                      placeholder="https://example.com/animation.gif"
                      hint="Use a direct HTTPS image URL without embedded credentials."
                      onChange={(value) => updateMediaItem(index, { url: value })}
                    />
                    {item.kind === "gif" ? (
                      <TextField
                        label="Reduced-motion image URL"
                        value={item.reducedMotionUrl}
                        type="url"
                        placeholder="https://example.com/still-frame.png"
                        hint="Optional but recommended. Static preview and reduced-motion visitors use this image."
                        onChange={(value) => updateMediaItem(index, { reducedMotionUrl: value })}
                      />
                    ) : null}
                    <TextArea
                      label="Alt text"
                      value={item.alt}
                      maxLength={240}
                      rows={3}
                      hint="Required. Describe the meaningful visual content without saying “image of”."
                      onChange={(value) => updateMediaItem(index, { alt: value })}
                    />
                    <TextField label="Caption" value={item.caption} maxLength={180} onChange={(value) => updateMediaItem(index, { caption: value })} />
                    <div className="field-grid">
                      <SelectField
                        label="Alignment"
                        value={item.align}
                        options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]}
                        onChange={(value) => updateMediaItem(index, { align: value as MediaItem["align"] })}
                      />
                      <label className="field range-field">
                        <span className="field-label-row"><span>Width</span><strong>{item.widthPercent}%</strong></span>
                        <input type="range" min="25" max="100" step="5" value={item.widthPercent} onChange={(event) => updateMediaItem(index, { widthPercent: Number(event.target.value) })} />
                      </label>
                    </div>
                    <details className="attribution-fields" open={Boolean(item.attribution.sourceLabel || item.attribution.licenseName)}>
                      <summary>Source and license details</summary>
                      <p>Include accurate details when the creator or license requires attribution.</p>
                      <TextField label="Source / creator label" value={item.attribution.sourceLabel} maxLength={80} onChange={(value) => updateMediaItem(index, { attribution: { ...item.attribution, sourceLabel: value } })} />
                      <TextField label="Source page URL" value={item.attribution.sourceUrl} type="url" placeholder="https://…" onChange={(value) => updateMediaItem(index, { attribution: { ...item.attribution, sourceUrl: value } })} />
                      <TextField label="License name" value={item.attribution.licenseName} maxLength={80} onChange={(value) => updateMediaItem(index, { attribution: { ...item.attribution, licenseName: value } })} />
                      <TextField label="License URL" value={item.attribution.licenseUrl} type="url" placeholder="https://…" onChange={(value) => updateMediaItem(index, { attribution: { ...item.attribution, licenseUrl: value } })} />
                    </details>
                    <ItemActions
                      index={index}
                      length={config.media.length}
                      onMove={(direction) => setConfig((current) => ({ ...current, media: moveItem(current.media, index, direction) }))}
                      onRemove={() => setConfig((current) => ({ ...current, media: current.media.filter((_, itemIndex) => itemIndex !== index) }))}
                      removeLabel="Remove media"
                    />
                  </EditorCard>
                ))}
              </>
            ) : null}

            {activePanel === "style" ? (
              <>
                {(["dark", "light"] as const).map((themeKey) => (
                  <EditorCard key={themeKey} title={`${themeKey === "dark" ? "Dark" : "Light"} palette`} eyebrow="Six-digit hex colors">
                    <div className="color-grid">
                      {(Object.keys(config.appearance[themeKey]) as Array<keyof Palette>).map((key) => (
                        <ColorField key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())} value={config.appearance[themeKey][key]} onChange={(value) => updatePalette(themeKey, key, value)} />
                      ))}
                    </div>
                  </EditorCard>
                ))}
                <EditorCard title="Shape" eyebrow="Header frame">
                  <label className="field range-field">
                    <span className="field-label-row"><span>Corner radius</span><strong>{config.appearance.cornerRadius}px</strong></span>
                    <input type="range" min="0" max="32" value={config.appearance.cornerRadius} disabled={config.layout.shapeSystem !== "rounded"} onChange={(event) => setConfig((current) => ({ ...current, appearance: { ...current.appearance, cornerRadius: Number(event.target.value) } }))} />
                    <small>{config.layout.shapeSystem === "rounded" ? "Controls rounded frames and panels." : "Choose Rounded panels in Design to use this setting."}</small>
                  </label>
                  <button
                    className="button button-secondary button-full"
                    type="button"
                    onClick={() => {
                      const preset = designPresets.find((candidate) => candidate.id === config.template.id);
                      if (!preset) return;
                      setConfig((current) => ({ ...current, appearance: structuredClone(preset.appearance) }));
                      setNotice({ tone: "info", message: `${preset.name} colors, type, and radius restored.` });
                    }}
                  >
                    Restore template styling
                  </button>
                </EditorCard>
              </>
            ) : null}

            {activePanel === "sections" ? (
              <>
                <EditorCard title="README order" eyebrow="Choose and arrange sections">
                  <div className="section-order-list">
                    {orderedSectionOptions.map((section) => {
                      const enabled = config.sections.includes(section);
                      const index = config.sections.indexOf(section);
                      return (
                        <div className={enabled ? "section-order-item section-order-item-enabled" : "section-order-item"} key={section}>
                          <label><input type="checkbox" checked={enabled} disabled={enabled && config.sections.length === 1} onChange={() => toggleSection(section)} /><span>{sectionLabel(section)}</span></label>
                          {enabled ? <ItemActions index={index} length={config.sections.length} onMove={(direction) => setConfig((current) => ({ ...current, sections: moveItem(current.sections, index, direction) }))} onRemove={() => toggleSection(section)} removeLabel="Hide" /> : null}
                        </div>
                      );
                    })}
                  </div>
                </EditorCard>
                <EditorCard title="Section headings" eyebrow="README labels">
                  <TextField label="Projects heading" value={config.sectionHeadings.repositories} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, sectionHeadings: { ...current.sectionHeadings, repositories: value } }))} />
                  <TextField label="Skills heading" value={config.sectionHeadings.skills} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, sectionHeadings: { ...current.sectionHeadings, skills: value } }))} />
                  <TextField label="Links heading" value={config.sectionHeadings.links} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, sectionHeadings: { ...current.sectionHeadings, links: value } }))} />
                  <TextField label="Media heading" value={config.sectionHeadings.media} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, sectionHeadings: { ...current.sectionHeadings, media: value } }))} />
                </EditorCard>
                <EditorCard title="Custom Markdown" eyebrow="Raw HTML is not supported">
                  <TextField label="Heading" value={config.custom.heading} maxLength={70} onChange={(value) => setConfig((current) => ({ ...current, custom: { ...current.custom, heading: value } }))} />
                  <TextArea label="Markdown content" value={config.custom.markdown} maxLength={4000} rows={8} hint="This text is kept in your configuration and added to the generated README." onChange={(value) => setConfig((current) => ({ ...current, custom: { ...current.custom, markdown: value } }))} />
                </EditorCard>
                <EditorCard title="README footer" eyebrow="Closing message">
                  <TextField label="Emphasis" value={config.footer.emphasis} maxLength={100} onChange={(value) => setConfig((current) => ({ ...current, footer: { ...current.footer, emphasis: value } }))} />
                  <TextField label="Second line" value={config.footer.line} maxLength={120} onChange={(value) => setConfig((current) => ({ ...current, footer: { ...current.footer, line: value } }))} />
                </EditorCard>
              </>
            ) : null}

            {activePanel === "export" ? (
              <>
                <EditorCard title="Ready-to-upload bundle" eyebrow="README + assets + saved config">
                  <div className={validation.success ? "export-health export-health-good" : "export-health export-health-error"}>
                    <span aria-hidden="true">{validation.success ? "✓" : "!"}</span>
                    <div><strong>{validation.success ? "Configuration is valid" : "Fix configuration errors"}</strong><p>{validation.success ? `${artifacts.length} files will be included. ${warnings.length ? `${warnings.length} review note${warnings.length === 1 ? "" : "s"}.` : "No review notes."}` : firstValidationMessage()}</p></div>
                  </div>
                  {warnings.length > 0 ? <ul className="warning-list">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
                  <div className="export-actions"><button className="button button-primary" type="button" onClick={downloadBundle} disabled={isExporting}>{isExporting ? "Building…" : "Download complete ZIP"}</button><button className="button button-secondary" type="button" onClick={downloadCurrentHero}>Download current SVG</button><button className="button button-secondary" type="button" onClick={copyReadme}>Copy README</button><button className="button button-secondary" type="button" onClick={downloadConfig}>Download config</button></div>
                  <button className="button button-secondary button-full" type="button" onClick={() => configFileInput.current?.click()}>Import a saved config</button>
                </EditorCard>
                <EditorCard title="Generated files" eyebrow="Deterministic output">
                  <ul className="artifact-list">{artifacts.map((artifact) => <li key={artifact.path}><span>{artifact.path}</span><small>{new Blob([artifact.content]).size.toLocaleString()} B</small></li>)}</ul>
                </EditorCard>
                <EditorCard title="README source" eyebrow="GitHub-flavored Markdown">
                  <textarea className="code-output" value={readme || "Fix the configuration to generate a README."} readOnly rows={18} aria-label="Generated README source" />
                </EditorCard>
              </>
            ) : null}
          </div>

          <div className="editor-footer" aria-label="Step navigation">
            <button
              className="editor-step-button"
              type="button"
              disabled={activePanelIndex === 0}
              onClick={() => selectPanel(panels[activePanelIndex - 1]!.key)}
            >
              <span aria-hidden="true">←</span>
              <span><small>Previous</small><strong>{panels[activePanelIndex - 1]?.label ?? "Start"}</strong></span>
            </button>
            <button
              className="editor-step-button editor-step-button-next"
              type="button"
              disabled={activePanelIndex === panels.length - 1}
              onClick={() => selectPanel(panels[activePanelIndex + 1]!.key)}
            >
              <span><small>Next</small><strong>{panels[activePanelIndex + 1]?.label ?? "Complete"}</strong></span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </aside>

        <section id="preview-pane" className="preview-pane" aria-labelledby="preview-heading">
          <div className="preview-toolbar">
            <div className="preview-title">
              <h2 id="preview-heading" tabIndex={-1}>Live preview</h2>
              <strong>{viewport} / {theme} / {motion}</strong>
            </div>
            <div className="preview-controls">
              <div className="preview-options">
                <label className="preview-select"><span>Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value as HeroTheme)}><option value="dark">Dark</option><option value="light">Light</option></select></label>
                <label className="preview-select"><span>Size</span><select value={viewport} onChange={(event) => setViewport(event.target.value as HeroViewport)}><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select></label>
                <label className="preview-select"><span>Motion</span><select value={motion} onChange={(event) => { setMotion(event.target.value as HeroMotion); setPaused(false); }}><option value="animated">Animated</option><option value="static">Static</option></select></label>
              </div>
              <div className="preview-actions">
                <button className="toolbar-button toolbar-button-download" type="button" onClick={downloadCurrentHero} aria-label={`Download current ${theme} ${viewport} ${motion} SVG image`}>Save SVG</button>
                {motion === "animated" ? <button className="toolbar-button" type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button> : null}
                {motion === "animated" ? <button className="toolbar-button" type="button" onClick={() => { setReplayKey((value) => value + 1); setPaused(false); }}>Replay</button> : null}
              </div>
            </div>
          </div>
          <div className={`preview-stage preview-stage-${viewport}`}>
            <div className="preview-warning-strip" hidden={warnings.length === 0}><span>{warnings.length}</span> review note{warnings.length === 1 ? "" : "s"} — open Export before publishing.</div>
            <ProfilePreview config={config} variant={variant} paused={paused} replayKey={replayKey} />
          </div>
        </section>
      </main>

      {notice ? <div className={`toast toast-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.message}</div> : null}
    </div>
  );
}
