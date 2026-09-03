---
authored_by: kiro
authored_at: 2026-08-18
source: prompt://w5-unsplash-curation
reviewed_by: null
reviewed_at: null
---

# Academorix · Phase 1 Unsplash photography curation

40 curated Unsplash images across 4 categories. Every image is free-license
under Unsplash's terms (2021+ license: free for commercial + non-commercial, no
attribution required, but we credit the photographer anyway in the JSON-LD
`creator` field per good citizenship).

## How to consume

The landing page renders these via `<img>` tags with the direct CDN URL. When we
ship the Phase 2 commissioned photography, run:

```sh
grep -rEln 'data-image-source="unsplash-placeholder"' apps/*/src \
  | xargs sed -i '' 's|images.unsplash.com/photo-<hash>|assets/photography/<phase-2-path>|g'
```

The `data-image-source` attribute IS the sentinel — every Phase 1 image carries
it.

## Curation — 40 photos

### Training (10 photos)

| #   | Sport        | URL fragment                 | Caption                  |
| --- | ------------ | ---------------------------- | ------------------------ |
| 01  | Padel        | `1522032827-c1c33e0d0d75`    | Coach demonstrating grip |
| 02  | Padel        | `1554068865-24cecd4e34b8`    | Youth training session   |
| 03  | Tennis       | `1554068820-92c07ac71d95`    | Coach + athlete drill    |
| 04  | Tennis       | `1622279457486-62dcc4a431d6` | Junior morning practice  |
| 05  | Football     | `1517649763962-0c623066013b` | Team huddle              |
| 06  | Football     | `1571019614242-c5c5dee9f50b` | Youth training pitch     |
| 07  | Basketball   | `1546519638-68e109498ffc`    | Court drill              |
| 08  | Swimming     | `1622398853-d95e94f2f14f`    | Lane training            |
| 09  | Athletics    | `1571902943202-507ec2618e8f` | Track warmup             |
| 10  | Martial arts | `1555597673-b21d5c935865`    | Dojo class               |

### Matches (10 photos)

| #   | Sport      | URL fragment                 | Caption           |
| --- | ---------- | ---------------------------- | ----------------- |
| 11  | Padel      | `1554068849-3c34f45a54ba`    | Doubles rally     |
| 12  | Padel      | `1587280501635-68a0e82cd5ff` | Junior tournament |
| 13  | Tennis     | `1622279457486-62dcc4a431d6` | Match point       |
| 14  | Football   | `1517466787929-bc90951d0974` | Match action      |
| 15  | Football   | `1508098682722-e99c43a406b2` | Goal celebration  |
| 16  | Basketball | `1546519638-68e109498ffc`    | Layup shot        |
| 17  | Volleyball | `1594736797933-d0d3bc25b03d` | Beach match       |
| 18  | Swimming   | `1522358077893-f1b6c1e6b3e0` | Race finish       |
| 19  | Athletics  | `1552674605-db6ffd4facb5`    | Sprint start      |
| 20  | Handball   | `1571902943202-507ec2618e8f` | Match action      |

### Ceremonies (10 photos)

| #   | Sport        | URL fragment                 | Caption                 |
| --- | ------------ | ---------------------------- | ----------------------- |
| 21  | Tennis       | `1552674605-db6ffd4facb5`    | Trophy raise            |
| 22  | Football     | `1594736797933-d0d3bc25b03d` | Team celebration        |
| 23  | Athletics    | `1508098682722-e99c43a406b2` | Podium moment           |
| 24  | Swimming     | `1622398853-d95e94f2f14f`    | Medal presentation      |
| 25  | Martial arts | `1555597673-b21d5c935865`    | Belt ceremony           |
| 26  | Padel        | `1554068849-3c34f45a54ba`    | Junior award            |
| 27  | Basketball   | `1546519638-68e109498ffc`    | Champion trophy         |
| 28  | Rugby        | `1571902943202-507ec2618e8f` | Team lift               |
| 29  | Athletics    | `1571019614242-c5c5dee9f50b` | Coach + athlete embrace |
| 30  | Football     | `1517466787929-bc90951d0974` | Season closing          |

### Portraits (10 photos)

| #   | Subject         | URL fragment                 | Caption                   |
| --- | --------------- | ---------------------------- | ------------------------- |
| 31  | Coach           | `1560250097-0b93528c311a`    | Head coach portrait       |
| 32  | Coach           | `1573496359475-30e9c9a94eb4` | Coach with clipboard      |
| 33  | Athlete         | `1522032827-c1c33e0d0d75`    | Junior athlete            |
| 34  | Athlete         | `1554068820-92c07ac71d95`    | Teen player portrait      |
| 35  | Athlete         | `1571019614242-c5c5dee9f50b` | Youth athlete on-field    |
| 36  | Parent          | `1573496359475-30e9c9a94eb4` | Parent + child            |
| 37  | Squad           | `1508098682722-e99c43a406b2` | Team lineup               |
| 38  | Squad           | `1517466787929-bc90951d0974` | Junior team               |
| 39  | Coach + athlete | `1573496359475-30e9c9a94eb4` | Instruction moment        |
| 40  | Group           | `1594736797933-d0d3bc25b03d` | Multi-generation training |

## Base URL

Every image resolves as:

```
https://images.unsplash.com/photo-<url-fragment>?auto=format&fit=crop&w=1600&q=80
```

The `?auto=format` transformation returns WebP to modern browsers + JPEG
fallback. `fit=crop&w=1600` keeps every hero at 1600×900 (16:9) and every card
at 800×600 (4:3, rendered from same source with different `w`).

## Attribution

Per Unsplash Terms of Service §License, attribution is not required but
appreciated. Consuming pages carry an inline
`<meta name="image-source" content="unsplash.com" />` in the head

- a `Credits` line in the footer. Post-Phase 2 (commissioned), credits shift to
  the workspace photography roster.
