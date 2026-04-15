export type DashboardMemory = {
  id: string;
  title: string;
  content: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DashboardMemoryData = {
  memories: DashboardMemory[];
};

export type DashboardMemorySummary = {
  memoryCount: number;
  limit: number | null;
};

export type BusinessMemoryContext = {
  memories: { title: string; content: string }[];
  combinedText: string;
};

export type MemoryFieldErrors = Partial<
  Record<"title" | "content", string[] | undefined>
>;

export type MemoryActionState = {
  error?: string;
  success?: string;
  fieldErrors?: MemoryFieldErrors;
};

export type MemoryDeleteActionState = {
  error?: string;
};
