# @stackra/zones

Zone / slot extensibility runtime for the Stackra framework. Provides a DI-owned
`ZoneRegistry`, a pure `resolveZoneOrder(...)` ordering algorithm, and React +
React Native bindings for `<Zone>`, `<FormFieldZone>`, and `<TableColumnZone>`.

## Install

Workspace consumers:

```jsonc
// package.json
{
  "peerDependencies": {
    "@stackra/zones": "workspace:^",
  },
}
```

External consumers:

```bash
pnpm add @stackra/zones
```

## Usage

### General `<Zone>`

Host page declares a zone with intrinsic children; other modules contribute into
it through `<HostModule>.forFeature({ zones: [...] })`.

```tsx
// packages/frontend/user/src/react/pages/users-list/users-list.page.tsx
import { Zone } from "@stackra/zones/react";

export function UsersListPage() {
  return (
    <div>
      <Zone id="users.list.header">
        <SearchInput id="search" />
        <ExportButton id="export" />
      </Zone>
      <UsersTable />
    </div>
  );
}
```

### Form-field zone

Host page owns the form; `<FormFieldZone>` produces the ordered field descriptor
list; the host renders the fields any way it wants.

```tsx
// packages/frontend/user/src/react/pages/user-create/user-create.page.tsx
import { FormFieldZone } from "@stackra/zones/react";

export function UserCreatePage() {
  const intrinsic = [
    { name: "email", label: "Email", kind: "email", required: true },
    { name: "name", label: "Name", kind: "text", required: true },
  ];

  return (
    <FormFieldZone id="user.create.form" intrinsicFields={intrinsic}>
      {(fields) => (
        <Form>
          {fields.map((f) => (
            <FieldRenderer key={f.name} descriptor={f} />
          ))}
        </Form>
      )}
    </FormFieldZone>
  );
}
```

### Contribute a React component into a zone

```ts
// packages/frontend/audit/src/react/web-audit.module.ts
import { UserModule } from "@stackra/user";

@Module({})
export class WebAuditModule {
  public static forRoot(): DynamicModule {
    return {
      module: WebAuditModule,
      imports: [
        UserModule.forFeature({
          zones: [
            {
              id: "audit-users-header-badge",
              zone: "users.list.header",
              kind: "react",
              position: "end",
              when: (ctx) => ctx.permissions.includes("audit.view"),
              component: AuditBadge,
            },
          ],
        }),
      ],
    };
  }
}
```

### SDUI Zone node

Schemas reference `type: "Zone"` and place intrinsic children in the `intrinsic`
slot. Contributions come from the DI-owned `ZoneRegistry`.

```json
{
  "id": "landing-top-zone",
  "type": "Zone",
  "props": { "zoneId": "landing.top" },
  "slots": {
    "intrinsic": [
      { "id": "hero", "type": "Hero", "props": { "headline": "Welcome" } }
    ]
  }
}
```

## Subpaths

- `@stackra/zones` — core: `ZonesModule`, `ZoneRegistry`,
  `resolveZoneOrder(...)`, cross-platform types.
- `@stackra/zones/react` — web bindings: `WebZonesModule`, `<Zone>`,
  `<FormFieldZone>`, `<TableColumnZone>`, `useZone`, `useZoneContext`.
- `@stackra/zones/native` — RN counterparts, same public API.
- `@stackra/zones/testing` — `MockZoneRegistry`, `TestZonesProvider`, canned
  contributions.

## Cross-references

- `.kiro/specs/zones/design.md` — the design of record.
- `.kiro/specs/zones/tasks.md` — the implementation task list.
- `.kiro/steering/module-lifecycle.md` §"`forFeature` — always via an
  `@Injectable()` registrar class" — ADR-0052 canonical shape.
- `.kiro/steering/subpath-layering.md` — subpath dependency direction.
- `@stackra/contracts/interfaces/zones` — shared contract vocabulary.
- `@stackra/sdui` — SDUI Zone component + section-style resolver.
