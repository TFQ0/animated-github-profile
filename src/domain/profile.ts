import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const safeHttpsUrl = z
  .string()
  .max(2_048, "Links must be 2,048 characters or fewer.")
  .refine(isSafeHttpsUrl, "Enter an HTTPS link without embedded credentials.");

const optionalSafeHttpsUrl = z.union([z.literal(""), safeHttpsUrl]);

const itemId = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Use an ASCII identifier without spaces.");

const githubFullName = z
  .string()
  .trim()
  .min(3)
  .max(140)
  .regex(
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/,
    "Use a GitHub owner/repository name.",
  )
  .refine((value) => !value.split("/", 1)[0]?.includes("--"), "The owner cannot contain consecutive hyphens.");

const paletteSchema = z
  .object({
    background: hexColor,
    surface: hexColor,
    terminal: hexColor,
    line: hexColor,
    text: hexColor,
    muted: hexColor,
    accent: hexColor,
    accentSoft: hexColor,
  })
  .strict();

const repositorySchema = z
  .object({
    id: itemId,
    name: z.string().trim().min(1).max(100),
    url: safeHttpsUrl,
    description: z.string().trim().max(180),
    focus: z.string().trim().max(80),
    source: z
      .object({
        provider: z.literal("github"),
        fullName: githubFullName,
      })
      .strict()
      .optional(),
  })
  .strict();

const skillGroupSchema = z
  .object({
    id: itemId,
    label: z.string().trim().min(1).max(40),
    items: z
      .array(z.string().trim().min(1).max(32))
      .min(1)
      .max(12)
      .refine(
        (items) => new Set(items.map((item) => item.toLowerCase())).size === items.length,
        "Skills in a group must be unique.",
      ),
  })
  .strict();

const linkSchema = z
  .object({
    id: itemId,
    label: z.string().trim().min(1).max(40),
    url: safeHttpsUrl,
  })
  .strict();

const legacyTemplateIdSchema = z.enum([
  "quality-control",
  "classic-terminal",
  "retro-arcade",
  "anime-hud",
]);

export const templateIdSchema = z.enum([
  "quality-control",
  "classic-terminal",
  "retro-arcade",
  "anime-hud",
  "bento-grid",
  "signal-poster",
  "custom-canvas",
]);

export const fontIdSchema = z.enum(["modern", "mono", "classic", "rounded"]);

export const compositionSchema = z.enum([
  "split",
  "stacked",
  "terminal-focus",
  "hud-grid",
  "bento",
  "poster",
]);

export const contentOrderSchema = z.enum(["identity-first", "terminal-first"]);
export const densitySchema = z.enum(["compact", "comfortable", "spacious"]);
export const shapeSystemSchema = z.enum(["rounded", "terminal", "pixel", "hud"]);
export const patternSchema = z.enum(["dots", "grid", "scanlines", "circuit", "none"]);
export const terminalStyleSchema = z.enum(["window", "panel", "minimal"]);
export const textAlignSchema = z.enum(["start", "center"]);
export const workflowStyleSchema = z.enum([
  "timeline",
  "command-chain",
  "arcade-track",
  "telemetry",
  "cards",
  "minimal",
]);
export const workflowShapeSchema = z.enum([
  "auto",
  "circle",
  "square",
  "diamond",
  "hexagon",
]);
export const decorationShapeSchema = z.enum([
  "circle",
  "square",
  "diamond",
  "cross",
  "line",
]);

const workflowStepSchema = z
  .object({
    id: itemId,
    label: z.string().trim().min(1).max(12),
    shape: workflowShapeSchema,
  })
  .strict();

const workflowSchema = z
  .object({
    style: workflowStyleSchema,
    steps: z
      .array(workflowStepSchema)
      .min(2)
      .max(6)
      .refine(
        (steps) => new Set(steps.map((step) => step.id.toLowerCase())).size === steps.length,
        "Workflow step IDs must be unique.",
      ),
  })
  .strict();

const decorationSchema = z
  .object({
    id: itemId,
    shape: decorationShapeSchema,
    x: z.number().int().min(4).max(96),
    y: z.number().int().min(8).max(92),
    size: z.number().int().min(8).max(120),
    rotation: z.number().int().min(-180).max(180),
    tone: z.enum(["accent", "accent-soft", "line", "muted"]),
    style: z.enum(["fill", "outline"]),
    opacity: z.number().min(0.15).max(1),
  })
  .strict();

