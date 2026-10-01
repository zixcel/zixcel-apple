# zixcel-apple

An independent connector that validates iCloud Calendar, Contacts and Drive configuration and generates deterministic plans. The CLI performs no communication, credential resolution or execution.

```bash
cargo run --offline -- doctor
cargo run --offline -- capabilities
cargo run --offline -- validate examples/config.toml
cargo run --offline -- plan examples/config.toml
```

Configuration contains only opaque account references and `secret://...` references. Do not include Apple IDs, passwords or app-specific passwords; credential fields are rejected during validation.

## Library use

```rust
use zixcel_apple::{build_plan, parse_config};

let config = parse_config(include_str!("config.toml"))?;
let plan = build_plan(&config)?;
assert!(plan.steps.iter().all(|step| step.effect != "mutate"));
```

`parse_config` validates closed TOML up to 1 MiB, secret references and the service allowlist. The crate currently uses `publish = false` for local validation.

## Quality gate

These checks run within this crate without communication or resident processes.

```bash
# WONDERLAND_ROOT is the workspace checkout root.
"$WONDERLAND_ROOT/bin/verify-repositories" --rust --tier standard
```

## Package integration

The package is an independently consumable unit. Callers reference its documented
interface through a versioned dependency and own application-specific composition
and integration.

## License

Apache-2.0. Copyright 2026 HAT Inc. See [LICENSE](LICENSE) and [NOTICE](NOTICE). External dependencies retain their respective licenses.
