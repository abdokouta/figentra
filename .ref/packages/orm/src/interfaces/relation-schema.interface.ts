/**
 * @file relation-schema.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IRelationSchema interface.
 */

/**
 * Relation to another resource.
 */
export interface IRelationSchema {
  /** Relation name (property key on the entity). */
  name: string;
  /** Relation type. */
  type: 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
  /** Target resource name. */
  resource: string;
  /** Foreign key field. */
  foreignKey: string;
  /** Pivot table name (for manyToMany). */
  pivotTable?: string;
}
