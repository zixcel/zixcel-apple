# zixcel-apple interface reference

Use the [usage guide](getting-started.md) for the first steps. This reference preserves the current interface details and operational limits. Run command examples from the repository root, after preparing the exact declared dependencies and registered configuration.

## Library use

```rust
use zixcel_apple::{build_plan, parse_config};

let config = parse_config(include_str!("config.toml"))?;
let plan = build_plan(&config)?;
assert!(plan.steps.iter().all(|step| step.effect != "mutate"));
```

`parse_config` validates closed TOML up to 1 MiB, secret references and the service allowlist. The crate currently uses `publish = false` for local validation.
