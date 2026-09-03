/**
 * @file state-machine.service.ts
 * @module @stackra/nestjs-orm/state-machine
 * @description Service for managing entity state transitions with validation.
 */

import { IInjectable, Inject, Optional } from '@nestjs/common';
import { EVENT_EMITTER } from '@stackra/contracts';
import type { IEventEmitter } from '@stackra/contracts';
import type { EntityManager } from '@mikro-orm/core';
import type { IStateConfig, ITransitionResult, IStateTransition } from './state-machine.interfaces';

@IInjectable()
export class StateMachineService {
  constructor(@Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter) {}

  /**
   * Attempt to transition an entity's state field to a new value.
   *
   * Validates the transition against the state config's allowed transitions.
   * If valid, updates the entity field and emits a state transition event.
   *
   * @param entity - The entity to transition
   * @param field - The state field name (e.g., 'status')
   * @param newState - The target state value
   * @param em - EntityManager for flushing changes
   * @param metadata - Optional transition metadata (reason, etc.)
   * @returns Transition result with success status and the entity
   */
  public async transitionTo(
    entity: any,
    field: string,
    newState: string,
    em: EntityManager,
    metadata?: Record<string, unknown>
  ): Promise<ITransitionResult> {
    const currentState = entity[field];

    // Look up state config from entity metadata
    const stateConfig = this.getStateConfig(entity, field);
    if (!stateConfig) {
      return { success: false, entity, error: `No state machine configured for field "${field}"` };
    }

    // Validate transition
    const allowedTargets = stateConfig.transitions[currentState];
    if (!allowedTargets) {
      return {
        success: false,
        entity,
        error: `State "${currentState}" has no configured transitions (terminal state)`,
      };
    }

    if (!allowedTargets.includes(newState)) {
      return {
        success: false,
        entity,
        error: `Transition from "${currentState}" to "${newState}" is not allowed. Allowed: [${allowedTargets.join(', ')}]`,
      };
    }

    // Apply transition
    const previousState = currentState;
    entity[field] = newState;
    await em.flush();

    // Build transition record
    const transition: IStateTransition = {
      entity,
      field,
      from: previousState,
      to: newState,
      metadata,
    };

    // Emit event
    this.emit(`state.${stateConfig.name}.transitioned`, {
      entityId: entity.id,
      field,
      from: previousState,
      to: newState,
      metadata,
    });

    return { success: true, entity, transition };
  }

  /**
   * Check if a transition is valid without executing it.
   *
   * @param entity - The entity to check
   * @param field - The state field name
   * @param newState - The target state
   * @returns Whether the transition would be allowed
   */
  public canTransitionTo(entity: any, field: string, newState: string): boolean {
    const stateConfig = this.getStateConfig(entity, field);
    if (!stateConfig) return false;

    const currentState = entity[field];
    const allowedTargets = stateConfig.transitions[currentState];
    if (!allowedTargets) return false;

    return allowedTargets.includes(newState);
  }

  /**
   * Get all valid target states from the current state.
   *
   * @param entity - The entity to inspect
   * @param field - The state field name
   * @returns Array of valid target states, or empty if none
   */
  public getAvailableTransitions(entity: any, field: string): string[] {
    const stateConfig = this.getStateConfig(entity, field);
    if (!stateConfig) return [];

    const currentState = entity[field];
    return stateConfig.transitions[currentState] ?? [];
  }

  // ── Private ──────────────────────────────────────────────────────────

  private getStateConfig(entity: any, field: string): IStateConfig | null {
    // The @Stateable() decorator stores state config in entity metadata
    const configs: IStateConfig[] =
      Reflect.getMetadata?.('stackra:orm:state-configs', entity.constructor) ?? [];
    return configs.find((c) => c.field === field) ?? null;
  }

  private emit(event: string, data: unknown): void {
    if (!this.events) return;
    this.events.emit(event, data);
  }
}
