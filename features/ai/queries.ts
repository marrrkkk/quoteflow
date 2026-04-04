import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getNormalizedInquirySubmittedFieldSnapshot } from "@/features/inquiries/form-config";
import { getNormalizedInquiryPageConfig } from "@/features/inquiries/page-config";
import { buildWorkspaceKnowledgeContext } from "@/features/knowledge/queries";
import type { InquiryAssistantContext } from "@/features/ai/types";
import { db } from "@/lib/db/client";
import {
  inquiries,
  inquiryNotes,
  user,
  workspaceInquiryForms,
  workspaces,
} from "@/lib/db/schema";

type GetInquiryAssistantContextForWorkspaceInput = {
  workspaceId: string;
  inquiryId: string;
};

export async function getInquiryAssistantContextForWorkspace({
  workspaceId,
  inquiryId,
}: GetInquiryAssistantContextForWorkspaceInput): Promise<InquiryAssistantContext | null> {
  const [workspaceRow, inquiryRow, notes, knowledge] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        businessType: workspaces.businessType,
        shortDescription: workspaces.shortDescription,
        contactEmail: workspaces.contactEmail,
        defaultCurrency: workspaces.defaultCurrency,
        defaultEmailSignature: workspaces.defaultEmailSignature,
        defaultQuoteNotes: workspaces.defaultQuoteNotes,
        aiTonePreference: workspaces.aiTonePreference,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: inquiries.id,
        workspaceInquiryFormId: inquiries.workspaceInquiryFormId,
        inquiryFormName: workspaceInquiryForms.name,
        inquiryFormSlug: workspaceInquiryForms.slug,
        inquiryFormBusinessType: workspaceInquiryForms.businessType,
        publicInquiryEnabled: workspaceInquiryForms.publicInquiryEnabled,
        inquiryPageConfig: workspaceInquiryForms.inquiryPageConfig,
        customerName: inquiries.customerName,
        customerEmail: inquiries.customerEmail,
        customerPhone: inquiries.customerPhone,
        companyName: inquiries.companyName,
        serviceCategory: inquiries.serviceCategory,
        requestedDeadline: inquiries.requestedDeadline,
        budgetText: inquiries.budgetText,
        subject: inquiries.subject,
        details: inquiries.details,
        source: inquiries.source,
        status: inquiries.status,
        submittedAt: inquiries.submittedAt,
        createdAt: inquiries.createdAt,
        submittedFieldSnapshot: inquiries.submittedFieldSnapshot,
      })
      .from(inquiries)
      .innerJoin(
        workspaceInquiryForms,
        eq(inquiries.workspaceInquiryFormId, workspaceInquiryForms.id),
      )
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.workspaceId, workspaceId)))
      .limit(1),
    db
      .select({
        id: inquiryNotes.id,
        body: inquiryNotes.body,
        createdAt: inquiryNotes.createdAt,
        authorName: user.name,
      })
      .from(inquiryNotes)
      .leftJoin(user, eq(inquiryNotes.authorUserId, user.id))
      .where(
        and(
          eq(inquiryNotes.workspaceId, workspaceId),
          eq(inquiryNotes.inquiryId, inquiryId),
        ),
      )
      .orderBy(desc(inquiryNotes.createdAt))
      .limit(6),
    buildWorkspaceKnowledgeContext(workspaceId),
  ]);

  const workspace = workspaceRow[0];
  const inquiry = inquiryRow[0];

  if (!workspace || !inquiry) {
    return null;
  }

  const inquiryPageConfig = getNormalizedInquiryPageConfig(
    inquiry.inquiryPageConfig,
    {
      workspaceName: workspace.name,
      workspaceShortDescription: workspace.shortDescription,
      businessType: inquiry.inquiryFormBusinessType,
    },
  );

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      shortDescription: workspace.shortDescription,
      contactEmail: workspace.contactEmail,
      defaultCurrency: workspace.defaultCurrency,
      defaultEmailSignature: workspace.defaultEmailSignature,
      defaultQuoteNotes: workspace.defaultQuoteNotes,
      aiTonePreference: workspace.aiTonePreference,
      inquiryPageHeadline: inquiryPageConfig.headline,
      inquiryPageTemplate: inquiryPageConfig.template,
      publicInquiryEnabled: inquiry.publicInquiryEnabled,
    },
    inquiry: {
      ...inquiry,
      submittedFieldSnapshot: getNormalizedInquirySubmittedFieldSnapshot(
        inquiry.submittedFieldSnapshot,
      ),
    },
    notes,
    knowledge,
  };
}
