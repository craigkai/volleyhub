alter table "public"."matches" drop constraint "matches_team1_fkey";

alter table "public"."matches" drop constraint "matches_team2_fkey";

alter table "public"."matches" add constraint "matches_team1_fkey" FOREIGN KEY (team1) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_team1_fkey";

alter table "public"."matches" add constraint "matches_team2_fkey" FOREIGN KEY (team2) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_team2_fkey";


