"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, Bot, Loader2, RotateCcw, Send, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getInquiryFormFieldInputName,
  inquiryContactMethodLabels,
  type InquiryContactMethod,
  type InquiryFormConversationalAvatarStyle,
} from "@/features/inquiries/form-config";
import type { PublicInquiryBusiness } from "@/features/inquiries/types";
import type {
  PublicInquiryChatExtractedFields,
  PublicInquiryChatStreamEvent,
} from "@/features/inquiries/public-inquiry-chat-schemas";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Conversational Inquiry Form
//
// Chat-style public-facing component that replaces the static form when
// conversational mode is enabled. Streams AI responses from the public
// inquiry chat API and renders a chat bubble interface.
// ---------------------------------------------------------------------------

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ConversationPhase = "chatting" | "confirming" | "submitting" | "submitted";

type ConversationalInquiryFormProps = {
  business: PublicInquiryBusiness;
  action: (
    state: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
};

let messageIdCounter = 0;
function createMessageId() {
  messageIdCounter += 1;
  return `msg_${messageIdCounter}_${Date.now()}`;
}

/**
 * Build a map of all custom field input names from the form config, with
 * their labels and default empty values. Used to ensure the confirmation
 * panel and submission include every field the validation expects.
 */
function getCustomFieldMeta(business: PublicInquiryBusiness) {
  const fields: Array<{
    inputName: string;
    fieldId: string;
    label: string;
    required: boolean;
    fieldType: string;
  }> = [];

  for (const field of business.inquiryFormConfig.projectFields) {
    if (field.kind !== "custom") continue;

    fields.push({
      inputName: getInquiryFormFieldInputName(field),
      fieldId: field.id,
      label: field.label,
      required: field.required,
      fieldType: field.fieldType,
    });
  }

  return fields;
}

/** Derive chatbot display config from the form's conversational mode. */
function getChatbotConfig(business: PublicInquiryBusiness) {
  const conv = business.inquiryFormConfig.conversationalMode;

  return {
    assistantName: conv?.assistantName || `${business.name} Assistant`,
    avatarStyle: (conv?.avatarStyle ?? "brand") as InquiryFormConversationalAvatarStyle,
  };
}

export function ConversationalInquiryForm({
  business,
  action,
}: ConversationalInquiryFormProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [phase, setPhase] = useState<ConversationPhase>("chatting");
  const [_extractedFields, setExtractedFields] =
    useState<PublicInquiryChatExtractedFields | null>(null);
  const [editedFields, setEditedFields] =
    useState<PublicInquiryChatExtractedFields | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const customFieldMeta = getCustomFieldMeta(business);
  const chatbot = getChatbotConfig(business);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Send the initial greeting on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    void sendToApi([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendToApi(currentMessages: ChatMessage[]) {
    setIsStreaming(true);

    const assistantMessageId = createMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const apiMessages = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/public/inquiry-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          formSlug: business.form.isDefault ? undefined : business.form.slug,
          messages: apiMessages,
        }),
      });

      if (!response.ok || !response.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    "I'm having trouble connecting right now. Please try again in a moment.",
                }
              : m,
          ),
        );
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(
              line.slice(6),
            ) as PublicInquiryChatStreamEvent;

            if (event.type === "delta") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: m.content + event.value }
                    : m,
                ),
              );
              scrollToBottom();
            } else if (event.type === "done" && event.extracted) {
              // Strip the extraction JSON block from the displayed message
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantMessageId) return m;

                  const cleaned = m.content
                    .replace(/```json:extraction[\s\S]*?```/g, "")
                    .trim();

                  return { ...m, content: cleaned };
                }),
              );
              setExtractedFields(event.extracted);
              setEditedFields({ ...event.extracted });
              setPhase("confirming");
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content:
                          m.content ||
                          "I ran into an issue. Please try again.",
                      }
                    : m,
                ),
              );
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error("[conversational-form] Stream error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  m.content ||
                  "Something went wrong. Please try again.",
              }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  }

  function handleSend() {
    const trimmed = inputValue.trim();

    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");
    scrollToBottom();

    void sendToApi(nextMessages);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleSubmit() {
    if (!editedFields) return;

    setPhase("submitting");
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.set("customerName", editedFields.customerName);
      formData.set("customerContactMethod", editedFields.customerContactMethod);
      formData.set(
        "customerContactHandle",
        editedFields.customerContactHandle,
      );
      formData.set("serviceCategory", editedFields.serviceCategory);
      formData.set("details", editedFields.details);

      if (editedFields.requestedDeadline) {
        formData.set("requestedDeadline", editedFields.requestedDeadline);
      }
      if (editedFields.budgetText) {
        formData.set("budgetText", editedFields.budgetText);
      }

      // Custom fields — populate ALL fields from the form config.
      const extractedCustom = editedFields.customFields ?? {};

      for (const meta of customFieldMeta) {
        const value = extractedCustom[meta.fieldId];

        if (Array.isArray(value)) {
          for (const v of value) {
            formData.append(meta.inputName, v);
          }
        } else if (typeof value === "boolean") {
          formData.set(meta.inputName, String(value));
        } else if (typeof value === "string") {
          formData.set(meta.inputName, value);
        } else {
          formData.set(meta.inputName, "");
        }
      }

      const result = await action({}, formData);

      if (result?.error) {
        setSubmitError(result.error);
        setPhase("confirming");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setPhase("confirming");
    }
  }

  function handleEditField(
    field: keyof PublicInquiryChatExtractedFields,
    value: string,
  ) {
    setEditedFields((prev) =>
      prev ? { ...prev, [field]: value } : prev,
    );
  }

  function handleEditCustomField(fieldId: string, value: string) {
    setEditedFields((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldId]: value,
        },
      };
    });
  }

  function handleReset() {
    setMessages([]);
    setInputValue("");
    setExtractedFields(null);
    setEditedFields(null);
    setPhase("chatting");
    setSubmitError(null);
    hasInitialized.current = false;

    requestAnimationFrame(() => {
      hasInitialized.current = true;
      void sendToApi([]);
    });
  }

  // Detect streaming with no content yet (for typing indicator)
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const showTypingIndicator =
    isStreaming && lastMsg?.role === "assistant" && !lastMsg?.content;

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden border-border/75 bg-card/96">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-6">
        <ChatAvatar
          assistantName={chatbot.assistantName}
          avatarStyle={chatbot.avatarStyle}
          size="sm"
        />
        <div className="flex flex-col gap-0">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {chatbot.assistantName}
          </span>
          <span className="text-xs text-muted-foreground">
            {isStreaming ? "Typing…" : "Online"}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-col gap-0 p-0">
        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          className="flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto px-4 py-5 sm:max-h-[32rem] sm:px-6"
        >
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              assistantName={chatbot.assistantName}
              avatarStyle={chatbot.avatarStyle}
              message={msg}
            />
          ))}

          {showTypingIndicator ? <TypingIndicator /> : null}

          <div ref={messagesEndRef} />
        </div>

        {/* Confirmation panel */}
        {phase === "confirming" && editedFields ? (
          <ConfirmationPanel
            fields={editedFields}
            business={business}
            customFieldMeta={customFieldMeta}
            submitError={submitError}
            onEdit={handleEditField}
            onEditCustomField={handleEditCustomField}
            onSubmit={handleSubmit}
            onBack={() => setPhase("chatting")}
          />
        ) : phase === "submitting" ? (
          <div className="flex items-center justify-center gap-2 border-t border-border/50 px-4 py-6">
            <Spinner aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              Submitting your inquiry…
            </span>
          </div>
        ) : (
          /* Input bar */
          <div className="flex items-center gap-2 border-t border-border/50 px-3 py-3 sm:px-5">
            <Input
              ref={inputRef}
              autoFocus
              className="flex-1"
              disabled={isStreaming || phase !== "chatting"}
              maxLength={2000}
              onKeyDown={handleKeyDown}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message…"
              value={inputValue}
            />
            <Button
              disabled={!inputValue.trim() || isStreaming}
              onClick={handleSend}
              size="icon"
              variant="default"
              className="shrink-0"
            >
              <ArrowUp className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
            {messages.length > 2 && !isStreaming && (
              <Button
                onClick={handleReset}
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground"
                title="Start over"
              >
                <RotateCcw className="size-3.5" />
                <span className="sr-only">Start over</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChatAvatar({
  assistantName,
  avatarStyle,
  size = "default",
}: {
  assistantName: string;
  avatarStyle: InquiryFormConversationalAvatarStyle;
  size?: "sm" | "default";
}) {
  const initial = assistantName.charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "size-8" : "size-8";

  if (avatarStyle === "initials") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold",
          sizeClass,
        )}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
        sizeClass,
      )}
    >
      <Bot className="size-3.5" />
    </div>
  );
}

