// VolleyHub Service Worker for Push Notifications
const CACHE_NAME = 'volleyhub-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  let notificationData = {
    title: '🏐 VolleyHub',
    body: 'You have a tournament update!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();

      notificationData = {
        title: pushData.headings?.en || '🏐 VolleyHub Tournament Update',
        body: pushData.contents?.en || 'You have a tournament update!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        data: pushData.data || {}
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show the notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      requireInteraction: false,
      actions: []
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  // Handle notification click
  const clickAction = () => {
    if (event.notification.data && event.notification.data.url) {
      // Open the specific URL from the notification data
      return clients.openWindow(event.notification.data.url);
    } else {
      // Default: open the main app
      return clients.openWindow('/');
    }
  };

  event.waitUntil(clickAction());
});

// Background sync (optional)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
});