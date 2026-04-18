# Logger API sketch (TypeScript)

```ts
const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });
log.error("…"); // always
log.info("…");
log.stat("name", 1); // information+
log.path("…"); // verbose+
log.debugLazy(() => `…`); // debug only
log.moduleScope(
  "label",
  () => {},
  () => ({ creeps: 3 }),
); // optional endStats
log.blankLineAfterTick(); // mainLoop: blank line between ticks (information+)
```

Module ids for `Memory.log.modules` include `mainLoop`, `roomManager`, `spawnManager`, role names matching `LOG_MODULE` (see `src/index.ts`).
