import { parseProfileConfig, type ProfileConfig } from "./domain/profile";

interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: unknown): unknown | Promise<unknown>;
}

interface WebModelContext {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ): void | Promise<void>;
}

declare global {
  interface Document {
    readonly modelContext?: WebModelContext;
  }
}

interface ProfileToolActions {
  readDraft: () => {
    config: ProfileConfig;
    valid: boolean;
    issues: string[];
    generatedFiles: string[];
  };
  stageConfig: (config: ProfileConfig) => void | Promise<void>;
  onRegistrationError?: (error: unknown) => void;
}

function readOuterObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object.");
  }
  return input as Record<string, unknown>;
}

export function registerProfileWebMcpTools(actions: ProfileToolActions): (() => void) | undefined {
  const context = typeof document === "undefined" ? undefined : document.modelContext;
  if (!context?.registerTool) return undefined;

  const lifecycle = new AbortController();
  const reportRegistrationError = (error: unknown) => {
    if (
      lifecycle.signal.aborted &&
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError"
    ) {
      return;
    }
    actions.onRegistrationError?.(error);
  };
  const register = (tool: WebMcpTool) => {
    try {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(
        reportRegistrationError,
      );
    } catch (error) {
      reportRegistrationError(error);
    }
  };

  register({
    name: "read_profile_draft",
    title: "Read profile draft",
    description:
      "Read the complete editable v1 profile configuration, validation state, and generated file list without changing the visible editor.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute(input) {
      if (input !== undefined && input !== null && Object.keys(readOuterObject(input)).length > 0) {
        throw new Error("read_profile_draft does not accept properties.");
      }
      return actions.readDraft();
    },
  });

  register({
    name: "stage_profile_configuration",
    title: "Stage profile configuration",
    description:
      "Validate and stage one complete v1 Profile Studio configuration in the visible editor. This updates the local draft but does not download or publish it.",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          description:
            "A complete configuration, typically copied from read_profile_draft and edited in place.",
        },
      },
      required: ["config"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      const outer = readOuterObject(input);
      if (Object.keys(outer).some((key) => key !== "config") || !("config" in outer)) {
        throw new Error("Provide exactly one config property.");
      }
      const config = parseProfileConfig(outer.config);
      await actions.stageConfig(config);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      return {
        status: "staged",
        schemaVersion: config.schemaVersion,
        username: config.identity.username,
        repositoryCount: config.repositories.length,
      };
    },
  });

  return () => lifecycle.abort();
}

export type { WebMcpTool };
