import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { activityLogs, knowledgeFaqs, knowledgeFiles } from "@/lib/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  KnowledgeFaqInput,
  KnowledgeFileUploadInput,
} from "@/features/knowledge/schemas";
import { knowledgeFilesBucket } from "@/features/knowledge/schemas";
import {
  deriveKnowledgeTitle,
  inferKnowledgeFileContentType,
  normalizeExtractedKnowledgeText,
  sanitizeKnowledgeFileName,
} from "@/features/knowledge/utils";

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

type UploadKnowledgeFileForWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  knowledgeFile: KnowledgeFileUploadInput;
};

export async function uploadKnowledgeFileForWorkspace({
  workspaceId,
  actorUserId,
  knowledgeFile,
}: UploadKnowledgeFileForWorkspaceInput) {
  const fileId = createId("kfile");
  const now = new Date();
  const file = knowledgeFile.file;
  const derivedTitle = knowledgeFile.title ?? deriveKnowledgeTitle(file.name);
  const title = derivedTitle.trim() || "Knowledge file";
  const contentType = inferKnowledgeFileContentType(file);
  const extractedText = normalizeExtractedKnowledgeText(await file.text());

  if (!extractedText) {
    throw new Error("Upload a file with readable text content.");
  }

  const storagePath = `${workspaceId}/${fileId}/${sanitizeKnowledgeFileName(
    file.name,
  )}`;
  const supabaseAdminClient = createSupabaseAdminClient();
  const { error: uploadError } = await supabaseAdminClient.storage
    .from(knowledgeFilesBucket)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload knowledge file: ${uploadError.message}`);
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(knowledgeFiles).values({
        id: fileId,
        workspaceId,
        title,
        fileName: file.name,
        contentType,
        fileSize: file.size,
        storagePath,
        extractedText,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(activityLogs).values({
        id: createId("act"),
        workspaceId,
        actorUserId,
        type: "knowledge.file_uploaded",
        summary: `Knowledge file ${title} uploaded.`,
        metadata: {
          knowledgeFileId: fileId,
          fileName: file.name,
          contentType,
        },
        createdAt: now,
        updatedAt: now,
      });
    });
  } catch (error) {
    const { error: cleanupError } = await supabaseAdminClient.storage
      .from(knowledgeFilesBucket)
      .remove([storagePath]);

    if (cleanupError) {
      console.error(
        "Failed to clean up uploaded knowledge file after a database error.",
        cleanupError,
      );
    }

    throw error;
  }

  return {
    id: fileId,
    title,
  };
}

type DeleteKnowledgeFileForWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  knowledgeFileId: string;
};

export async function deleteKnowledgeFileForWorkspace({
  workspaceId,
  actorUserId,
  knowledgeFileId,
}: DeleteKnowledgeFileForWorkspaceInput) {
  const now = new Date();
  const deletedFile = await db.transaction(async (tx) => {
    const [targetFile] = await tx
      .select({
        id: knowledgeFiles.id,
        title: knowledgeFiles.title,
        fileName: knowledgeFiles.fileName,
        storagePath: knowledgeFiles.storagePath,
      })
      .from(knowledgeFiles)
      .where(
        and(
          eq(knowledgeFiles.workspaceId, workspaceId),
          eq(knowledgeFiles.id, knowledgeFileId),
        ),
      )
      .limit(1);

    if (!targetFile) {
      return null;
    }

    await tx
      .delete(knowledgeFiles)
      .where(
        and(
          eq(knowledgeFiles.workspaceId, workspaceId),
          eq(knowledgeFiles.id, knowledgeFileId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "knowledge.file_deleted",
      summary: `Knowledge file ${targetFile.title} deleted.`,
      metadata: {
        knowledgeFileId,
        fileName: targetFile.fileName,
      },
      createdAt: now,
      updatedAt: now,
    });

    return targetFile;
  });

  if (!deletedFile) {
    return null;
  }

  const supabaseAdminClient = createSupabaseAdminClient();
  const { error: cleanupError } = await supabaseAdminClient.storage
    .from(knowledgeFilesBucket)
    .remove([deletedFile.storagePath]);

  if (cleanupError) {
    console.error(
      "Failed to remove a deleted knowledge file from storage.",
      cleanupError,
    );
  }

  return deletedFile;
}

type CreateKnowledgeFaqForWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  faq: KnowledgeFaqInput;
};

export async function createKnowledgeFaqForWorkspace({
  workspaceId,
  actorUserId,
  faq,
}: CreateKnowledgeFaqForWorkspaceInput) {
  const faqId = createId("faq");
  const now = new Date();

  return db.transaction(async (tx) => {
    const [latestFaq] = await tx
      .select({
        position: knowledgeFaqs.position,
      })
      .from(knowledgeFaqs)
      .where(eq(knowledgeFaqs.workspaceId, workspaceId))
      .orderBy(desc(knowledgeFaqs.position), desc(knowledgeFaqs.createdAt))
      .limit(1);
    const nextPosition = (latestFaq?.position ?? -1) + 1;

    await tx.insert(knowledgeFaqs).values({
      id: faqId,
      workspaceId,
      question: faq.question,
      answer: faq.answer,
      position: nextPosition,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "knowledge.faq_created",
      summary: "FAQ added to the workspace knowledge base.",
      metadata: {
        knowledgeFaqId: faqId,
        question: faq.question,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: faqId,
    };
  });
}

type UpdateKnowledgeFaqForWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  knowledgeFaqId: string;
  faq: KnowledgeFaqInput;
};

export async function updateKnowledgeFaqForWorkspace({
  workspaceId,
  actorUserId,
  knowledgeFaqId,
  faq,
}: UpdateKnowledgeFaqForWorkspaceInput) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existingFaq] = await tx
      .select({
        id: knowledgeFaqs.id,
      })
      .from(knowledgeFaqs)
      .where(
        and(
          eq(knowledgeFaqs.workspaceId, workspaceId),
          eq(knowledgeFaqs.id, knowledgeFaqId),
        ),
      )
      .limit(1);

    if (!existingFaq) {
      return null;
    }

    await tx
      .update(knowledgeFaqs)
      .set({
        question: faq.question,
        answer: faq.answer,
        updatedAt: now,
      })
      .where(
        and(
          eq(knowledgeFaqs.workspaceId, workspaceId),
          eq(knowledgeFaqs.id, knowledgeFaqId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "knowledge.faq_updated",
      summary: "FAQ updated in the workspace knowledge base.",
      metadata: {
        knowledgeFaqId,
        question: faq.question,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: knowledgeFaqId,
    };
  });
}

type DeleteKnowledgeFaqForWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  knowledgeFaqId: string;
};

export async function deleteKnowledgeFaqForWorkspace({
  workspaceId,
  actorUserId,
  knowledgeFaqId,
}: DeleteKnowledgeFaqForWorkspaceInput) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existingFaq] = await tx
      .select({
        id: knowledgeFaqs.id,
        question: knowledgeFaqs.question,
      })
      .from(knowledgeFaqs)
      .where(
        and(
          eq(knowledgeFaqs.workspaceId, workspaceId),
          eq(knowledgeFaqs.id, knowledgeFaqId),
        ),
      )
      .limit(1);

    if (!existingFaq) {
      return null;
    }

    await tx
      .delete(knowledgeFaqs)
      .where(
        and(
          eq(knowledgeFaqs.workspaceId, workspaceId),
          eq(knowledgeFaqs.id, knowledgeFaqId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "knowledge.faq_deleted",
      summary: "FAQ removed from the workspace knowledge base.",
      metadata: {
        knowledgeFaqId,
        question: existingFaq.question,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: knowledgeFaqId,
    };
  });
}
