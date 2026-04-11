import { LogLevel, parseLogLevel } from "./levels";

/**
 * Effective level: Memory.log.modules[id] ?? Memory.log.default ?? codeDefault.
 * Invalid level strings in Memory are treated as unset.
 */
export function getEffectiveLevel(moduleId: string, codeDefault: LogLevel): LogLevel {
  const logMem = Memory.log;
  if (!logMem) {
    return codeDefault;
  }

  const moduleOverride = logMem.modules?.[moduleId];
  if (moduleOverride !== undefined) {
    const parsed = parseLogLevel(moduleOverride);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  const globalDefault = logMem.default;
  if (globalDefault !== undefined) {
    const parsed = parseLogLevel(globalDefault);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return codeDefault;
}
