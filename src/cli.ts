#!/usr/bin/env node
import { userMessage } from "./errors.ts";
import { run } from "./run.ts";

run(process.argv.slice(2), process.cwd()).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    const message = userMessage(error);
    if (message === undefined) {
      throw error;
    }
    console.error(`error: ${message}`);
    process.exitCode = 1;
  },
);
