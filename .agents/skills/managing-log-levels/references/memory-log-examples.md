# Memory.log examples (Screeps console)

```js
Memory.log = { default: "information" }; // typical: scope + CPU lines
Memory.log = { default: "error" }; // quiet
Memory.log = { default: "verbose" }; // + path
Memory.log = { default: "debug" }; // + debugLazy
Memory.log = { default: "error", modules: { harvester: "debug" } }; // one subsystem loud
Memory.log = { default: "error", groups: { management: "debug" } }; // all management modules
Memory.log = { default: "error", groups: { roles: "debug" } }; // all role modules
delete Memory.log; // back to code defaults
```

For FSM transition lines under verbose:

```js
Memory.log = { default: "error", modules: { fsm: "verbose" } };
```
