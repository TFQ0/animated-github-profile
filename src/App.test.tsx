import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Profile Studio workspace", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<App />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("uses simple step navigation and labels the focused inspector", () => {
    const navigation = container.querySelector<HTMLElement>(".step-rail")!;
    const profileStep = container.querySelector<HTMLButtonElement>("#step-profile")!;

    expect(navigation.getAttribute("aria-label")).toBe("Profile builder steps");
    expect(navigation.querySelector("[role='tab']")).toBeNull();
    expect(container.querySelector("#step-design")?.getAttribute("aria-current")).toBe("step");

    act(() => profileStep.click());

    expect(profileStep.getAttribute("aria-current")).toBe("step");
    expect(container.querySelector("#editor-heading")?.textContent).toBe("Profile");
    expect(container.querySelector("#panel-profile")?.getAttribute("aria-labelledby")).toBe(
      "editor-heading",
    );
  });

  it("keeps edit and preview panes connected to the responsive switch", () => {
    const previewSwitch = Array.from(container.querySelectorAll<HTMLButtonElement>(".mobile-view-switch button"))
      .find((button) => button.textContent === "Preview")!;

    expect(previewSwitch.getAttribute("aria-controls")).toBe("preview-pane");
    act(() => previewSwitch.click());

    expect(previewSwitch.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("main")?.classList.contains("mobile-pane-preview")).toBe(true);
    expect(container.querySelector("#preview-pane")?.getAttribute("aria-labelledby")).toBe(
      "preview-heading",
    );
  });
});
