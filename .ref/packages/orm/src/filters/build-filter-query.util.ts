/**
 * @file build-filter-query.util.ts
 * @description Converts GraphQL filter input objects into MikroORM-compatible
 * query filter objects.
 */

/**
 * Converts a filter input object into a MikroORM where clause.
 * Maps filter operators (eq, ne, gt, gte, lt, lte, contains, in, nin, etc.)
 * to their MikroORM equivalents.
 *
 * @param filter - The GraphQL filter input object (e.g., { name: { contains: 'foo' } }).
 * @returns A MikroORM-compatible filter/where object.
 *
 * @example
 * const where = buildFilterQuery({ name: { contains: 'acme' }, isActive: { eq: true } });
 * // { name: { $like: '%acme%' }, isActive: true }
 */
export function buildFilterQuery(filter: Record<string, any> | undefined): Record<string, any> {
  if (filter == null) return {};

  const where: Record<string, any> = {};

  for (const [field, ops] of Object.entries(filter)) {
    if (ops === null || ops === undefined) continue;

    // Array values → $in operator (e.g., status: [ACTIVE, INACTIVE])
    if (Array.isArray(ops)) {
      where[field] = { $in: ops };
      continue;
    }

    if (typeof ops !== 'object' || ops instanceof Date) {
      where[field] = ops;
      continue;
    }

    const conditions: Record<string, any> = {};

    for (const [op, value] of Object.entries(ops)) {
      if (value === null || value === undefined) continue;

      switch (op) {
        case 'eq':
          conditions['$eq'] = value;
          break;
        case 'ne':
          conditions['$ne'] = value;
          break;
        case 'gt':
          conditions['$gt'] = value;
          break;
        case 'gte':
          conditions['$gte'] = value;
          break;
        case 'lt':
          conditions['$lt'] = value;
          break;
        case 'lte':
          conditions['$lte'] = value;
          break;
        case 'contains':
          conditions['$like'] = `%${value}%`;
          break;
        case 'startsWith':
          conditions['$like'] = `${value}%`;
          break;
        case 'endsWith':
          conditions['$like'] = `%${value}`;
          break;
        case 'in':
          conditions['$in'] = value;
          break;
        case 'nin':
          conditions['$nin'] = value;
          break;
        default:
          conditions[`$${op}`] = value;
      }
    }

    // Simplify single $eq to direct value
    if (Object.keys(conditions).length === 1 && '$eq' in conditions) {
      where[field] = conditions['$eq'];
    } else {
      where[field] = conditions;
    }
  }

  return where;
}
