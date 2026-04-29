"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateWorkspaceForm } from "./create-workspace-form";

export function CreateWorkspaceDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusCircle data-icon="inline-start" />
            New workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>Create new workspace</DialogTitle>
          <DialogDescription>
            Create a separate workspace for a different team, client, or project.
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
