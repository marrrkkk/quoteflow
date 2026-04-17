/**
 * Business-customizable email template configuration for the quote email.
 *
 * Each field is optional — `null`/`undefined` falls back to the built-in default.
 * Merge tags use `{{variableName}}` syntax and are replaced at render time.
 */

// ---------------------------------------------------------------------------
// Config type
// ---------------------------------------------------------------------------

export type QuoteEmailTemplateConfig = {
  subject?: string | null;
  greeting?: string | null;
  introText?: string | null;
  ctaLabel?: string | null;
  closingText?: string | null;
};

// ---------------------------------------------------------------------------
// Merge-tag variables available to business owners
// ---------------------------------------------------------------------------

export const quoteEmailMergeTags = [
  { tag: "{{businessName}}", label: "Business name" },
  { tag: "{{customerName}}", label: "Customer name" },
  { tag: "{{quoteNumber}}", label: "Quote number" },
  { tag: "{{quoteTitle}}", label: "Quote title" },
] as const;

export type QuoteEmailMergeValues = {
  businessName: string;
  customerName: string;
  quoteNumber: string;
  quoteTitle: string;
};

// ---------------------------------------------------------------------------
// Built-in defaults (used when no business override is set)
// ---------------------------------------------------------------------------

export const quoteEmailTemplateDefaults: Required<
  Record<keyof QuoteEmailTemplateConfig, string>
> = {
  subject: "{{quoteNumber}} from {{businessName}}",
  greeting: "Hi {{customerName}},",
  introText: "{{businessName}} prepared a quote for you.",
  ctaLabel: "Review quote online",
  closingText: "Reply to this email if you have any questions.",
};

// ---------------------------------------------------------------------------
// Starter presets
// ---------------------------------------------------------------------------

export type QuoteEmailPresetKey = "professional" | "friendly" | "concise";

export const quoteEmailPresets: Record<
  QuoteEmailPresetKey,
  { label: string; description: string; config: QuoteEmailTemplateConfig }
> = {
  professional: {
    label: "Professional",
    description: "Formal tone, brand-forward.",
    config: {
      subject: "{{quoteNumber}} — {{quoteTitle}} from {{businessName}}",
      greeting: "Dear {{customerName}},",
      introText:
        "Please find your quote below, prepared by {{businessName}}.",
      ctaLabel: "Review quote",
      closingText:
        "If you have any questions or need adjustments, feel free to reply to this email.",
    },
  },
  friendly: {
    label: "Friendly",
    description: "Warm, personal tone.",
    config: {
      subject: "Your quote from {{businessName}} is ready!",
      greeting: "Hey {{customerName}}!",
      introText:
        "Great news — your custom quote is ready. Here's what we put together for you.",
      ctaLabel: "Check out your quote",
      closingText:
        "Have questions? Just hit reply — we're happy to help!",
    },
  },
  concise: {
    label: "Concise",
    description: "Minimal, direct.",
    config: {
      subject: "{{quoteNumber}} from {{businessName}}",
      greeting: "Hi {{customerName}},",
      introText: "Here's your quote.",
      ctaLabel: "View quote",
      closingText: "Reply if you have questions.",
    },
  },
};

export const quoteEmailPresetKeys = Object.keys(
  quoteEmailPresets,
) as QuoteEmailPresetKey[];

// ---------------------------------------------------------------------------
// Sample merge values (for live preview in the settings UI)
// ---------------------------------------------------------------------------

export const quoteEmailSampleMergeValues: QuoteEmailMergeValues = {
  businessName: "Northline Home Services",
  customerName: "Alex Rivera",
  quoteNumber: "Q-2026-0042",
  quoteTitle: "Kitchen renovation",
};

// ---------------------------------------------------------------------------
// Resolver — merges overrides with defaults and replaces merge tags
// ---------------------------------------------------------------------------

function replaceMergeTags(
  template: string,
  values: QuoteEmailMergeValues,
): string {
  return template
    .replace(/\{\{businessName\}\}/g, values.businessName)
    .replace(/\{\{customerName\}\}/g, values.customerName)
    .replace(/\{\{quoteNumber\}\}/g, values.quoteNumber)
    .replace(/\{\{quoteTitle\}\}/g, values.quoteTitle);
}

export type ResolvedQuoteEmailTemplate = {
  subject: string;
  greeting: string;
  introText: string;
  ctaLabel: string;
  closingText: string;
};

/**
 * Merge the business template overrides with built-in defaults, then replace
 * merge-tag variables with actual values.
 */
export function resolveQuoteEmailTemplate(
  config: QuoteEmailTemplateConfig | null | undefined,
  values: QuoteEmailMergeValues,
): ResolvedQuoteEmailTemplate {
  const merged = {
    subject:
      config?.subject?.trim() || quoteEmailTemplateDefaults.subject,
    greeting:
      config?.greeting?.trim() || quoteEmailTemplateDefaults.greeting,
    introText:
      config?.introText?.trim() || quoteEmailTemplateDefaults.introText,
    ctaLabel:
      config?.ctaLabel?.trim() || quoteEmailTemplateDefaults.ctaLabel,
    closingText:
      config?.closingText?.trim() || quoteEmailTemplateDefaults.closingText,
  };

  return {
    subject: replaceMergeTags(merged.subject, values),
    greeting: replaceMergeTags(merged.greeting, values),
    introText: replaceMergeTags(merged.introText, values),
    ctaLabel: replaceMergeTags(merged.ctaLabel, values),
    closingText: replaceMergeTags(merged.closingText, values),
  };
}
