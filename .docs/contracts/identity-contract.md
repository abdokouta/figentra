# Identity Contract

## Goal

Stable internal contract independent of Supabase Auth implementation.

```typescript
type Identity = {
  id: string;
  provider: string;
  providerSubject: string;
  status: "active" | "disabled" | "deleted";
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    locale?: string;
    timezone?: string;
  };
};
```

This is conceptual and must be finalized before implementation.
