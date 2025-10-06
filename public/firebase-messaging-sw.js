// Scripts for firebase and firebase messaging
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBHaHOsrtZghC2JAeP53-rtg9gUKUmmMcM',
  authDomain: 'e-hrm-2d3fe.firebaseapp.com',
  projectId: 'e-hrm-2d3fe',
  storageBucket: 'e-hrm-2d3fe.firebasestorage.app',
  messagingSenderId: '584929841793',
  appId: '1:584929841793:web:1a1cff15646de867067380',
  measurementId: 'G-K58K7RVTHS',
};

// Initialize the Firebase app in the service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Handle background messages.
 * This is triggered when the app is in the background or closed.
 */
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico', // You can use your app's icon here
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