const layoutSchema = z
  .object({
    composition: compositionSchema,
    contentOrder: contentOrderSchema,
    density: densitySchema,
    shapeSystem: shapeSystemSchema,
    pattern: patternSchema,
    terminalStyle: terminalStyleSchema,
    textAlign: textAlignSchema,
    decorations: z
      .array(decorationSchema)
      .max(8)
      .refine(
        (items) => new Set(items.map((item) => item.id.toLowerCase())).size === items.length,
        "Decoration IDs must be unique.",
      ),
  })
  .strict();

const mediaAttributionSchema = z
  .object({
    sourceLabel: z.string().trim().max(80).default(""),
    sourceUrl: optionalSafeHttpsUrl.default(""),
    licenseName: z.string().trim().max(80).default(""),
    licenseUrl: optionalSafeHttpsUrl.default(""),
  })
  .strict()
  .default({
    sourceLabel: "",
    sourceUrl: "",
    licenseName: "",
    licenseUrl: "",
  });

const mediaItemSchema = z
  .object({
    id: itemId,
    kind: z.enum(["image", "gif"]),
    url: safeHttpsUrl,
    reducedMotionUrl: optionalSafeHttpsUrl.default(""),
    alt: z.string().trim().min(1).max(240),
    caption: z.string().trim().max(180).default(""),
    widthPercent: z.number().int().min(25).max(100),
    align: z.enum(["left", "center", "right"]),
    attribution: mediaAttributionSchema,
  })
  .strict();

const legacySectionKeySchema = z.enum([
  "about",
  "repositories",
  "skills",
  "links",
  "custom",
]);

export const sectionKeySchema = z.enum([
  "about",
  "repositories",
  "skills",
  "links",
  "media",
  "custom",
]);

const profileConfigV1ObjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    template: z
      .object({
        id: z.literal("quality-control"),
        version: z.literal(1),
      })
      .strict()
      .default({ id: "quality-control", version: 1 }),
    identity: z
      .object({
        username: z
          .string()
          .trim()
          .min(1)
          .max(39)
          .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, "Enter a valid GitHub username.")
          .refine((value) => !value.includes("--"), "GitHub usernames cannot contain consecutive hyphens."),
        displayName: z.string().trim().min(1).max(36),
        brandMark: z.string().trim().min(1).max(12),
        headerLabel: z.string().trim().min(1).max(28),
        profileLabel: z.string().trim().min(1).max(20),
        eyebrow: z.string().trim().min(1).max(32),
        primaryRole: z.string().trim().min(1).max(44),
        secondaryRole: z.string().trim().max(54),
      })
      .strict(),
    hero: z
      .object({
        headline: z.tuple([
          z.string().trim().min(1).max(24),
          z.string().trim().min(1).max(24),
          z.string().trim().min(1).max(24),
        ]),
        command: z.string().trim().min(1).max(30),
        checks: z.array(z.string().trim().min(1).max(24)).min(1).max(4),
        completionMessage: z.string().trim().min(1).max(44),
        idleMessage: z.string().trim().min(1).max(44),
        labels: z
          .object({
            host: z.string().trim().min(1).max(16),
            demoRun: z.string().trim().min(1).max(12),
            queued: z.string().trim().min(1).max(8),
            running: z.string().trim().min(1).max(8),
            passed: z.string().trim().min(1).max(6),
            workflow: z.string().trim().min(1).max(18),
          })
          .strict()
          .default({
            host: "control",
            demoRun: "DEMO RUN",
            queued: "QUEUED",
            running: "RUNNING",
            passed: "PASS",
            workflow: "THE WORKFLOW",
          }),
        workflow: z.array(z.string().trim().min(1).max(12)).min(2).max(4),
        footerLeft: z.string().trim().min(1).max(32),
        footerRight: z.string().trim().min(1).max(44),
        animationDuration: z.number().min(8).max(30),
      })
      .strict(),
    about: z
      .object({
        heading: z.string().trim().min(1).max(70),
        paragraphs: z.array(z.string().trim().min(1).max(600)).min(1).max(3),
        processLine: z.string().trim().max(120),
      })
      .strict(),
    repositories: z.array(repositorySchema).max(6),
    skillGroups: z.array(skillGroupSchema).max(6),
    links: z.array(linkSchema).max(8),
    custom: z
      .object({
        heading: z.string().trim().max(70),
        markdown: z.string().max(4000),
      })
      .strict(),
    sections: z
      .array(legacySectionKeySchema)
      .min(1)
      .max(5)
      .refine((items) => new Set(items).size === items.length, "Sections must be unique."),
    sectionHeadings: z
      .object({
        repositories: z.string().trim().min(1).max(70),
        skills: z.string().trim().min(1).max(70),
        links: z.string().trim().min(1).max(70),
      })
      .strict(),
    appearance: z
      .object({
        dark: paletteSchema,
        light: paletteSchema,
        cornerRadius: z.number().min(0).max(32),
      })
      .strict(),
    accessibility: z
      .object({
        language: z
          .string()
          .trim()
          .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/, "Use a language tag such as en or ar-SA."),
        direction: z.enum(["ltr", "rtl", "auto"]),
        imageAlt: z.string().trim().max(240),
        svgTitle: z.string().trim().max(120),
        animatedDescription: z.string().trim().max(300),
        staticDescription: z.string().trim().max(300),
      })
      .strict()
      .default({
        language: "en",
        direction: "ltr",
        imageAlt: "",
        svgTitle: "",
        animatedDescription: "",
        staticDescription: "",
      }),
    footer: z
      .object({
        emphasis: z.string().trim().max(100),
        line: z.string().trim().max(120),
      })
      .strict(),
  })
  .strict();

