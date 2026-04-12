alter type "public"."business_member_role" rename value 'member' to 'staff';

alter type "public"."business_member_role" add value if not exists 'manager' after 'owner';

create table "business_member_invites" (
  "id" text primary key not null,
  "business_id" text not null,
  "inviter_user_id" text not null,
  "email" text not null,
  "role" "public"."business_member_role" default 'staff' not null,
  "token" text not null,
  "expires_at" timestamp with time zone not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "business_member_invites_business_id_businesses_id_fk"
    foreign key ("business_id") references "public"."businesses"("id")
    on delete cascade on update no action,
  constraint "business_member_invites_inviter_user_id_user_id_fk"
    foreign key ("inviter_user_id") references "public"."user"("id")
    on delete cascade on update no action
);

create unique index "business_member_invites_token_unique"
  on "business_member_invites" using btree ("token");

create unique index "business_member_invites_business_email_unique"
  on "business_member_invites" using btree ("business_id", "email");

create index "business_member_invites_business_id_idx"
  on "business_member_invites" using btree ("business_id");

create index "business_member_invites_email_idx"
  on "business_member_invites" using btree ("email");

create index "business_member_invites_expires_at_idx"
  on "business_member_invites" using btree ("expires_at");
