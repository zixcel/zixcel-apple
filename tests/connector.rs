use zixcel_apple::{build_plan, doctor, parse_config};

const CONFIG_A: &str = r#"
schema = "zixcel://apple/config/v1"
config_id = "personal-observer"
account_ref = "account:personal"
secret_ref = "secret://apple/icloud/observer"
environment = "production"
services = ["contacts", "calendar", "icloud-drive"]
"#;

const CONFIG_B: &str = r#"
schema = "zixcel://apple/config/v1"
config_id = "personal-observer"
account_ref = "account:personal"
secret_ref = "secret://apple/icloud/observer"
environment = "production"
services = ["icloud-drive", "contacts", "calendar"]
"#;

#[test]
fn equivalent_configs_create_identical_plans() {
    let first = build_plan(&parse_config(CONFIG_A).expect("config A")).expect("plan A");
    let second = build_plan(&parse_config(CONFIG_B).expect("config B")).expect("plan B");
    assert_eq!(first, second);
}

#[test]
fn closed_config_rejects_credentials_and_unknown_fields() {
    assert!(parse_config(&format!("{CONFIG_A}\npassword = \"no\"\n")).is_err());
    assert!(parse_config(&format!("{CONFIG_A}\nfuture_field = true\n")).is_err());
}

#[test]
fn input_and_external_actions_are_bounded() {
    assert!(parse_config(&" ".repeat(1_048_577)).is_err());
    let report = doctor();
    assert!(!report.network_client_linked);
    assert!(!report.secret_resolution_enabled);
    assert!(!report.execution_enabled);
}
