'use client';

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveProposal, rejectProposal } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ proposalId }: { proposalId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleApprove = async () => {
        setLoading(true);
        await approveProposal(proposalId);
        setLoading(false);
        router.refresh();
    };

    const handleReject = async () => {
        setLoading(true);
        await rejectProposal(proposalId);
        setLoading(false);
        router.refresh();
    };

    return (
        <div className="flex justify-end gap-3">
            <Button 
                variant="outline" 
                onClick={handleReject} 
                disabled={loading}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
                <X size={16} /> Reject
            </Button>
            <Button 
                onClick={handleApprove} 
                disabled={loading}
                className="gap-2"
            >
                <Check size={16} /> Approve
            </Button>
        </div>
    );
}
