"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FollowUpMessageCopyButton } from "@/features/follow-ups/components/follow-up-message-copy-button";

type FollowUpAiMessageButtonProps = {
  followUpTitle: string;
  followUpReason: string;
  channel: string;
  customerName: string;
  businessName: string;
  recordKind: "inquiry" | "quote";
  quoteUrl?: string | null;
  quoteViewed?: boolean;
  aiTone?: "balanced" | "warm" | "direct" | "formal";
};

export function FollowUpAiMessageButton({
  followUpTitle,
  followUpReason,
  channel,
  customerName,
  businessName,
  recordKind,
  quoteUrl,
  quoteViewed,
  aiTone = "balanced",
}: FollowUpAiMessageButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateMessage() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/business/follow-ups/suggest-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpTitle,
          followUpReason,
          channel,
          customerName,
          businessName,
          recordKind,
          quoteUrl,
          quoteViewed,
          aiTone,
        }),
      });

      if (!response.ok) {
        setError("Could not generate a message right now.");
        return;
      }

      const data = await response.json();
      setMessage(data.message);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          AI-generated message
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <FollowUpMessageCopyButton message={message} />
          <Button
            onClick={generateMessage}
            size="sm"
            type="button"
            variant="ghost"
            disabled={loading}
          >
            {loading ? <Spinner data-icon="inline-start" aria-hidden="true" /> : <Sparkles data-icon="inline-start" />}
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        disabled={loading}
        onClick={generateMessage}
        size="sm"
        type="button"
        variant="outline"
      >
        {loading ? (
          <Spinner data-icon="inline-start" aria-hidden="true" />
        ) : (
          <Sparkles data-icon="inline-start" />
        )}
        {loading ? "Generating..." : "Generate AI message"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
