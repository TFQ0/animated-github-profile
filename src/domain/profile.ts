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

export const sectionKeySchema = z.enum([
  "about",
  "repositories",
  "skills",
  "links",
  "custom",
]);

export const profileConfigSchema = z
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
      .array(sectionKeySchema)
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
  .strict()
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

export type ProfileConfig = z.infer<typeof profileConfigSchema>;
export type SectionKey = z.infer<typeof sectionKeySchema>;
export type Repository = ProfileConfig["repositories"][number];
export type SkillGroup = ProfileConfig["skillGroups"][number];
export type ProfileLink = ProfileConfig["links"][number];
export type Palette = ProfileConfig["appearance"]["dark"];

export const defaultProfileConfig: ProfileConfig = {
  schemaVersion: 1,
  template: {
    id: "quality-control",
    version: 1,
  },
  identity: {
    username: "TFQ0",
    displayName: "Talal Alqahs",
    brandMark: "TFQ0",
    headerLabel: "QUALITY CONTROL",
    profileLabel: "PROFILE / 01",
    eyebrow: "TALAL ALQAHS",
    primaryRole: "Software Test Engineer",
    secondaryRole: "Independent Developer  /  Open Source",
  },
  hero: {
    headline: ["Build it.", "Break it.", "Make it better."],
    command: "./quality-check --all",
    checks: ["API contracts", "UI regression", "Integration tests", "Build pipeline"],
    completionMessage: "Checks complete. Keep improving.",
    idleMessage: "Inspect. Verify. Improve.",
    labels: {
      host: "control",
      demoRun: "DEMO RUN",
      queued: "QUEUED",
      running: "RUNNING",
      passed: "PASS",
      workflow: "THE WORKFLOW",
    },
    workflow: ["BUILD", "TEST", "LEARN", "REPEAT"],
    footerLeft: "LESS NOISE. MORE SIGNAL.",
    footerRight: "NO MONOPOLY. YES TO OPEN SOURCE.",
    animationDuration: 16,
  },
  about: {
    heading: "Beyond the green checkmark.",
    paragraphs: [
      "I'm Talal, a Software Test Engineer and independent developer. I work across UI automation, API testing, and backend development—connecting how software is built with how it behaves in the real world.",
      "I like reproducible bugs, useful automation, readable code, and tools that stay open.",
    ],
    processLine: "inspect  →  reproduce  →  automate  →  improve",
  },
  repositories: [
    {
      id: "TFQ0/tfq0seo",
      name: "tfq0seo",
      url: "https://github.com/TFQ0/tfq0seo",
      description: "A command-line SEO analyzer with site crawling and report generation.",
      focus: "Python · CLI tooling",
      source: { provider: "github", fullName: "TFQ0/tfq0seo" },
    },
    {
      id: "TFQ0/tfq0tool",
      name: "tfq0tool",
      url: "https://github.com/TFQ0/tfq0tool",
      description: "Extracts text from documents, data files, and source code.",
      focus: "Python · Automation",
      source: { provider: "github", fullName: "TFQ0/tfq0tool" },
    },
    {
      id: "TFQ0/ksaa-api-tool",
      name: "ksaa-api-tool",
      url: "https://github.com/TFQ0/ksaa-api-tool",
      description: "A browser-based interface for exploring Falak API endpoints.",
      focus: "API testing · Developer tooling",
      source: { provider: "github", fullName: "TFQ0/ksaa-api-tool" },
    },
  ],
  skillGroups: [
    {
      id: "testing",
      label: "Testing",
      items: ["Playwright", "Cypress", "Bruno", "Postman", "JMeter"],
    },
    {
      id: "development",
      label: "Development",
      items: ["Python", "TypeScript", "JavaScript", "FastAPI", "PostgreSQL"],
    },
    {
      id: "delivery",
      label: "Environment & delivery",
      items: ["Git", "GitHub Actions", "Docker", "Linux"],
    },
  ],
  links: [
    {
      id: "pull-requests",
      label: "Pull requests",
      url: "https://github.com/pulls?q=is%3Apr+author%3ATFQ0",
    },
    {
      id: "issues",
      label: "Issues",
      url: "https://github.com/issues?q=is%3Aissue+author%3ATFQ0",
    },
    {
      id: "repositories",
      label: "Repositories",
      url: "https://github.com/TFQ0?tab=repositories",
    },
  ],
  custom: {
    heading: "",
    markdown: "",
  },
  sections: ["about", "repositories", "skills", "links"],
  sectionHeadings: {
    repositories: "Selected work",
    skills: "Toolbox",
    links: "Open source",
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
    emphasis: "No monopoly. Yes to open source.",
    line: "Build it. Break it. Test it. Improve it.",
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
        return profileConfigSchema.parse(value);
      default:
        throw new Error(`Unsupported profile configuration version: ${String(version)}.`);
    }
  }
  return profileConfigSchema.parse(value);
}

export function createId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}-${random[0]?.toString(36)}${random[1]?.toString(36)}`;
}
