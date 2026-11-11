import { spawn } from "node:child_process";

const FORWARDED = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

/**
 * Run a program on this process's stdio until it exits; resolves to its exit code, or 1 when a
 * signal ended it. A signal that would end the CLI goes to the child instead and the CLI exits
 * once the child has, so a long-running child (`typst watch`, an MCP server) is never orphaned.
 */
export function runChild(command: string, args: readonly string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    const forwards = FORWARDED.map((signal) => {
      const forward = (): void => {
        child.kill(signal);
      };
      process.on(signal, forward);
      return { signal, forward };
    });
    const stopForwarding = (): void => {
      for (const { signal, forward } of forwards) {
        process.off(signal, forward);
      }
    };
    child.on("error", (error) => {
      stopForwarding();
      reject(error);
    });
    child.on("exit", (code, signal) => {
      stopForwarding();
      resolvePromise(code ?? (signal ? 1 : 0));
    });
  });
}
