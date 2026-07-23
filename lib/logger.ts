import { randomUUID } from "crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  traceId?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function createTraceId(): string {
  return randomUUID();
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) =>
    emit("error", message, context),
};
