"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type CopyEmailButtonProps = {
  email: string;
};

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  return (
    <Button onClick={handleCopy} type="button" variant="outline">
      {state === "copied" ? (
        <Check data-icon="inline-start" />
      ) : (
        <Copy data-icon="inline-start" />
      )}
      {state === "copied"
        ? "Copied"
        : state === "error"
          ? "Copy failed"
          : "Copy email"}
    </Button>
  );
}
