import { z } from "zod";

export const memoryMaxTitleLength = 200;
export const memoryMaxContentLength = 4000;

export const memorySchema = z.object({
  title: z
    .string()
    .min(1, "Enter a title.")
    .max(memoryMaxTitleLength, `Keep the title under ${memoryMaxTitleLength} characters.`),
  content: z
    .string()
    .min(1, "Add some content.")
    .max(memoryMaxContentLength, `Keep the content under ${memoryMaxContentLength} characters.`),
});

export const memoryIdSchema = z.string().min(1, "That memory could not be found.");

export type MemoryInput = z.infer<typeof memorySchema>;
