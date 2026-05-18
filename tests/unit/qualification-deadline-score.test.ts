import { describe, expect, it } from "vitest";

import { computeDeadlineScore } from "@/features/inquiries/qualification/scoring";

describe("features/inquiries/qualification/scoring - computeDeadlineScore", () => {
  const submittedAt = new Date("2025-01-15T12:00:00.000Z");

  it("returns 0 points with null reason when deadline is null", () => {
    const result = computeDeadlineScore(null, submittedAt);
    expect(result.signal).toBe("deadline_urgency");
    expect(result.points).toBe(0);
    expect(result.maxPoints).toBe(25);
    expect(result.reason).toBeNull();
  });

  it("returns 25 points when deadline is within 7 days", () => {
    // 5 days away
    const result = computeDeadlineScore("2025-01-20", submittedAt);
    expect(result.points).toBe(25);
  });

  it("returns 25 points when deadline is exactly 7 days away", () => {
    const result = computeDeadlineScore("2025-01-22", submittedAt);
    expect(result.points).toBe(25);
  });

  it("returns 20 points when deadline is 8 days away", () => {
    const result = computeDeadlineScore("2025-01-23", submittedAt);
    expect(result.points).toBe(20);
  });

  it("returns 20 points when deadline is 14 days away", () => {
    const result = computeDeadlineScore("2025-01-29", submittedAt);
    expect(result.points).toBe(20);
  });

  it("returns 15 points when deadline is 15 days away", () => {
    const result = computeDeadlineScore("2025-01-30", submittedAt);
    expect(result.points).toBe(15);
  });

  it("returns 15 points when deadline is 30 days away", () => {
    const result = computeDeadlineScore("2025-02-14", submittedAt);
    expect(result.points).toBe(15);
  });

  it("returns 8 points when deadline is 31 days away", () => {
    const result = computeDeadlineScore("2025-02-15", submittedAt);
    expect(result.points).toBe(8);
  });

  it("returns 8 points when deadline is 60 days away", () => {
    const result = computeDeadlineScore("2025-03-16", submittedAt);
    expect(result.points).toBe(8);
  });

  it("returns 3 points when deadline is 61 days away", () => {
    const result = computeDeadlineScore("2025-03-17", submittedAt);
    expect(result.points).toBe(3);
  });

  it("returns 25 points when deadline is same day as submission", () => {
    const result = computeDeadlineScore("2025-01-15", submittedAt);
    expect(result.points).toBe(25);
  });

  it("always returns maxPoints of 25", () => {
    const result = computeDeadlineScore("2025-06-01", submittedAt);
    expect(result.maxPoints).toBe(25);
  });

  it("includes a descriptive reason when deadline is present", () => {
    const result = computeDeadlineScore("2025-01-20", submittedAt);
    expect(result.reason).toContain("days");
  });
});
