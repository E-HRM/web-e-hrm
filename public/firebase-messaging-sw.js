/* eslint-disable no-undef */
// Import a different version of Firebase that is compatible with service workers
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/**
 * Handle background messages.
 * This is triggered when the app is in the background or closed.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico', // You can use your app's icon here
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});