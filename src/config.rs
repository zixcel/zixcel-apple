use serde::{Deserialize, Serialize};

use crate::safety::{identifier, opaque_ref, reject_forbidden_keys, secret_ref};
use crate::{CONFIG_SCHEMA, ConnectorError};

const SERVICES: &[&str] = &["calendar", "contacts", "icloud-drive"];

/// Apple environment selected for a future authorized executor.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AppleEnvironment {
    Production,
    Sandbox,
}

/// Closed, credential-free Apple planner configuration.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConnectorConfig {
    pub schema: String,
    pub config_id: String,
    pub account_ref: String,
    pub secret_ref: String,
    pub environment: AppleEnvironment,
    pub services: Vec<String>,
}

impl ConnectorConfig {
    /// Checks schema identity, references, and the bounded service allowlist.
    ///
    /// # Errors
    ///
    /// Returns the first invalid field.
    pub fn validate(&self) -> Result<(), ConnectorError> {
        if self.schema != CONFIG_SCHEMA {
            return Err(ConnectorError::new(
                "schema",
                "expected zixcel://apple/config/v1",
            ));
        }
        identifier("config_id", &self.config_id)?;
        opaque_ref("account_ref", &self.account_ref)?;
        secret_ref(&self.secret_ref)?;
        if self.services.is_empty() || self.services.len() > SERVICES.len() {
            return Err(ConnectorError::new(
                "services",
                "must contain a bounded, non-empty service selection",
            ));
        }
        if self
            .services
            .iter()
            .any(|value| !SERVICES.contains(&value.as_str()))
        {
            return Err(ConnectorError::new(
                "services",
                "contains an unsupported service",
            ));
        }
        Ok(())
    }

    pub(crate) fn normalized(&self) -> Self {
        let mut normalized = self.clone();
        normalized.services.sort();
        normalized.services.dedup();
        normalized
    }
}

/// Parses bounded TOML after recursively rejecting credential-shaped keys.
///
/// # Errors
///
/// Rejects oversized, malformed, open, or semantically invalid documents.
pub fn parse_config(source: &str) -> Result<ConnectorConfig, ConnectorError> {
    reject_forbidden_keys(source)?;
    let config: ConnectorConfig = toml::from_str(source).map_err(|_| {
        ConnectorError::new(
            "config",
            "invalid TOML or fields do not match the Apple v1 schema",
        )
    })?;
    config.validate()?;
    Ok(config)
}
