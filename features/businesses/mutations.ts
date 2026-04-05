import "server-only";

import { eq } from "drizzle-orm";

import type { BusinessType } from "@/features/inquiries/business-types";
import { createInquiryFormPreset } from "@/features/inquiries/inquiry-forms";
import { createInquiryFormConfigDefaults } from "@/features/inquiries/form-config";
import { createInquiryPageConfigDefaults } from "@/features/inquiries/page-config";
import { ensureProfileForUser } from "@/lib/auth/business-bootstrap";
import { db } from "@/lib/db/client";
import {
  activityLogs,
  businessInquiryForms,
  businessMembers,
  businesses,
} from "@/lib/db/schema";
import { appendRandomSlugSuffix, slugifyPublicName } from "@/lib/slugs";

type CreateBusinessForUserInput = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  businessType: BusinessType;
};

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function getAvailableBusinessSlug(baseSlug: string) {
  let candidate = baseSlug;

  while (true) {
    const [existingBusiness] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, candidate))
      .limit(1);

    if (!existingBusiness) {
      return candidate;
    }

    candidate = appendRandomSlugSuffix(baseSlug, {
      fallback: "business",
    });
  }
}

export async function createBusinessForUser({
  user,
  name,
  businessType,
}: CreateBusinessForUserInput) {
  const trimmedName = name.trim();
  const now = new Date();
  const slug = await getAvailableBusinessSlug(
    slugifyPublicName(trimmedName, {
      fallback: "business",
    }),
  );
  const businessId = createId("biz");
  const defaultInquiryForm = createInquiryFormPreset({
    businessType,
    businessName: trimmedName,
  });

  await ensureProfileForUser(user);

  await db.transaction(async (tx) => {
    await tx.insert(businesses).values({
      id: businessId,
      name: trimmedName,
      slug,
      businessType,
      contactEmail: user.email,
      inquiryFormConfig: createInquiryFormConfigDefaults({
        businessType,
      }),
      inquiryPageConfig: createInquiryPageConfigDefaults({
        businessName: trimmedName,
        businessType,
      }),
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(businessInquiryForms).values({
      id: createId("ifm"),
      businessId,
      name: defaultInquiryForm.name,
      slug: defaultInquiryForm.slug,
      businessType: defaultInquiryForm.businessType,
      isDefault: true,
      publicInquiryEnabled: defaultInquiryForm.publicInquiryEnabled,
      inquiryFormConfig: defaultInquiryForm.inquiryFormConfig,
      inquiryPageConfig: defaultInquiryForm.inquiryPageConfig,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(businessMembers).values({
      id: createId("bm"),
      businessId,
      userId: user.id,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      businessId,
      actorUserId: user.id,
      type: "business.created",
      summary: "Business created.",
      metadata: {
        source: "business-hub",
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    id: businessId,
    slug,
  };
}