export const profileConfigV1Schema = profileConfigV1ObjectSchema
  .superRefine((config, context) => {
    for (const key of ["repositories", "skillGroups", "links"] as const) {
      const seen = new Set<string>();
      config[key].forEach((item, index) => {
        const normalized = item.id.toLowerCase();
        if (seen.has(normalized)) {
          context.addIssue({
            code: "custom",
            path: [key, index, "id"],
            message: "IDs must be unique within this collection.",
          });
        }
        seen.add(normalized);
      });
    }
  });

const profileConfigV2ObjectSchema = profileConfigV1ObjectSchema
  .extend({
    schemaVersion: z.literal(2),
    template: z
      .object({
        id: legacyTemplateIdSchema,
        version: z.literal(1),
      })
      .strict(),
    media: z.array(mediaItemSchema).max(6),
    sections: z
      .array(sectionKeySchema)
      .min(1)
      .max(6)
      .refine((items) => new Set(items).size === items.length, "Sections must be unique."),
    sectionHeadings: profileConfigV1ObjectSchema.shape.sectionHeadings
      .extend({
        media: z.string().trim().min(1).max(70),
      })
      .strict(),
    appearance: profileConfigV1ObjectSchema.shape.appearance
      .extend({
        fontId: fontIdSchema,
      })
      .strict(),
  })
  .strict();

export const profileConfigV2Schema = profileConfigV2ObjectSchema
  .superRefine((config, context) => {
    for (const key of ["repositories", "skillGroups", "links", "media"] as const) {
      const items = key === "media" ? config.media : config[key];
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const normalized = item.id.toLowerCase();
        if (seen.has(normalized)) {
          context.addIssue({
            code: "custom",
            path: [key, index, "id"],
            message: "IDs must be unique within this collection.",
          });
        }
        seen.add(normalized);
      });
    }
  });

export const profileConfigSchema = profileConfigV2ObjectSchema
  .extend({
    schemaVersion: z.literal(3),
    template: z
      .object({
        id: templateIdSchema,
        version: z.literal(1),
      })
      .strict(),
    hero: profileConfigV1ObjectSchema.shape.hero
      .extend({
        workflow: workflowSchema,
      })
      .strict(),
    layout: layoutSchema,
  })
  .strict()
  .superRefine((config, context) => {
    for (const key of ["repositories", "skillGroups", "links", "media"] as const) {
      const items = key === "media" ? config.media : config[key];
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const normalized = item.id.toLowerCase();
        if (seen.has(normalized)) {
          context.addIssue({
            code: "custom",
            path: [key, index, "id"],
            message: "IDs must be unique within this collection.",
          });
        }
        seen.add(normalized);
      });
    }
  });

