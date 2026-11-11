#!/usr/bin/env node
import { ToolkitError } from "./errors.ts";
import { run } from "./run.ts";

run(process.argv.slice(2), process.cwd()).then(
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
