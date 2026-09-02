export type StateValue = string | number;

export interface TransitionContext<TState extends StateValue = string, TPayload = unknown> { readonly from: TState; readonly to: TState; readonly payload: TPayload; }
export interface StateTransition<TState extends StateValue = string, TPayload = unknown> { readonly from: TState | readonly TState[]; readonly to: TState; readonly guard?: (context: TransitionContext<TState, TPayload>) => boolean | Promise<boolean>; readonly execute?: (context: TransitionContext<TState, TPayload>) => void | Promise<void>; }
export interface StateMachineDefinition<TState extends StateValue = string, TPayload = unknown> { readonly name: string; readonly initial: TState; readonly states?: readonly TState[]; readonly transitions: readonly StateTransition<TState, TPayload>[]; readonly ignoreSameState?: boolean; }
export interface StateChangedEvent<TState extends StateValue = string, TPayload = unknown> extends TransitionContext<TState, TPayload> { readonly machine: string; }
export type StateChangedHandler<TState extends StateValue = string, TPayload = unknown> = (event: StateChangedEvent<TState, TPayload>) => void | Promise<void>;

export class InvalidStateTransitionError<TState extends StateValue = string> extends Error {
  constructor(public readonly machine: string, public readonly from: TState, public readonly to: TState) { super(`Transition not allowed in ${machine}: ${String(from)} -> ${String(to)}`); this.name = 'InvalidStateTransitionError'; }
}

export class StateMachine<TState extends StateValue = string, TPayload = unknown> {
  constructor(private readonly definition: StateMachineDefinition<TState, TPayload>, private readonly onChanged?: StateChangedHandler<TState, TPayload>) {
    if (!definition.name.trim()) throw new Error('State machine name cannot be empty.');
    if (!definition.transitions.length) throw new Error(`State machine ${definition.name} must define at least one transition.`);
  }
  get name(): string { return this.definition.name; }
  get initial(): TState { return this.definition.initial; }
  async canTransition(from: TState, to: TState, payload: TPayload): Promise<boolean> { return Boolean(await this.find(from, to, payload)); }
  async transitionableStates(from: TState, payload: TPayload): Promise<TState[]> { const states: TState[] = []; for (const transition of this.definition.transitions) if (this.matches(transition.from, from) && await this.guard(transition, from, payload) && !states.includes(transition.to)) states.push(transition.to); return states; }
  async transition(from: TState, to: TState, payload: TPayload): Promise<TState> { if (from === to && this.definition.ignoreSameState) return to; const transition = await this.find(from, to, payload); if (!transition) throw new InvalidStateTransitionError(this.definition.name, from, to); const context = { from, to, payload }; if (transition.execute) await transition.execute(context); if (this.onChanged) await this.onChanged({ machine: this.definition.name, ...context }); return to; }
  private async find(from: TState, to: TState, payload: TPayload): Promise<StateTransition<TState, TPayload> | undefined> { for (const transition of this.definition.transitions) if (transition.to === to && this.matches(transition.from, from) && await this.guard(transition, from, payload)) return transition; return undefined; }
  private async guard(transition: StateTransition<TState, TPayload>, from: TState, payload: TPayload): Promise<boolean> { return transition.guard ? transition.guard({ from, to: transition.to, payload }) : true; }
  private matches(from: TState | readonly TState[], value: TState): boolean { return Array.isArray(from) ? from.includes(value) : from === value; }
}
