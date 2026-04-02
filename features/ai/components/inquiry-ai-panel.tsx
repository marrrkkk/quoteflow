"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  ListChecks,
  Mail,
  ReceiptText,
  SendHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type {
  AiAssistantActionState,
  AiAssistantIntent,
} from "@/features/ai/types";
import { cn } from "@/lib/utils";

type InquiryAiPanelProps = {
  action: (
    state: AiAssistantActionState,
    formData: FormData,
  ) => Promise<AiAssistantActionState>;
};

type CopyState = "idle" | "copied" | "error";

const initialState: AiAssistantActionState = {};

const presetActions: Array<{
  intent: AiAssistantIntent;
  label: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    intent: "draft-first-reply",
    label: "Draft first reply",
    description: "Customer-ready first response with clear next questions.",
    icon: Mail,
  },
  {
    intent: "summarize-inquiry",
    label: "Summarize inquiry",
    description: "Short owner-facing brief with missing info and next step.",
    icon: FileText,
  },
  {
    intent: "suggest-follow-up-questions",
    label: "Suggest questions",
    description: "Clarifying questions that unblock scope, timing, and quote prep.",
    icon: ListChecks,
  },
  {
    intent: "suggest-quote-line-items",
    label: "Suggest line items",
    description: "Quote structure ideas without inventing prices.",
    icon: ReceiptText,
  },
  {
    intent: "rewrite-draft",
    label: "Rewrite draft",
    description: "Professional rewrite of a rough message you paste below.",
    icon: Wand2,
  },
  {
    intent: "generate-follow-up-message",
    label: "Generate follow-up",
    description: "Concise check-in for an inquiry that still needs a reply.",
    icon: SendHorizontal,
  },
];

function useTimedCopyState() {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  return [state, setState] as const;
}

async function copyText(value: string, setState: (state: CopyState) => void) {
  try {
    await navigator.clipboard.writeText(value);
    setState("copied");
  } catch {
    setState("error");
  }
}

