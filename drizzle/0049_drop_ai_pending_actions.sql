DROP TRIGGER IF EXISTS pending_actions_set_updated_at ON public.pending_actions;
--> statement-breakpoint
DROP TABLE IF EXISTS "pending_actions";
--> statement-breakpoint
DROP TYPE IF EXISTS "pending_action_status";
