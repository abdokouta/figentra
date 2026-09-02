# Transactional Outbox

Domain mutation and outbox insert are one transaction. Each service owns its outbox. The relay publishes committed records and records delivery state.
