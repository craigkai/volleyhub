-- Create function to send push notifications for round updates
CREATE OR REPLACE FUNCTION notify_round_updates()
RETURNS TRIGGER AS $$
DECLARE
    team1_name TEXT;
    team2_name TEXT;
    ref_name TEXT;
    event_id TEXT;
BEGIN
    -- Only trigger on round updates (when round changes from null to a value)
    IF OLD.round IS NULL AND NEW.round IS NOT NULL THEN

        -- Get team names and event info
        SELECT t1.name, t2.name, tr.name, e.id::text
        INTO team1_name, team2_name, ref_name, event_id
        FROM teams t1, teams t2, teams tr, events e
        WHERE t1.id = NEW.team1
        AND t2.id = NEW.team2
        AND tr.id = NEW.referee_id
        AND e.id = NEW.event_id;

        -- Notify team1 players
        IF team1_name IS NOT NULL THEN
            PERFORM net.http_post(
                url := 'https://your-project-ref.supabase.co/functions/v1/send-push-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || 'your-anon-key'
                ),
                body := jsonb_build_object(
                    'eventId', event_id,
                    'teamName', team1_name,
                    'round', NEW.round,
                    'action', 'round_assigned',
                    'isRef', false
                )
            );
        END IF;

        -- Notify team2 players
        IF team2_name IS NOT NULL THEN
            PERFORM net.http_post(
                url := 'https://your-project-ref.supabase.co/functions/v1/send-push-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || 'your-anon-key'
                ),
                body := jsonb_build_object(
                    'eventId', event_id,
                    'teamName', team2_name,
                    'round', NEW.round,
                    'action', 'round_assigned',
                    'isRef', false
                )
            );
        END IF;

        -- Notify referee
        IF ref_name IS NOT NULL THEN
            PERFORM net.http_post(
                url := 'https://your-project-ref.supabase.co/functions/v1/send-push-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || 'your-anon-key'
                ),
                body := jsonb_build_object(
                    'eventId', event_id,
                    'teamName', ref_name,
                    'round', NEW.round,
                    'action', 'ref_assigned',
                    'isRef', true
                )
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on matches table
DROP TRIGGER IF EXISTS trigger_notify_round_updates ON matches;
CREATE TRIGGER trigger_notify_round_updates
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION notify_round_updates();

-- Alternative: Create a simpler function that can be called manually
CREATE OR REPLACE FUNCTION send_round_notifications(
    p_event_id UUID,
    p_round INTEGER
)
RETURNS TABLE(team_name TEXT, notification_sent BOOLEAN) AS $$
DECLARE
    match_record RECORD;
    team1_name TEXT;
    team2_name TEXT;
    ref_name TEXT;
BEGIN
    -- Get all matches for this round
    FOR match_record IN
        SELECT m.*, t1.name as t1_name, t2.name as t2_name, tr.name as ref_name
        FROM matches m
        LEFT JOIN teams t1 ON t1.id = m.team1
        LEFT JOIN teams t2 ON t2.id = m.team2
        LEFT JOIN teams tr ON tr.id = m.referee_id
        WHERE m.event_id = p_event_id AND m.round = p_round
    LOOP
        -- Return results for team1
        IF match_record.t1_name IS NOT NULL THEN
            team_name := match_record.t1_name;
            notification_sent := true;
            RETURN NEXT;
        END IF;

        -- Return results for team2
        IF match_record.t2_name IS NOT NULL THEN
            team_name := match_record.t2_name;
            notification_sent := true;
            RETURN NEXT;
        END IF;

        -- Return results for referee
        IF match_record.ref_name IS NOT NULL THEN
            team_name := match_record.ref_name;
            notification_sent := true;
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;