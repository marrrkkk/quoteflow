"use client";

import { startTransition, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CopyWorkspaceInviteLinkButtonProps = {
  workspaceId: string;
  copyInviteLinkAction: (
    inviteId: string,
    workspaceId: string,
  ) => Promise<{ error?: string; inviteUrl?: string }>;
  inviteId: string;
};

export function CopyWorkspaceInviteLinkButton({
  workspaceId,
  copyInviteLinkAction,
  inviteId,
}: CopyWorkspaceInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleCopy() {
    try {
      setIsPending(true);
      const result = await copyInviteLinkAction(inviteId, workspaceId);

      if (!result.inviteUrl) {
        throw new Error(result.error ?? "Failed to create a fresh invite link.");
      }

      await navigator.clipboard.writeText(result.inviteUrl);
      toast.success("Link copied to clipboard.");

      startTransition(() => {
        setCopied(true);
      });

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Failed to copy workspace invite URL.", error);
      toast.error("Failed to copy link.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button disabled={isPending} onClick={handleCopy} type="button" variant="outline">
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Copied link" : isPending ? "Preparing link..." : "Copy fresh link"}
    </Button>
  );
}
