use crate::safety::{identifier, opaque_ref, secret_ref};

#[test]
fn boundary_distinguishes_ids_references_and_secret_handles() {
    assert!(identifier("id", "device-fleet").is_ok());
    assert!(identifier("id", "Device Fleet").is_err());
    assert!(opaque_ref("ref", "fleet:managed").is_ok());
    assert!(opaque_ref("ref", "fleet managed").is_err());
    assert!(secret_ref("secret://apple/fleet/observer").is_ok());
    assert!(secret_ref("embedded-token").is_err());
}
