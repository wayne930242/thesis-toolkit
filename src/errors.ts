/** A failure the user can act on; the CLI prints its message without a stack trace. */
export class ToolkitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** `thesis-toolkit.json` is missing or malformed. */
export class ConfigError extends ToolkitError {}

/** A writing project, target, or source file does not exist or is invalid. */
export class ProjectError extends ToolkitError {}

/** A required external program (typst, uv) is missing or too old. */
export class DependencyError extends ToolkitError {}

/** Fetching or verifying a pinned artifact failed. */
export class DownloadError extends ToolkitError {}

/** An error the operating system returned for a call (ENOENT, EACCES, ENOTDIR, ENOSPC...), as Node reports it. */
function isSystemError(error: unknown): error is NodeJS.ErrnoException {
  if (!(error instanceof Error)) {
    return false;
  }
  const { code, errno, syscall } = error as NodeJS.ErrnoException;
  return typeof code === "string" && typeof errno === "number" && typeof syscall === "string";
}

/**
 * The line to print for a failure the user can act on: a ToolkitError, or an operating-system
 * error such as an unwritable cache directory. Anything else is a bug and returns undefined, so
 * the caller lets it surface with its stack.
 */
export function userMessage(error: unknown): string | undefined {
  if (error instanceof ToolkitError || isSystemError(error)) {
    return error.message;
  }
  return undefined;
}
