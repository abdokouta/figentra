# YAML Standard

Hand-authored YAML begins with a structured documentation header containing
`@file`, `@description`, `@ownership`, `@security`, and `@source-of-truth`.

Every meaningful section has comments explaining operational intent.

No secrets are allowed.

`cloud.yaml` is the deployable manifest contract. Generated YAML identifies its
generator and is not manually edited.
