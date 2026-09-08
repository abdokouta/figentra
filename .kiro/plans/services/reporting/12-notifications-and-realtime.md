# Reporting — Notifications and Realtime

Scheduled report delivery is delegated to Notifications after Reporting generates the artifact/request. Reporting does not call email/SMS/push providers. Realtime may notify clients that a report job completed; clients fetch the authoritative result/artifact through the Reporting API.