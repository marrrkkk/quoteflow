import { describe, expect, it } from "vitest";

import { computePricingMatchScore } from "@/features/inquiries/qualification/scoring";
import type { QuoteLibraryMatchInput } from "@/features/inquiries/qualification/types";

describe("features/inquiries/qualification/scoring - computePricingMatchScore", () => {
  it("returns 0 points with null reason when quoteLibraryEntries is empty", () => {
    const result = computePricingMatchScore("Web Design", "I need a website", []);
    expect(result.signal).toBe("pricing_match");
    expect(result.points).toBe(0);
    expect(result.maxPoints).toBe(20);
    expect(result.reason).toBeNull();
  });

  it("returns 15 points when serviceCategory matches an entry name (case-insensitive)", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Web Design", itemDescriptions: ["landing page", "responsive layout"] },
      { name: "SEO Audit", itemDescriptions: ["keyword research", "site analysis"] },
    ];
    const result = computePricingMatchScore("web design", "I need a new website", entries);
    expect(result.points).toBe(15);
    expect(result.reason).toContain("matches pricing library entry");
  });

  it("category match is case-insensitive", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "seo audit", itemDescriptions: ["keyword research"] },
    ];
    const result = computePricingMatchScore("SEO Audit", "need seo help", entries);
    expect(result.points).toBe(15);
  });

  it("returns text overlap score when overlap exceeds 30%", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Logo Design", itemDescriptions: ["brand identity", "vector logo", "color palette"] },
    ];
    // serviceCategory + details has some overlap with entry text
    const result = computePricingMatchScore(
      "Branding",
      "I need a brand identity and logo design with color palette",
      entries,
    );
    // Should score > 0 due to token overlap
    expect(result.points).toBeGreaterThan(0);
    expect(result.points).toBeLessThanOrEqual(20);
  });

  it("returns 0 points when no category match and overlap is 30% or below", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Plumbing Repair", itemDescriptions: ["pipe fixing", "drain cleaning", "water heater installation"] },
    ];
    const result = computePricingMatchScore(
      "Web Development",
      "I need a React application built",
      entries,
    );
    expect(result.points).toBe(0);
  });

  it("takes the max of category match and text overlap, capped at 20", () => {
    // Entry where category matches AND there's high text overlap
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Web Design", itemDescriptions: ["web design responsive layout modern website"] },
    ];
    const result = computePricingMatchScore(
      "Web Design",
      "web design responsive layout modern website",
      entries,
    );
    // Category match = 15, text overlap should be high (possibly > 15)
    // Final should be max of both, capped at 20
    expect(result.points).toBeGreaterThanOrEqual(15);
    expect(result.points).toBeLessThanOrEqual(20);
  });

  it("caps the final score at 20 points", () => {
    // Create a scenario with 100% token overlap to get max text overlap score of 20
    const entries: QuoteLibraryMatchInput[] = [
      { name: "exact match", itemDescriptions: ["exact match"] },
    ];
    const result = computePricingMatchScore("exact match", "exact match", entries);
    expect(result.points).toBeLessThanOrEqual(20);
  });

  it("always returns maxPoints of 20", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Test", itemDescriptions: ["test"] },
    ];
    const result = computePricingMatchScore("Other", "something else", entries);
    expect(result.maxPoints).toBe(20);
  });

  it("text overlap score scales linearly between 5 and 20 for overlaps above 30%", () => {
    // At exactly 100% overlap, text overlap score should be 20
    // Use identical text for inquiry and entry to get 100% overlap
    const entries: QuoteLibraryMatchInput[] = [
      { name: "alpha beta gamma", itemDescriptions: [] },
    ];
    const result = computePricingMatchScore("alpha beta gamma", "", entries);
    // 100% overlap → score = 5 + (100-30)/70 * 15 = 5 + 15 = 20
    expect(result.points).toBe(20);
  });

  it("handles entries with empty itemDescriptions", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Photography", itemDescriptions: [] },
    ];
    const result = computePricingMatchScore("Photography", "event photos", entries);
    // Category match = 15, but text overlap is also high since "photography" token
    // is in both texts (100% overlap on the smaller set). max(15, 20) = 20, capped at 20.
    expect(result.points).toBe(20);
  });

  it("checks all entries and uses the highest overlap", () => {
    const entries: QuoteLibraryMatchInput[] = [
      { name: "Unrelated Service", itemDescriptions: ["completely different work"] },
      { name: "Web Development", itemDescriptions: ["react application frontend development"] },
    ];
    const result = computePricingMatchScore(
      "Frontend",
      "react application frontend development",
      entries,
    );
    // Should pick the higher overlap from the second entry
    expect(result.points).toBeGreaterThan(0);
  });
});
