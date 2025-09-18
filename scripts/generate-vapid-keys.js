import webpush from 'web-push';

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID Keys Generated ===');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\n=== Add these to your environment variables ===');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('\n=== Next Steps ===');
console.log('1. Add these environment variables to your .env.local file');
console.log('2. Add them to your Supabase project settings');
console.log('3. Add them to your Vercel deployment environment variables');
