import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  selected_team: string
  event_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { eventId, teamName, round, action, isRef = false } = await req.json()

    console.log('Sending push notifications for:', { eventId, teamName, round, action, isRef })

    if (!eventId || !teamName) {
      throw new Error('Missing required parameters: eventId and teamName')
    }

    // Get subscriptions for users with this team selected
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('event_id', eventId)
      .eq('selected_team', teamName)

    if (subscriptionsError) {
      throw subscriptionsError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for team:', teamName)
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare push notification payload
    const payload: PushPayload = {
      title: '🏐 VolleyHub Tournament Update',
      body: isRef
        ? `You're refereeing round ${round + 1}! Check your schedule.`
        : `${teamName} plays in round ${round + 1}! Get ready!`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: {
        eventId,
        teamName,
        round,
        action,
        isRef,
        url: `/events/${eventId}?team=${encodeURIComponent(teamName)}`
      }
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: PushSubscription) => {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${Deno.env.get('VAPID_PRIVATE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: subscription.endpoint.split('/').pop(), // Extract registration token
              notification: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon,
                badge: payload.badge,
                click_action: payload.data?.url
              },
              data: payload.data
            })
          })

          if (!response.ok) {
            // If subscription is invalid, remove it
            if (response.status === 410) {
              await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('id', subscription.id)
              console.log('Removed invalid subscription:', subscription.id)
            }
            throw new Error(`Push failed: ${response.status}`)
          }

          return { success: true, subscriptionId: subscription.id }
        } catch (error) {
          console.error('Failed to send push to subscription:', subscription.id, error)
          return { success: false, subscriptionId: subscription.id, error: error.message }
        }
      })
    )

    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        total: subscriptions.length,
        successful,
        failed,
        payload
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})