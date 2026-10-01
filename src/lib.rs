#![forbid(unsafe_code)]
#![doc = "Planning-only Apple connector with no network or secret resolver."]

mod config;
mod error;
mod plan;
mod reports;
mod safety;
#[cfg(test)]
mod unit_tests;

pub use config::{AppleEnvironment, ConnectorConfig, parse_config};
pub use error::ConnectorError;
pub use plan::{ConnectorPlan, PlanStep, build_plan};
pub use reports::{
    CapabilityReport, DoctorReport, ValidationReport, capabilities, doctor, validation_report,
};

/// Stable connector identifier.
pub const CONNECTOR: &str = "zixcel-apple";
/// Provider identifier used by the shared wire contract.
pub const PROVIDER: &str = "apple";
/// Closed TOML configuration schema.
pub const CONFIG_SCHEMA: &str = "zixcel://apple/config/v1";
/// Provider-neutral plan schema.
pub const PLAN_SCHEMA: &str = "zixcel://contracts/connector-plan/v1";
