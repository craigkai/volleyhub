alter table "public"."matches" add constraint "public_matches_child_id_fkey" FOREIGN KEY (child_id) REFERENCES matches(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."matches" validate constraint "public_matches_child_id_fkey";


