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
