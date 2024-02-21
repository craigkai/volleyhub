set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."setMatchState"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  UPDATE your_table
  SET state = CASE
    WHEN team1_score IS NOT NULL AND team2_score IS NOT NULL THEN 'completed'
    ELSE 'incompleted'
  END;
END;$function$
;

CREATE TRIGGER "onMatchUpdateSetSate" AFTER INSERT OR UPDATE ON public.matches FOR EACH STATEMENT EXECUTE FUNCTION "setMatchState"();


