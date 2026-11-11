import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile, compileUsage } from "./commands/compile.ts";
import { link, linkUsage } from "./commands/link.ts";
import { mcp, mcpUsage } from "./commands/mcp.ts";
import { newProject, newProjectUsage } from "./commands/new-project.ts";
import { ToolkitError } from "./errors.ts";
import { packageRoot } from "./paths.ts";

interface Command {
  usage: string;
  run: (args: string[], cwd: string) => number | Promise<number>;
}

const commands: Record<string, Command> = {
  compile: { usage: compileUsage, run: (args, cwd) => compile(args, cwd) },
  "new-project": { usage: newProjectUsage, run: (args, cwd) => newProject(args, cwd) },
  link: { usage: linkUsage, run: () => link() },
  mcp: { usage: mcpUsage, run: (args) => mcp(args) },
};

export const usage = `thesis-toolkit <command>

Commands:
${Object.values(commands)
  .map((command) => command.usage)
  .join("\n\n")}

Run \`thesis-toolkit <command> --help\` for one command's usage.
Writing-project commands read the nearest thesis-toolkit.json:
  { "root": "..", "projectsDir": "projects", "bibliography": "../literature/references/bibliography.bib" }
Paths are relative to that file; root is the Typst --root.`;

const HELP_FLAGS = new Set(["-h", "--help"]);

function lookup(name: string): Command {
  if (!Object.hasOwn(commands, name)) {
    throw new ToolkitError(`unknown command: ${name}\n\n${usage}`);
  }
  return commands[name] as Command;
}

function version(): string {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
  return manifest.version;
}

/**
 * Dispatch one CLI invocation. A help flag anywhere in a command's arguments prints that
 * command's usage and runs nothing, so `link --help` never writes links.
 */
export async function run(argv: string[], cwd: string, out: (text: string) => void = console.log): Promise<number> {
  const [name, ...args] = argv;
  if (name === undefined) {
    out(usage);
    return 1;
  }
  if (name === "--version" || name === "-v") {
    out(version());
    return 0;
  }
  if (name === "help" || HELP_FLAGS.has(name)) {
    const [topic] = args;
    if (topic === undefined) {
      out(usage);
      return 0;
    }
    out(lookup(topic).usage);
    return 0;
  }
  const command = lookup(name);
  if (args.some((arg) => HELP_FLAGS.has(arg))) {
    out(command.usage);
    return 0;
  }
  return command.run(args, cwd);
}
