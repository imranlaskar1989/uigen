import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

describe("ToolCallDisplay", () => {
  describe("str_replace_editor tool", () => {
    test("displays 'Creating' message for create command", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
        />
      );

      expect(screen.getByText("Creating App.jsx")).toBeDefined();
    });

    test("displays 'Editing' message for str_replace command", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "str_replace", path: "/components/Card.jsx" }}
          state="result"
        />
      );

      expect(screen.getByText("Editing Card.jsx")).toBeDefined();
    });

    test("displays 'Adding code to' message for insert command", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "insert", path: "/styles.css" }}
          state="result"
        />
      );

      expect(screen.getByText("Adding code to styles.css")).toBeDefined();
    });

    test("displays 'Reading' message for view command", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "view", path: "/package.json" }}
          state="result"
        />
      );

      expect(screen.getByText("Reading package.json")).toBeDefined();
    });

    test("displays 'Modifying' message for unknown command", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "unknown", path: "/test.js" }}
          state="result"
        />
      );

      expect(screen.getByText("Modifying test.js")).toBeDefined();
    });

    test("extracts filename from full path", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/src/components/ui/Button.tsx" }}
          state="result"
        />
      );

      expect(screen.getByText("Creating Button.tsx")).toBeDefined();
    });

    test("handles missing path gracefully", () => {
      render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create" }}
          state="result"
        />
      );

      expect(screen.getByText("Creating file")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    test("displays 'Renaming' message for rename command", () => {
      render(
        <ToolCallDisplay
          toolName="file_manager"
          args={{
            command: "rename",
            path: "/old.jsx",
            new_path: "/new.jsx",
          }}
          state="result"
        />
      );

      expect(screen.getByText("Renaming old.jsx to new.jsx")).toBeDefined();
    });

    test("displays 'Deleting' message for delete command", () => {
      render(
        <ToolCallDisplay
          toolName="file_manager"
          args={{ command: "delete", path: "/temp.js" }}
          state="result"
        />
      );

      expect(screen.getByText("Deleting temp.js")).toBeDefined();
    });

    test("displays 'Managing' message for unknown command", () => {
      render(
        <ToolCallDisplay
          toolName="file_manager"
          args={{ command: "unknown", path: "/file.js" }}
          state="result"
        />
      );

      expect(screen.getByText("Managing file.js")).toBeDefined();
    });
  });

  describe("loading state", () => {
    test("shows loading spinner when state is 'call'", () => {
      const { container } = render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    test("shows loading spinner when state is 'partial-call'", () => {
      const { container } = render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="partial-call"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    test("shows icon when state is 'result'", () => {
      const { container } = render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeNull();
    });
  });

  describe("unknown tool", () => {
    test("displays tool name for unknown tool without args", () => {
      render(
        <ToolCallDisplay toolName="unknown_tool" state="result" />
      );

      expect(screen.getByText("unknown_tool")).toBeDefined();
    });

    test("displays tool name for unknown tool with args", () => {
      render(
        <ToolCallDisplay
          toolName="custom_tool"
          args={{ some: "data" }}
          state="result"
        />
      );

      expect(screen.getByText("custom_tool")).toBeDefined();
    });
  });

  describe("styling", () => {
    test("applies correct CSS classes", () => {
      const { container } = render(
        <ToolCallDisplay
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain("inline-flex");
      expect(element.className).toContain("items-center");
      expect(element.className).toContain("gap-2");
      expect(element.className).toContain("rounded-lg");
      expect(element.className).toContain("bg-neutral-50");
    });
  });
});
