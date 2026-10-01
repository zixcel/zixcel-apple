use std::collections::BTreeMap;

use serde::Serialize;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

use crate::{CONNECTOR, ConnectorConfig, ConnectorError, PLAN_SCHEMA, PROVIDER};

/// Explicit step for a separately authorized host executor.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PlanStep {
    pub sequence: u32,
    pub action: &'static str,
    pub target: String,
    pub effect: &'static str,
    pub network_required: bool,
}

/// Deterministic proposal; constructing it performs no external action.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ConnectorPlan {
    pub schema: &'static str,
    pub plan_id: String,
    pub request_id: String,
    pub provider: &'static str,
    pub connector: &'static str,
    pub mode: &'static str,
    pub steps: Vec<PlanStep>,
    pub secret_refs: Vec<String>,
    pub extensions: BTreeMap<String, Value>,
}

#[derive(Serialize)]
struct PlanSeed<'a> {
    request_id: &'a str,
    provider: &'static str,
    connector: &'static str,
    steps: &'a [PlanStep],
    secret_refs: &'a [String],
    extensions: &'a BTreeMap<String, Value>,
}

/// Builds a stable plan from normalized service selection.
///
/// # Errors
///
/// Returns a configuration or serialization boundary violation.
pub fn build_plan(config: &ConnectorConfig) -> Result<ConnectorPlan, ConnectorError> {
    config.validate()?;
    let config = config.normalized();
    let request_id = format!("request-{}", config.config_id);
    let mut steps = vec![PlanStep {
        sequence: 1,
        action: "validate-config",
        target: config.config_id.clone(),
        effect: "none",
        network_required: false,
    }];
    for (index, service) in config.services.iter().enumerate() {
        steps.push(PlanStep {
            sequence: u32::try_from(index + 2)
                .map_err(|_| ConnectorError::new("services", "too many services"))?,
            action: "prepare-observation",
            target: format!("{}:{service}", config.account_ref),
            effect: "observe",
            network_required: true,
        });
    }
    let secret_refs = vec![config.secret_ref.clone()];
    let extensions = BTreeMap::from([
        ("environment".to_owned(), json!(config.environment)),
        ("services".to_owned(), json!(config.services)),
        (
            "safety".to_owned(),
            json!({
                "planning_only": true,
                "network_calls_performed": false,
                "credentials_resolved": false
            }),
        ),
    ]);
    let plan_id = stable_id(&PlanSeed {
        request_id: &request_id,
        provider: PROVIDER,
        connector: CONNECTOR,
        steps: &steps,
        secret_refs: &secret_refs,
        extensions: &extensions,
    })?;
    Ok(ConnectorPlan {
        schema: PLAN_SCHEMA,
        plan_id,
        request_id,
        provider: PROVIDER,
        connector: CONNECTOR,
        mode: "propose",
        steps,
        secret_refs,
        extensions,
    })
}

fn stable_id(seed: &PlanSeed<'_>) -> Result<String, ConnectorError> {
    let bytes = serde_json::to_vec(seed)
        .map_err(|_| ConnectorError::new("plan", "could not serialize canonical plan"))?;
    let digest = Sha256::digest(bytes);
    Ok(format!("plan-{PROVIDER}-{}", hex(&digest)[..16].to_owned()))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}
