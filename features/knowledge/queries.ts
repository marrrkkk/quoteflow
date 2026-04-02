import "server-only";

import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { knowledgeFaqs, knowledgeFiles } from "@/lib/db/schema";
import type {
  DashboardKnowledgeData,
  WorkspaceKnowledgeContext,
} from "@/features/knowledge/types";
import {
  buildWorkspaceKnowledgeCombinedText,
  normalizeExtractedKnowledgeText,
} from "@/features/knowledge/utils";

export async function getKnowledgeDashboardData(
  workspaceId: string,
): Promise<DashboardKnowledgeData> {
  const [files, faqs] = await Promise.all([
    db
      .select({
        id: knowledgeFiles.id,
        title: knowledgeFiles.title,
        fileName: knowledgeFiles.fileName,
        contentType: knowledgeFiles.contentType,
        fileSize: knowledgeFiles.fileSize,
        extractedText: knowledgeFiles.extractedText,
        createdAt: knowledgeFiles.createdAt,
      })
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.workspaceId, workspaceId))
      .orderBy(desc(knowledgeFiles.createdAt)),
    db
      .select({
        id: knowledgeFaqs.id,
        question: knowledgeFaqs.question,
        answer: knowledgeFaqs.answer,
        position: knowledgeFaqs.position,
        createdAt: knowledgeFaqs.createdAt,
        updatedAt: knowledgeFaqs.updatedAt,
      })
      .from(knowledgeFaqs)
      .where(eq(knowledgeFaqs.workspaceId, workspaceId))
      .orderBy(asc(knowledgeFaqs.position), asc(knowledgeFaqs.createdAt)),
  ]);

  return {
    files,
    faqs,
  };
}

export async function buildWorkspaceKnowledgeContext(
  workspaceId: string,
): Promise<WorkspaceKnowledgeContext> {
  const [faqs, fileRows] = await Promise.all([
    db
      .select({
        id: knowledgeFaqs.id,
        question: knowledgeFaqs.question,
        answer: knowledgeFaqs.answer,
        position: knowledgeFaqs.position,
      })
      .from(knowledgeFaqs)
      .where(eq(knowledgeFaqs.workspaceId, workspaceId))
      .orderBy(asc(knowledgeFaqs.position), asc(knowledgeFaqs.createdAt)),
    db
      .select({
        id: knowledgeFiles.id,
        title: knowledgeFiles.title,
        fileName: knowledgeFiles.fileName,
        contentType: knowledgeFiles.contentType,
        createdAt: knowledgeFiles.createdAt,
        extractedText: knowledgeFiles.extractedText,
      })
      .from(knowledgeFiles)
      .where(
        and(
          eq(knowledgeFiles.workspaceId, workspaceId),
          isNotNull(knowledgeFiles.extractedText),
        ),
      )
      .orderBy(desc(knowledgeFiles.createdAt)),
  ]);

  const files = fileRows
    .map((file) => ({
      ...file,
      extractedText: normalizeExtractedKnowledgeText(file.extractedText ?? ""),
    }))
    .filter((file) => Boolean(file.extractedText));

  return {
    faqs,
    files,
    combinedText: buildWorkspaceKnowledgeCombinedText(faqs, files),
  };
}
