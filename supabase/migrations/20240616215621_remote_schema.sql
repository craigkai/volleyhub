create type "public"."matchstate" as enum ('INCOMPLETE', 'COMPLETE');

alter table "public"."matches" alter column "state" set default 'INCOMPLETE'::matchstate;

alter table "public"."matches" alter column "state" set data type matchstate using "state"::text::matchstate;

drop type "public"."MatchState";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_match_state()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Check if the state is different
    IF (SELECT state FROM matches WHERE id = NEW.id) IS DISTINCT FROM
       (SELECT CASE
                  WHEN (NEW.team1_score IS NOT NULL AND NEW.team2_score IS NOT NULL) THEN 'COMPLETE'::matchstate
                  ELSE 'INCOMPLETE'::matchstate
              END)
    THEN
        -- Update the state
        UPDATE matches
        SET state = CASE 
                        WHEN NEW.state = 'COMPLETE'::matchstate THEN 'INCOMPLETE'::matchstate 
                        ELSE 'COMPLETE'::matchstate 
                    END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;$function$
;


