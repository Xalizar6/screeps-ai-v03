export const LogLevel = {
  Error: 0,
  Information: 1,
  Verbose: 2,
  Debug: 3,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LogLevelName = "error" | "information" | "verbose" | "debug";

const NAME_TO_LEVEL: Record<LogLevelName, LogLevel> = {
  error: LogLevel.Error,
  information: LogLevel.Information,
  verbose: LogLevel.Verbose,
  debug: LogLevel.Debug,
};

export function parseLogLevel(name: string): LogLevel | undefined {
  const key = name.toLowerCase().trim();
  if (key in NAME_TO_LEVEL) {
    return NAME_TO_LEVEL[key as LogLevelName];
  }
  return undefined;
}

export function levelToString(level: LogLevel): LogLevelName {
  switch (level) {
    case LogLevel.Error:
      return "error";
    case LogLevel.Information:
      return "information";
    case LogLevel.Verbose:
      return "verbose";
    case LogLevel.Debug:
      return "debug";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
