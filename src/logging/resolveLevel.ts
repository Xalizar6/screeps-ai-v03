import { LogLevel, parseLogLevel, type LogGroup } from "./levels";

/**
 * Effective level: Memory.log.modules[id] ?? Memory.log.groups[group] ?? Memory.log.default ?? codeDefault.
 * Invalid level strings in Memory are treated as unset so resolution continues down the chain.
 * When `group` is omitted or empty, `groups` is skipped (callers should use {@link LogGroup}).
 */
export function getEffectiveLevel(
  moduleId: string,
  codeDefault: LogLevel,
  group?: LogGroup,
): LogLevel {
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

  if (group) {
    const groupOverride = logMem.groups?.[group];
    if (groupOverride !== undefined) {
      const parsed = parseLogLevel(groupOverride);
      if (parsed !== undefined) {
        return parsed;
      }
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
