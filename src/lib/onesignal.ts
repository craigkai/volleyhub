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

  return new Promise((resolve) => {
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
    }

    window.OneSignalDeferred.push(async function(OneSignal: any) {
      if (!oneSignalInitialized) {
        await OneSignal.init({
          appId: "4327f5d8-8fdc-47cd-88e4-4f29cb648f21",
          allowLocalhostAsSecureOrigin: true, // For development
        });
        oneSignalInitialized = true;
      }
      resolve(OneSignal);
    });
  });
}

export async function subscribeToNotifications(userId: string, eventId: string, teamId: string): Promise<void> {
  const OneSignal = await initializeOneSignal();

  // Request permission
  const permission = await OneSignal.Notifications.requestPermission();
  if (!permission) {
    throw new Error('Notification permission denied');
  }

  // Set external user ID for targeting
  await OneSignal.login(userId);

  // Add tags for targeting specific teams/events (matching existing system)
  await OneSignal.User.addTags({
    eventId: eventId,
    selectedTeam: teamId,
    subscription_type: 'team_notifications'
  });
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