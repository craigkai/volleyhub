-- Clean up old VAPID push notification system since we're using OneSignal now

-- Drop the push subscriptions table (OneSignal handles subscriptions)
DROP TABLE IF EXISTS push_subscriptions;

-- Remove VAPID-related secrets (keep OneSignal secrets)
-- Note: You'll need to manually remove these from Supabase secrets:
-- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT