export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'failed';

export interface JsonPatchOp {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    path: string;
    value?: unknown;
    from?: string;
}

export interface ProposalChangeSnapshot {
    [key: string]: unknown;
}

// Extend Prisma types or define UI-specific types
export interface UIProposal {
    id: string;
    agentId: string;
    status: ProposalStatus;
    summary: string;
    createdAt: Date;
    changes: UIProposalChange[];
}

export interface UIProposalChange {
    id: string;
    entityType: string;
    entityId: string;
    confidence: number;
    rationale: string;
    diff: JsonPatchOp[];
    before: ProposalChangeSnapshot;
    after: ProposalChangeSnapshot;
}