export type ProfileConfig = z.infer<typeof profileConfigSchema>;
export type ProfileConfigV1 = z.infer<typeof profileConfigV1Schema>;
export type ProfileConfigV2 = z.infer<typeof profileConfigV2Schema>;
export type SectionKey = z.infer<typeof sectionKeySchema>;
export type TemplateId = z.infer<typeof templateIdSchema>;
export type FontId = z.infer<typeof fontIdSchema>;
export type Composition = z.infer<typeof compositionSchema>;
export type ContentOrder = z.infer<typeof contentOrderSchema>;
export type Density = z.infer<typeof densitySchema>;
export type ShapeSystem = z.infer<typeof shapeSystemSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type TerminalStyle = z.infer<typeof terminalStyleSchema>;
export type TextAlign = z.infer<typeof textAlignSchema>;
export type WorkflowStyle = z.infer<typeof workflowStyleSchema>;
export type WorkflowShape = z.infer<typeof workflowShapeSchema>;
export type DecorationShape = z.infer<typeof decorationShapeSchema>;
export type Repository = ProfileConfig["repositories"][number];
export type SkillGroup = ProfileConfig["skillGroups"][number];
export type ProfileLink = ProfileConfig["links"][number];
export type MediaItem = ProfileConfig["media"][number];
export type WorkflowStep = ProfileConfig["hero"]["workflow"]["steps"][number];
export type Decoration = ProfileConfig["layout"]["decorations"][number];
export type Palette = ProfileConfig["appearance"]["dark"];

export const defaultProfileConfig: ProfileConfig = {
  schemaVersion: 3,
  template: {
    id: "quality-control",
    version: 1,
  },
  layout: {
    composition: "split",
    contentOrder: "identity-first",
    density: "comfortable",
    shapeSystem: "rounded",
    pattern: "dots",
    terminalStyle: "window",
    textAlign: "start",
    decorations: [],
  },
  identity: {
    username: "sample-builder",
    displayName: "Sample Builder",
    brandMark: "SB",
    headerLabel: "PROFILE LAB",
    profileLabel: "FICTIONAL / 01",
    eyebrow: "FICTIONAL SAMPLE",
    primaryRole: "Creative Developer",
    secondaryRole: "Open-source builder  /  BUG solver",
  },
  hero: {
    headline: ["Imagine it.", "Build it.", "Share it."],
    command: "./profile-preview --all",
    checks: ["Profile content", "Responsive layout", "Project links", "Export bundle"],
    completionMessage: "Profile ready. Make it yours.",
    idleMessage: "Edit. Preview. Export.",
    labels: {
      host: "studio",
      demoRun: "DEMO RUN",
      queued: "QUEUED",
      running: "RUNNING",
      passed: "PASS",
      workflow: "THE WORKFLOW",
    },
    workflow: {
      style: "timeline",
      steps: [
        { id: "workflow-1", label: "PLAN", shape: "auto" },
        { id: "workflow-2", label: "BUILD", shape: "auto" },
        { id: "workflow-3", label: "PREVIEW", shape: "auto" },
        { id: "workflow-4", label: "SHARE", shape: "auto" },
      ],
    },
    footerLeft: "EDIT. PREVIEW. EXPORT.",
    footerRight: "BUILT FOR YOUR GITHUB STORY.",
    animationDuration: 16,
  },
  about: {
    heading: "Building useful things.",
    paragraphs: [
      "This is a fictional profile showing how a short introduction can explain what you build and why it matters.",
      "Replace every sample detail with your own projects, skills, links, and voice before publishing.",
    ],
    processLine: "plan  →  build  →  review  →  share",
  },
  repositories: [
    {
      id: "sample/project-atlas",
      name: "Project Atlas",
      url: "https://example.com/projects/atlas",
      description: "A fictional workspace for organizing ideas, milestones, and project notes.",
      focus: "Product design · TypeScript",
    },
    {
      id: "sample/interface-kit",
      name: "Interface Kit",
      url: "https://example.com/projects/interface-kit",
      description: "A fictional collection of accessible components and reusable design patterns.",
      focus: "Accessibility · React",
    },
    {
      id: "sample/automation-lab",
      name: "Automation Lab",
      url: "https://example.com/projects/automation-lab",
      description: "A fictional playground for dependable tests and small developer tools.",
      focus: "Testing · Automation",
    },
  ],
  skillGroups: [
    {
      id: "design",
      label: "Design",
      items: ["UI systems", "Accessibility", "Prototyping"],
    },
    {
      id: "development",
      label: "Development",
      items: ["TypeScript", "React", "Testing"],
    },
    {
      id: "delivery",
      label: "Delivery",
      items: ["Git", "CI workflows", "Documentation"],
    },
  ],
  links: [
    {
      id: "profile",
      label: "Profile",
      url: "https://example.com/profile",
    },
    {
      id: "projects",
      label: "Projects",
      url: "https://example.com/projects",
    },
    {
      id: "contact",
      label: "Contact",
      url: "https://example.com/contact",
    },
  ],
  media: [],
  custom: {
    heading: "",
    markdown: "",
  },
  sections: ["about", "repositories", "skills", "links"],
  sectionHeadings: {
    repositories: "Selected work",
    skills: "Toolbox",
    links: "Open source",
    media: "Gallery",
  },
  appearance: {
    dark: {
      background: "#0C1418",
      surface: "#111E24",
      terminal: "#0A1216",
      line: "#26383E",
      text: "#ECF1ED",
      muted: "#97ACAF",
      accent: "#ACF5C6",
      accentSoft: "#173B31",
    },
    light: {
      background: "#F3F5EE",
      surface: "#E8EEE5",
      terminal: "#FAFBF6",
      line: "#CED7CC",
      text: "#172A25",
      muted: "#586D63",
      accent: "#24734D",
      accentSoft: "#DCEBDA",
    },
    cornerRadius: 18,
    fontId: "modern",
  },
  accessibility: {
    language: "en",
    direction: "ltr",
    imageAlt: "",
    svgTitle: "",
    animatedDescription: "",
    staticDescription: "",
  },
  footer: {
    emphasis: "Make the profile your own.",
    line: "Edit the content, preview every layout, then export.",
  },
};

