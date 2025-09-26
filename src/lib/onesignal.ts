// OneSignal initialization and utilities
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: Array<(OneSignal: any) => void>;
  }
}

let oneSignalInitialized = false;

export async function initializeOneSignal(): Promise<any> {
  if (oneSignalInitialized && window.OneSignal) {
    return window.OneSignal;
  }

  return new Promise((resolve, reject) => {
    // Check if OneSignal script is loaded
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

    // Wait for OneSignal to be available
    const checkOneSignal = () => {
      if (window.OneSignal) {
        // OneSignal is already loaded, initialize directly
        if (!oneSignalInitialized) {
          window.OneSignal.init({
            appId: "4327f5d8-8fdc-47cd-88e4-4f29cb648f21",
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: 'OneSignalSDKWorker.js'
          }).then(() => {
            oneSignalInitialized = true;
            resolve(window.OneSignal);
          }).catch(reject);
        } else {
          resolve(window.OneSignal);
        }
      } else if (window.OneSignalDeferred) {
        // OneSignal script is loading, use deferred
        window.OneSignalDeferred.push(async function(OneSignal: any) {
          try {
            if (!oneSignalInitialized) {
              await OneSignal.init({
                appId: "4327f5d8-8fdc-47cd-88e4-4f29cb648f21",
                allowLocalhostAsSecureOrigin: true,
                serviceWorkerPath: 'OneSignalSDKWorker.js'
              });
              oneSignalInitialized = true;
            }
            resolve(OneSignal);
          } catch (error) {
            reject(error);
          }
        });
      } else {
        // OneSignal script hasn't loaded yet, wait a bit
        setTimeout(checkOneSignal, 100);
      }
    };

    // Initialize OneSignalDeferred if it doesn't exist
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
    }

    checkOneSignal();

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('OneSignal initialization timeout'));
    }, 10000);
  });
}

export async function subscribeToNotifications(userId: string, eventId: string, teamId: string): Promise<void> {
  console.log('subscribeToNotifications called with:', { userId, eventId, teamId });
  const OneSignal = await initializeOneSignal();

  console.log('Requesting notification permission...');
  // Request permission
  const permission = await OneSignal.Notifications.requestPermission();
  console.log('Permission result:', permission);

  if (!permission) {
    throw new Error('Notification permission denied');
  }

  console.log('Logging in user:', userId);
  // Set external user ID for targeting
  await OneSignal.login(userId);

  console.log('Adding tags:', { eventId, selectedTeam: teamId, subscription_type: 'team_notifications' });
  // Add tags for targeting specific teams/events (matching existing system)
  await OneSignal.User.addTags({
    eventId: eventId,
    selectedTeam: teamId,
    subscription_type: 'team_notifications'
  });

  console.log('OneSignal subscription completed successfully');
}

export async function unsubscribeFromNotifications(): Promise<void> {
  const OneSignal = await initializeOneSignal();

  // Remove all tags (matching existing system)
  await OneSignal.User.removeTag('eventId');
  await OneSignal.User.removeTag('selectedTeam');
  await OneSignal.User.removeTag('subscription_type');

  // Optionally logout user
  await OneSignal.logout();
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const OneSignal = await initializeOneSignal();
    const permission = await OneSignal.Notifications.permission;
    return permission === 'granted';
  } catch {
    return false;
  }
}