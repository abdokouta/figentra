export type SearchStrategy = 'fulltext' | 'autocomplete' | 'exact' | 'hybrid';

export interface SearchResourceDefinition {
  resourceType: string;
  indexAlias: string;
  titleFields: string[];
  searchFields: string[];
  exactFields: string[];
  autocompleteFields: string[];
  strategy: SearchStrategy;
  enabled: boolean;
}

/** Logical resource registry. Physical index names remain an infrastructure concern. */
export const SEARCH_RESOURCES: SearchResourceDefinition[] = [
  { resourceType: 'customer', indexAlias: 'search-customers', titleFields: ['name'], searchFields: ['name', 'code', 'email', 'description'], exactFields: ['id', 'code'], autocompleteFields: ['name'], strategy: 'hybrid', enabled: true },
  { resourceType: 'order', indexAlias: 'search-orders', titleFields: ['order_number'], searchFields: ['order_number', 'customer_name', 'description'], exactFields: ['id', 'order_number'], autocompleteFields: ['order_number', 'customer_name'], strategy: 'hybrid', enabled: true },
  { resourceType: 'product', indexAlias: 'search-products', titleFields: ['name'], searchFields: ['name', 'sku', 'description'], exactFields: ['id', 'sku'], autocompleteFields: ['name', 'sku'], strategy: 'hybrid', enabled: true },
  { resourceType: 'project', indexAlias: 'search-projects', titleFields: ['name'], searchFields: ['name', 'code', 'description'], exactFields: ['id', 'code'], autocompleteFields: ['name', 'code'], strategy: 'hybrid', enabled: true },
  { resourceType: 'task', indexAlias: 'search-tasks', titleFields: ['title'], searchFields: ['title', 'description', 'code'], exactFields: ['id', 'code'], autocompleteFields: ['title', 'code'], strategy: 'hybrid', enabled: true },
];
