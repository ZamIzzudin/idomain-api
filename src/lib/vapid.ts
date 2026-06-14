import webpush from "web-push";
import { config } from "../config";

let initialized = false;

export function initWebPush() {
  if (initialized) return;
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn(
      "VAPID keys not configured. Push notifications will not work. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env"
    );
    return;
  }

  webpush.setVapidDetails(
    config.vapidSubject,
    config.vapidPublicKey,
    config.vapidPrivateKey
  );
  initialized = true;
}

export function getVapidPublicKey(): string {
  return config.vapidPublicKey;
}

export function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: object
) {
  initWebPush();

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload)
  );
}