function ChatBubble({
  assistantName,
  avatarStyle,
  message,
}: {
  assistantName: string;
  avatarStyle: InquiryFormConversationalAvatarStyle;
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-3.5" />
        </div>
      ) : (
        <ChatAvatar
          assistantName={assistantName}
          avatarStyle={avatarStyle}
        />
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-md bg-primary text-primary-foreground"
            : "rounded-tl-md bg-secondary text-secondary-foreground",
        )}
      >
        {message.content || (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
          </span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-2.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

type CustomFieldMetaItem = {
  inputName: string;
  fieldId: string;
  label: string;
  required: boolean;
  fieldType: string;
};

function ConfirmationPanel({
  fields,
  business,
  customFieldMeta,
  submitError,
  onEdit,
  onEditCustomField,
  onSubmit,
  onBack,
}: {
  fields: PublicInquiryChatExtractedFields;
  business: PublicInquiryBusiness;
  customFieldMeta: CustomFieldMetaItem[];
  submitError: string | null;
  onEdit: (
    field: keyof PublicInquiryChatExtractedFields,
    value: string,
  ) => void;
  onEditCustomField: (fieldId: string, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const contactMethodLabel =
    inquiryContactMethodLabels[
      fields.customerContactMethod as InquiryContactMethod
    ] ?? fields.customerContactMethod;

  return (
    <div className="flex flex-col gap-4 border-t border-border/50 px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Review your inquiry
        </h3>
        <p className="text-sm text-muted-foreground">
          Confirm the details below before submitting to {business.name}.
        </p>
      </div>

      <div className="grid gap-3">
        <ConfirmationField
          label="Name"
          value={fields.customerName}
          onChange={(v) => onEdit("customerName", v)}
        />
        <ConfirmationField
          label={`Contact (${contactMethodLabel})`}
          value={fields.customerContactHandle}
          onChange={(v) => onEdit("customerContactHandle", v)}
        />
        <ConfirmationField
          label="Service needed"
          value={fields.serviceCategory}
          onChange={(v) => onEdit("serviceCategory", v)}
        />
        <ConfirmationField
          label="Details"
          value={fields.details}
          onChange={(v) => onEdit("details", v)}
          multiline
        />
        {fields.budgetText ? (
          <ConfirmationField
            label="Budget"
            value={fields.budgetText}
            onChange={(v) => onEdit("budgetText", v)}
          />
        ) : null}
        {fields.requestedDeadline ? (
          <ConfirmationField
            label="Deadline"
            value={fields.requestedDeadline}
            onChange={(v) => onEdit("requestedDeadline", v)}
          />
        ) : null}

        {/* Custom fields from the form config */}
        {customFieldMeta.map((meta) => {
          const extractedValue = fields.customFields?.[meta.fieldId];
          const displayValue =
            typeof extractedValue === "string"
              ? extractedValue
              : Array.isArray(extractedValue)
                ? extractedValue.join(", ")
                : typeof extractedValue === "boolean"
                  ? extractedValue
                    ? "Yes"
                    : "No"
                  : "";

          if (!displayValue && !meta.required) return null;

          return (
            <ConfirmationField
              key={meta.fieldId}
              label={`${meta.label}${meta.required ? "" : " (optional)"}`}
              value={displayValue}
              onChange={(v) => onEditCustomField(meta.fieldId, v)}
              missing={!displayValue && meta.required}
            />
          );
        })}
      </div>

      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back to chat
        </Button>
        <Button onClick={onSubmit} size="default">
          <Send className="mr-1.5 size-3.5" />
          Submit inquiry
        </Button>
      </div>
    </div>
  );
}

function ConfirmationField({
  label,
  value,
  onChange,
  multiline = false,
  missing = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  missing?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false || missing);
  const [editValue, setEditValue] = useState(value);

  function handleSave() {
    onChange(editValue.trim());
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={cn(
          "text-xs font-medium",
          missing ? "text-destructive" : "text-muted-foreground",
        )}>
          {label}
          {missing ? " — required" : ""}
        </span>
        {multiline ? (
          <textarea
            className="control-surface min-h-[5rem] w-full resize-y rounded-lg border border-input/95 px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
            onChange={(e) => setEditValue(e.target.value)}
            value={editValue}
          />
        ) : (
          <Input
            autoFocus
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            value={editValue}
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={handleSave}>
            Save
          </Button>
          {!missing ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditValue(value);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-sm text-foreground">
          {multiline ? (
            <span className="line-clamp-3 whitespace-pre-line">{value}</span>
          ) : (
            value
          )}
        </span>
      </div>
      <button
        className="shrink-0 text-xs text-primary hover:underline"
        onClick={() => setIsEditing(true)}
        type="button"
      >
        Edit
      </button>
    </div>
  );
}
