#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile, compileUsage } from "./commands/compile.ts";
import { link, linkUsage } from "./commands/link.ts";
import { mcp, mcpUsage } from "./commands/mcp.ts";
import { newProject, newProjectUsage } from "./commands/new-project.ts";
import { ToolkitError } from "./errors.ts";
import { packageRoot } from "./paths.ts";

const usage = `thesis-toolkit <command>

Commands:
${[compileUsage, newProjectUsage, linkUsage, mcpUsage].join("\n\n")}

Writing-project commands read the nearest thesis-toolkit.json:
  { "root": "..", "projectsDir": "projects", "bibliography": "../literature/references/bibliography.bib" }
Paths are relative to that file; root is the Typst --root.`;

function version(): string {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
  return manifest.version;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...args] = argv;
  switch (command) {
    case "compile":
      return compile(args, process.cwd());
    case "new-project":
      return newProject(args, process.cwd());
    case "link":
      return link();
    case "mcp":
      return mcp(args);
    case "--version":
    case "-v":
      console.log(version());
      return 0;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(usage);
      return command === undefined ? 1 : 0;
    default:
      throw new ToolkitError(`unknown command: ${command}\n\n${usage}`);
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    if (error instanceof ToolkitError) {
      console.error(`error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  },
);