export function cloneDefaultConfig(): ProfileConfig {
  return structuredClone(defaultProfileConfig);
}

export function createBlankConfig(): ProfileConfig {
  const config = cloneDefaultConfig();
  config.identity = {
    username: "your-name",
    displayName: "Your Name",
    brandMark: "YOU",
    headerLabel: "PROFILE SYSTEM",
    profileLabel: "PROFILE / 01",
    eyebrow: "YOUR NAME",
    primaryRole: "Your primary role",
    secondaryRole: "Builder  /  Open source",
  };
  config.about = {
    heading: "A little about me.",
    paragraphs: [
      "Write a short introduction about what you build, how you work, and what you care about.",
    ],
    processLine: "explore  →  build  →  learn  →  improve",
  };
  config.repositories = [];
  config.skillGroups = [];
  config.links = [
    {
      id: "github-profile",
      label: "GitHub profile",
      url: "https://github.com/your-name",
    },
  ];
  config.footer = {
    emphasis: "Keep building in public.",
    line: "Make this profile unmistakably yours.",
  };
  return config;
}

export function parseProfileConfig(value: unknown): ProfileConfig {
  if (value && typeof value === "object" && "schemaVersion" in value) {
    const version = (value as { schemaVersion?: unknown }).schemaVersion;
    switch (version) {
      case 1:
        return migrateProfileConfigV1(profileConfigV1Schema.parse(value));
      case 2:
        return migrateProfileConfigV2ToV3(profileConfigV2Schema.parse(value));
      case 3:
        return profileConfigSchema.parse(value);
      default:
        throw new Error(`Unsupported profile configuration version: ${String(version)}.`);
    }
  }
  return profileConfigSchema.parse(value);
}

export function migrateProfileConfigV1(config: ProfileConfigV1): ProfileConfig {
  return migrateProfileConfigV2ToV3(migrateProfileConfigV1ToV2(config));
}

export function migrateProfileConfigV1ToV2(config: ProfileConfigV1): ProfileConfigV2 {
  const legacy = structuredClone(config);
  return profileConfigV2Schema.parse({
    ...legacy,
    schemaVersion: 2,
    media: [],
    sectionHeadings: {
      ...legacy.sectionHeadings,
      media: "Gallery",
    },
    appearance: {
      ...legacy.appearance,
      fontId: "modern",
    },
  });
}

const legacyPatternByTemplate: Record<ProfileConfigV2["template"]["id"], Pattern> = {
  "quality-control": "dots",
  "classic-terminal": "scanlines",
  "retro-arcade": "grid",
  "anime-hud": "circuit",
};

export function migrateProfileConfigV2ToV3(config: ProfileConfigV2): ProfileConfig {
  const legacy = structuredClone(config);
  return profileConfigSchema.parse({
    ...legacy,
    schemaVersion: 3,
    hero: {
      ...legacy.hero,
      workflow: {
        style: "timeline",
        steps: legacy.hero.workflow.map((label, index) => ({
          id: `workflow-${index + 1}`,
          label,
          shape: "auto",
        })),
      },
    },
    layout: {
      composition: "split",
      contentOrder: "identity-first",
      density: "comfortable",
      shapeSystem: "rounded",
      pattern: legacyPatternByTemplate[legacy.template.id],
      terminalStyle: "window",
      textAlign: "start",
      decorations: [],
    },
  });
}

export function createId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}-${random[0]?.toString(36)}${random[1]?.toString(36)}`;
}
