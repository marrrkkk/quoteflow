import "server-only";

import type {
  InquiryFormConfig,
  InquiryFormFieldDefinition,
} from "@/features/inquiries/form-config";
import {
  inquiryContactMethodLabels,
  type InquiryContactMethod,
} from "@/features/inquiries/form-config";

// ---------------------------------------------------------------------------
// Public Inquiry Chat — System Prompt Builder
//
// Generates the system prompt that instructs the AI to act as a friendly
// intake assistant for the business's inquiry form. The prompt encodes all
// the form field definitions so the AI knows exactly what data to collect.
// ---------------------------------------------------------------------------

type BuildConversationalPromptInput = {
  businessName: string;
  businessDescription: string | null;
  formConfig: InquiryFormConfig;
  openingMessage?: string;
  assistantName?: string;
};

function describeFieldType(field: InquiryFormFieldDefinition): string {
  if (field.kind === "system") {
    switch (field.key) {
      case "serviceCategory":
        return "short text (the service or project type)";
      case "requestedDeadline":
        return "date (YYYY-MM-DD format)";
      case "budgetText":
        return "budget amount or range (number or text)";
      case "details":
        return "long text (detailed description of what they need)";
      case "attachment":
        return "file attachment (skip — cannot be collected via chat)";
    }
  }

  if (field.kind === "custom") {
    switch (field.fieldType) {
      case "short_text":
        return "short text";
      case "long_text":
        return "long text";
      case "number":
        return "number";
      case "date":
        return "date (YYYY-MM-DD format)";
      case "boolean":
        return 'yes/no (respond "true" or "false")';
      case "select":
        return `single choice from: ${(field.options ?? []).map((o) => o.label).join(", ")}`;
      case "multi_select":
        return `multiple choice from: ${(field.options ?? []).map((o) => o.label).join(", ")}`;
    }
  }

  return "text";
}

function describeContactMethods(): string {
  return (Object.entries(inquiryContactMethodLabels) as [InquiryContactMethod, string][])
    .map(([key, label]) => `"${key}" (${label})`)
    .join(", ");
}

function describeFormFields(config: InquiryFormConfig): string {
  const lines: string[] = [];

  // Contact fields
  lines.push("## Contact Fields (always required)");
  lines.push(
    `- "customerName": Their full name (required)`,
  );
  lines.push(
    `- "customerContactMethod": One of ${describeContactMethods()} (required)`,
  );
  lines.push(
    `- "customerContactHandle": Their contact detail matching the method — email address, phone number, social handle, etc. (required)`,
  );

  // Project fields
  const projectFields = config.projectFields.filter(
    (f) => !(f.kind === "system" && f.key === "attachment"),
  );

  if (projectFields.length > 0) {
    lines.push("");
    lines.push("## Project Fields");

    for (const field of projectFields) {
      if (field.kind === "system" && !field.enabled) {
        continue;
      }

      const id = field.kind === "system" ? field.key : field.id;
      const required = field.required ? "required" : "optional";
      const typeDesc = describeFieldType(field);

      lines.push(`- "${id}": ${field.label} — ${typeDesc} (${required})`);
    }
  }

  return lines.join("\n");
}

export function buildConversationalSystemPrompt({
  businessName,
  businessDescription,
  formConfig,
  openingMessage,
  assistantName,
}: BuildConversationalPromptInput): string {
  const fieldSpec = describeFormFields(formConfig);
  const businessContext = businessDescription
    ? `${businessName} — ${businessDescription}`
    : businessName;
  const displayName = assistantName || `${businessName} Assistant`;

  return `You are ${displayName}, a friendly, professional intake assistant for ${businessContext}. Your job is to collect inquiry information from potential customers through a natural conversation.

## Your Behavior

1. Greet the customer warmly and briefly. ${openingMessage ? `Use this as your opening: "${openingMessage}"` : "Introduce yourself as an assistant helping them submit an inquiry."}
2. Ask about ONE field at a time. Never dump all questions at once.
3. Be conversational and natural — not robotic. Adapt your questions based on what the customer has already told you.
4. If the customer volunteers information about multiple fields in one message, acknowledge all of it and move on to the remaining fields.
5. Keep your responses short — 1 to 3 sentences max.
6. For optional fields, ask about them naturally but don't push if the customer seems uninterested.
7. Ask required fields first (name, contact, service category, details), then optional ones.
8. Do NOT make up or assume information the customer hasn't provided.

## Fields to Collect

${fieldSpec}

## Extraction

When you have collected ALL required fields and have asked about the optional ones (or the customer has declined), output a JSON extraction block. This MUST be the last thing in your final message — after your closing text.

Format your final message like:
"[Your closing message to the customer, thanking them and letting them know their inquiry summary is ready for review.]

\`\`\`json:extraction
{
  "customerName": "...",
  "customerContactMethod": "...",
  "customerContactHandle": "...",
  "serviceCategory": "...",
  "details": "...",
  // include any other collected fields
}
\`\`\`"

## Rules

- NEVER output the extraction block until you have all required fields.
- The "details" field should be a rich summary of what the customer described, not just their raw message. Combine multiple messages into a coherent description.
- For select/multi_select fields, use the exact option values, not labels.
- For date fields, use YYYY-MM-DD format.
- For boolean fields, use true or false.
- Custom fields should be placed in a "customFields" object keyed by field id.
- Be helpful but stay on topic — you're collecting inquiry details, not providing quotes or advice.
- If the customer asks about pricing or timelines, politely redirect: "${businessName} will review your inquiry and follow up with details."`;
}
