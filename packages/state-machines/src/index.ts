export type StateValue = string | number;

export interface TransitionContext<TState extends StateValue = string, TPayload = unknown> { from:TState; to:TState; payload:TPayload; }
export interface StateTransition<TState extends StateValue = string, TPayload = unknown> { from:TState|readonly TState[]; to:TState; guard?:(context:TransitionContext<TState,TPayload>)=>boolean|Promise<boolean>; execute?:(context:TransitionContext<TState,TPayload>)=>void|Promise<void>; }
export interface StateMachineDefinition<TState extends StateValue = string, TPayload = unknown> { name:string; initial:TState; transitions:readonly StateTransition<TState,TPayload>[]; ignoreSameState?:boolean; }
export interface StateChangedEvent<TState extends StateValue = string, TPayload = unknown> { name:string; from:TState; to:TState; payload:TPayload; }

export class InvalidStateTransitionError<TState extends StateValue = string> extends Error { constructor(public readonly machine:string, public readonly from:TState, public readonly to:TState){ super(`Transition not allowed in ${machine}: ${String(from)} -> ${String(to)}`); this.name='InvalidStateTransitionError'; } }

export class StateMachine<TState extends StateValue = string, TPayload = unknown> {
  constructor(private readonly definition:StateMachineDefinition<TState,TPayload>, private readonly onChanged?:(event:StateChangedEvent<TState,TPayload>)=>void|Promise<void>) { if(!definition.name.trim()) throw new Error('State machine name cannot be empty.'); }
  canTransition(from:TState,to:TState,payload:TPayload):Promise<boolean> { return this.find(from,to,payload).then(Boolean); }
  transitionableStates(from:TState,payload:TPayload):Promise<TState[]> { return Promise.all(this.definition.transitions.filter(t=>this.matches(t.from,from)).map(async t=>await this.guard(t,payload,from)?t.to:null)).then(values=>values.filter((v):v is TState=>v!==null)); }
  async transition(from:TState,to:TState,payload:TPayload):Promise<TState>{ if(from===to&&this.definition.ignoreSameState) return to; const t=await this.find(from,to,payload); if(!t) throw new InvalidStateTransitionError(this.definition.name,from,to); const context={from,to,payload}; if(t.execute) await t.execute(context); if(this.onChanged) await this.onChanged({name:this.definition.name,...context}); return to; }
  private async find(from:TState,to:TState,payload:TPayload):Promise<StateTransition<TState,TPayload>|undefined>{ for(const t of this.definition.transitions){ if(this.matches(t.from,from)&&t.to===to&&await this.guard(t,payload,from)) return t; } return undefined; }
  private async guard(t:StateTransition<TState,TPayload>,payload:TPayload,from:TState):Promise<boolean>{ return t.guard ? t.guard({from,to:t.to,payload}) : true; }
  private matches(from:TState|readonly TState[],value:TState):boolean{return Array.isArray(from)?from.includes(value):from===value;}
}
