# Security

Production NATS uses TLS and per-service credentials with least-privilege
publish/subscribe ACLs. Validate schemas and payload size. Never put secrets in
events.
