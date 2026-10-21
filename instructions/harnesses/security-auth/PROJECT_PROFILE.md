---
profile_version: "1.0"
project_type: "security-auth"
status: "bootstrap_required"
project_name: "UNSET"
source_of_truth: "repository"
primary_harness: "instructions/harnesses/SECURITY_AUTH_HARNESS.md"
additional_harnesses: []

execution:
  task_source: "WORK_ORDER.md"
  state_file: "PROJECT_STATE.md"
  state_tracking: true
  default_autonomy: "restricted"

identity:
  provider: "DETECT"
  user_store: "DETECT"
  authentication_methods: "DETECT"
  account_recovery: "DETECT"

session:
  model: "DETECT"
  storage: "DETECT"
  expiration: "DETECT"
  revocation: "DETECT"

authorization:
  policy_authority: "DETECT"
  model: "DETECT"
  roles: "DETECT"
  protected_resources: "DETECT"

security:
  secret_storage: "DETECT"
  audit_log: "DETECT"
  sensitive_data_classes: "DETECT"
  threat_model: "DETECT"
  compliance_targets: "UNSET"

commands:
  lint: "DETECT"
  typecheck: "DETECT"
  test: "DETECT"
  security_scan: "DETECT"
  dependency_scan: "DETECT"

test_context:
  authorized_targets: []
  test_environment: "DETECT"
  test_identities: "DETECT"

permissions:
  edit_repository: true
  run_local_non_destructive_tests: true
  run_shared_environment_tests: false
  test_external_targets: false
  access_production_user_data: false
  create_privileged_users: false
  change_production_policies: false
  rotate_or_revoke_secrets: false
  destructive_security_testing: false
  install_dependencies: false
  commit: false
  push: false
  deploy: false

known_constraints: []
---

# Security and Authentication Project Profile

Replace `DETECT` only with verified facts. Do not store credentials, tokens, personal data or secret values here.

## Trust boundaries

- `UNVERIFIED`

## Role and permission notes

- `UNVERIFIED`

## Protected operations

- `UNVERIFIED`