export function InquiryAiPanel({ action }: InquiryAiPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [replyDraft, setReplyDraft] = useState("");
  const [outputCopyState, setOutputCopyState] = useTimedCopyState();
  const [replyCopyState, setReplyCopyState] = useTimedCopyState();
  const activeIntent = state.result?.intent;

  return (
    <Card className="overflow-visible border-primary/10 bg-[linear-gradient(180deg,rgba(250,250,249,0.98),rgba(245,245,244,0.94))]">
      <CardHeader className="gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 text-primary shadow-sm">
            <Sparkles />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle>AI reply assistant</CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Generate internal drafts and guidance using inquiry details,
              notes, FAQs, and uploaded knowledge. Pricing or policy gaps stay
              explicit instead of being invented.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            "Inquiry context",
            "Internal notes",
            "Workspace FAQs",
            "Knowledge snippets",
          ].map((label) => (
            <span
              className="rounded-full border bg-background/80 px-3 py-1"
              key={label}
            >
              {label}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {state.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not generate the AI output.</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="flex flex-col gap-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {presetActions.map((preset) => {
              const Icon = preset.icon;
              const isActive = activeIntent === preset.intent;

              return (
                <Button
                  className={cn(
                    "h-auto min-h-24 items-start justify-start rounded-[1.4rem] px-4 py-3 text-left",
                    !isActive &&
                      "bg-background/82 hover:border-primary/20 hover:bg-background",
                  )}
                  disabled={isPending}
                  key={preset.intent}
                  name="intent"
                  type="submit"
                  value={preset.intent}
                  variant={isActive ? "default" : "outline"}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon data-icon="inline-start" />
                      <span>{preset.label}</span>
                    </div>
                    <span
                      className={cn(
                        "text-left text-xs leading-5",
                        isActive
                          ? "text-primary-foreground/85"
                          : "text-muted-foreground",
                      )}
                    >
                      {preset.description}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>

          <FieldGroup>
            <Field
              data-invalid={Boolean(state.fieldErrors?.customPrompt) || undefined}
            >
              <FieldLabel htmlFor="inquiry-ai-custom-prompt">
                Custom instruction
              </FieldLabel>
              <FieldContent>
                <FieldDescription>
                  Optional for the preset buttons. Required if you run a custom
                  request.
                </FieldDescription>
                <Textarea
                  defaultValue=""
                  disabled={isPending}
                  id="inquiry-ai-custom-prompt"
                  name="customPrompt"
                  placeholder="Example: keep this tighter, focus on turnaround expectations, or make the tone more direct."
                  rows={4}
                />
                <FieldError
                  errors={
                    state.fieldErrors?.customPrompt?.[0]
                      ? [{ message: state.fieldErrors.customPrompt[0] }]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field
              data-invalid={Boolean(state.fieldErrors?.sourceDraft) || undefined}
            >
              <FieldLabel htmlFor="inquiry-ai-source-draft">
                Draft or working text
              </FieldLabel>
              <FieldContent>
                <FieldDescription>
                  Paste a rough draft here for Rewrite draft, or add text the
                  assistant should refine.
                </FieldDescription>
                <Textarea
                  defaultValue=""
                  disabled={isPending}
                  id="inquiry-ai-source-draft"
                  name="sourceDraft"
                  placeholder="Paste your draft reply here when you want the assistant to rewrite it professionally."
                  rows={6}
                />
                <FieldError
                  errors={
                    state.fieldErrors?.sourceDraft?.[0]
                      ? [{ message: state.fieldErrors.sourceDraft[0] }]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3 rounded-[1.45rem] border border-dashed bg-background/75 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              Need something more specific than the preset tools? Run a custom
              request against the current inquiry context.
            </p>
            <Button
              disabled={isPending}
              name="intent"
              type="submit"
              value="custom"
              variant="secondary"
            >
              {isPending ? "Running request..." : "Run custom prompt"}
            </Button>
          </div>
        </form>

        {state.result ? (
          <div className="rounded-[1.55rem] border bg-background/85 shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Latest output
                  </p>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {state.result.title}
                  </h3>
                </div>
                <span className="rounded-full border bg-muted/35 px-3 py-1 text-xs text-muted-foreground">
                  {state.result.model}
                </span>
              </div>

              <div className="rounded-[1.35rem] border bg-stone-50/85 px-4 py-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {state.result.output}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {state.result.canInsertIntoReply ? (
                  <Button
                    onClick={() => setReplyDraft(state.result?.output ?? "")}
                    type="button"
                    variant="outline"
                  >
                    Insert into reply draft
                  </Button>
                ) : null}
                <Button
                  onClick={() =>
                    copyText(state.result?.output ?? "", setOutputCopyState)
                  }
                  type="button"
                  variant="outline"
                >
                  {outputCopyState === "copied" ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <Copy data-icon="inline-start" />
                  )}
                  {outputCopyState === "copied"
                    ? "Copied"
                    : outputCopyState === "error"
                      ? "Copy failed"
                      : "Copy output"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Empty className="border bg-background/70">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>No AI output yet</EmptyTitle>
              <EmptyDescription>
                Run one of the preset actions or a custom request to generate a
                concise internal draft for this inquiry.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <div className="rounded-[1.55rem] border border-dashed bg-background/72 px-5 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Reply staging
              </p>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Reply draft workspace
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Insert reply-style AI outputs here before you copy, trim, or
                send them from your normal email workflow.
              </p>
            </div>

            <Textarea
              disabled={isPending}
              onChange={(event) => setReplyDraft(event.currentTarget.value)}
              placeholder="Reply-style outputs can be inserted here, then edited before you send them."
              rows={7}
              value={replyDraft}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={!replyDraft}
                onClick={() => copyText(replyDraft, setReplyCopyState)}
                type="button"
                variant="outline"
              >
                {replyCopyState === "copied" ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Copy data-icon="inline-start" />
                )}
                {replyCopyState === "copied"
                  ? "Copied"
                  : replyCopyState === "error"
                    ? "Copy failed"
                    : "Copy reply draft"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-4 text-xs text-muted-foreground">
        <span>Internal assistant only</span>
        <span>No customer-facing chat or automatic sending</span>
      </CardFooter>
    </Card>
  );
}
