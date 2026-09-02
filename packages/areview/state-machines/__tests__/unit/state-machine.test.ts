import { describe, expect, it } from 'vitest';
import { InvalidStateTransitionError, StateMachine } from '../../src/index';

describe('StateMachine', () => {
  it('guards and executes transitions', async () => {
    const changed: string[] = [];
    const machine = new StateMachine({
      name: 'order', initial: 'draft', transitions: [
        { from: 'draft', to: 'submitted', guard: ({ payload }) => payload === true, execute: () => changed.push('submitted') },
        { from: 'submitted', to: 'approved' },
      ],
    }, (event) => changed.push(`${event.from}->${event.to}`));
    expect(await machine.canTransition('draft', 'submitted', false)).toBe(false);
    expect(await machine.canTransition('draft', 'submitted', true)).toBe(true);
    await machine.transition('draft', 'submitted', true);
    expect(changed).toEqual(['submitted', 'draft->submitted']);
  });
  it('rejects invalid transitions', async () => {
    const machine = new StateMachine({ name: 'order', initial: 'draft', transitions: [{ from: 'draft', to: 'submitted' }] });
    await expect(machine.transition('submitted', 'approved', undefined)).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });
});
