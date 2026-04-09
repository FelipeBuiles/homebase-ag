export interface AgentInput {
  entityType: string;
  entityId: string;
  context?: Record<string, unknown>;
}

export interface FieldChange {
  field: string;
  before: string | null;
  after: string | null;
}

export type JsonPatch = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
};

export interface ProposalInput {
  agentId: string;
  entityType: string;
  entityId: string;
  patch: JsonPatch[];
  snapshot: Record<string, unknown>;
  rationale: string;
  confidence: number; // 0.0 - 1.0
  changes: FieldChange[];
}
