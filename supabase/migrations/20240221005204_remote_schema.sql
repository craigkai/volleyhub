drop trigger if exists "onMatchUpdateSetSate" on "public"."matches";

drop function if exists "public"."setMatchState"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_match_state()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Check if the state is different
    IF (SELECT state FROM matches WHERE id = NEW.id) IS DISTINCT FROM
       (SELECT
         CASE
           WHEN (SELECT team1_score FROM matches WHERE id = NEW.id) IS NOT NULL AND (SELECT team2_score FROM matches WHERE id = NEW.id) IS NOT NULL THEN 'complete'
           ELSE 'incomplete'
         END)
    THEN
      -- Update the state
      BEGIN
        UPDATE matches
                SET state = CASE WHEN NEW.state = 'complete' THEN 'incomplete' ELSE 'complete' END
        WHERE id = NEW.id;
      END;
    END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER on_match_update_set_state AFTER UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION update_match_state();


