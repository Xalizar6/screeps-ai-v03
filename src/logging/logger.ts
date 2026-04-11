import { LogLevel } from "./levels";
import { getEffectiveLevel } from "./resolveLevel";

export interface CreateLoggerOptions {
  defaultLevel: LogLevel;
}

export interface Logger {
  readonly moduleId: string;
  error(message: string, err?: unknown): void;
  info(message: string): void;
  stat(name: string, value: string | number): void;
  path(message: string): void;
  debugLazy(lazy: () => string): void;
  moduleScope<R>(
    label: string,
    fn: () => R,
    endStats?: () => Record<string, string | number>,
  ): R;
  /** Empty line in the console after this tick’s logs; no-op below `information`. */
  blankLineAfterTick(): void;
}

function formatLine(moduleId: string, tag: string, body: string): string {
  return `[tick=${Game.time}][${moduleId}][${tag}] ${body}`;
}

export function createLogger(
  moduleId: string,
  options: CreateLoggerOptions,
): Logger {
  const { defaultLevel } = options;
  let lastResolvedTick = -1;
  let cachedLevel: LogLevel = defaultLevel;

  const currentLevel = (): LogLevel => {
    if (lastResolvedTick !== Game.time) {
      lastResolvedTick = Game.time;
      cachedLevel = getEffectiveLevel(moduleId, defaultLevel);
    }
    return cachedLevel;
  };

  return {
    moduleId,

    error(message: string, err?: unknown): void {
      const line = formatLine(moduleId, "ERROR", message);
      if (err !== undefined) {
        console.error(line, err);
      } else {
        console.error(line);
      }
    },

    info(message: string): void {
      if (currentLevel() < LogLevel.Information) {
        return;
      }
      console.log(formatLine(moduleId, "INFO", message));
    },

    stat(name: string, value: string | number): void {
      if (currentLevel() < LogLevel.Information) {
        return;
      }
      console.log(formatLine(moduleId, "STAT", `${name}=${value}`));
    },

    path(message: string): void {
      if (currentLevel() < LogLevel.Verbose) {
        return;
      }
      console.log(formatLine(moduleId, "PATH", message));
    },

    debugLazy(lazy: () => string): void {
      if (currentLevel() < LogLevel.Debug) {
        return;
      }
      console.log(formatLine(moduleId, "DEBUG", lazy()));
    },

    moduleScope<R>(
      label: string,
      fn: () => R,
      endStats?: () => Record<string, string | number>,
    ): R {
      const lvl = currentLevel();
      const cpu0 = Game.cpu.getUsed();
      try {
        return fn();
      } finally {
        if (lvl >= LogLevel.Information) {
          const cpuMs = Game.cpu.getUsed() - cpu0;
          const stats = endStats?.() ?? {};
          const statPairs = Object.entries(stats)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ");
          const tail = statPairs.length > 0 ? ` ${statPairs}` : "";
          console.log(
            formatLine(
              moduleId,
              "SCOPE",
              `label=${label} cpuMs=${cpuMs.toFixed(3)}${tail}`,
            ),
          );
        }
      }
    },

    blankLineAfterTick(): void {
      if (currentLevel() < LogLevel.Information) {
        return;
      }
      console.log("-------------------------------------");
    },
  };
}
