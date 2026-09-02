# IAM Contract

## Authorization

```typescript
type AuthorizationRequest = {
  principalId: string;
  action: string;
  resource?: {
    type: string;
    id?: string;
  };
  tenantId?: string;
  scope?: {
    type: string;
    id: string;
  };
  context?: Record<string, unknown>;
};

type AuthorizationDecision = {
  decision: "allow" | "deny" | "require_approval";
  decisionId?: string;
  policyVersion?: string;
  obligations?: unknown[];
};
```

Conceptual only until IAM design is approved.
