import { describe, expect, it } from "vitest";

import { buildAiAssistantInput } from "@/features/ai/prompts";
import type { InquiryAssistantContext } from "@/features/ai/types";

const now = new Date("2026-04-26T08:00:00.000Z");

function makeInquiryContext(): InquiryAssistantContext {
  return {
    business: {
      id: "biz_1",
      name: "Brightside Studio",
      slug: "brightside",
      businessType: "web_it_services",
      shortDescription: "Web design and support",
      contactEmail: "hello@example.com",
      defaultCurrency: "USD",
      defaultEmailSignature: "Thanks, Brightside",
      defaultQuoteNotes: "Valid for 14 days.",
      aiTonePreference: "balanced",
      createdAt: now,
      inquiryPageHeadline: "Tell us about the work",
      inquiryPageTemplate: "split",
      publicInquiryEnabled: true,
    },
    inquiry: {
      id: "inq_1",
      businessInquiryFormId: "form_1",
      inquiryFormName: "Default inquiry",
      inquiryFormSlug: "default",
      inquiryFormBusinessType: "web_it_services",
      customerName: "Ava Ramos",
      customerEmail: "ava@example.com",
      customerContactMethod: "email",
      customerContactHandle: "ava@example.com",
      serviceCategory: "Website redesign",
      requestedDeadline: "May",
      budgetText: "$5,000",
      subject: "Refresh website",
      details: "Needs a cleaner homepage and quote form.",
      source: "manual",
      status: "quoted",
      submittedAt: now,
      createdAt: now,
      submittedFieldSnapshot: null,
    },
    notes: [
      {
        id: "note_1",
        authorName: "Mark",
        body: "Customer prefers email and needs launch before June.",
        createdAt: now,
      },
    ],
    attachments: [
      {
        id: "att_1",
        fileName: "current-site.pdf",
        contentType: "application/pdf",
        fileSize: 2048,
        createdAt: now,
      },
    ],
    activities: [
      {
        id: "act_1",
        type: "inquiry_status_changed",
        summary: "Inquiry moved to quoted.",
        actorName: "Mark",
        createdAt: now,
      },
    ],
    followUps: [
      {
        id: "fu_1",
        inquiryId: "inq_1",
        quoteId: "quote_1",
        quoteNumber: "Q-1001",
        quoteTitle: "Website redesign",
        title: "Check if quote is clear",
        reason: "Quote was viewed but not accepted.",
        channel: "email",
        dueAt: now,
        completedAt: null,
        skippedAt: null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    ],
    relatedQuotes: [
      {
        id: "quote_1",
        quoteNumber: "Q-1001",
        title: "Website redesign",
        customerName: "Ava Ramos",
        customerEmail: "ava@example.com",
        customerContactMethod: "email",
        customerContactHandle: "ava@example.com",
        currency: "USD",
        notes: "Includes homepage, contact page, and quote form.",
        subtotalInCents: 500000,
        discountInCents: 0,
        totalInCents: 500000,
        validUntil: "2026-05-10",
        status: "sent",
        postAcceptanceStatus: "none",
        sentAt: now,
        acceptedAt: null,
        publicViewedAt: now,
        customerRespondedAt: null,
        customerResponseMessage: null,
        createdAt: now,
        updatedAt: now,
        items: [
          {
            id: "item_1",
            description: "Homepage redesign",
            quantity: 1,
            unitPriceInCents: 300000,
            lineTotalInCents: 300000,
            position: 0,
          },
        ],
        activities: [
          {
            id: "quote_act_1",
            type: "quote_viewed",
            summary: "Customer viewed the quote.",
            actorName: null,
            createdAt: now,
          },
        ],
      },
    ],
    memory: {
      memories: [],
      combinedText: "",
    },
  };
}

describe("buildAiAssistantInput", () => {
  it("includes full inquiry workflow context", () => {
    const input = buildAiAssistantInput(makeInquiryContext(), {
      intent: "summarize-inquiry",
    });

    expect(input).toContain("Attachments");
    expect(input).toContain("current-site.pdf");
    expect(input).toContain("Follow-ups");
    expect(input).toContain("Check if quote is clear");
    expect(input).toContain("Related quotes");
    expect(input).toContain("Q-1001");
    expect(input).toContain("Homepage redesign");
    expect(input).toContain("Inquiry activity timeline");
    expect(input).toContain("Inquiry moved to quoted.");
    expect(input).toContain("Customer viewed the quote.");
  });
});
