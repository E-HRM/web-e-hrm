'use client';

<<<<<<< HEAD
import { ConfigProvider, App as AntdApp } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const BRAND = {
  primary: "#0A3848",
  primaryHover: "#0D4A5E",
  primaryActive: "#072B37",
  accent: "#D9A96F",
  accentHover: "#C08C55",
  accentActive: "#A97C3E",
};

export default function LayoutClient({ children }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: BRAND.primary,
            colorPrimaryHover: BRAND.primaryHover,
            colorPrimaryActive: BRAND.primaryActive,
            colorLink: BRAND.accent,
            colorLinkHover: BRAND.accentHover,
            colorLinkActive: BRAND.accentActive,
            borderRadius: 8,
            fontSize: 14,
          },
          components: {
            Button: { controlHeight: 44 },
            Input: { controlHeight: 44 },
            Checkbox: {
              colorPrimary: BRAND.accent,
              colorPrimaryHover: BRAND.accentHover,
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </AntdRegistry>
=======
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import AuthWrapper from './utils/auth/authWrapper';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { requestPermissionAndGetToken } from './utils/firebase/firebase';

export default function LayoutClient({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const registerFirebaseMessaging = async () => {
      if (!('serviceWorker' in navigator)) {
        console.warn('[LayoutClient] Service workers are not supported in this browser.');
        return;
      }

      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await requestPermissionAndGetToken();
      } catch (error) {
        console.error('[LayoutClient] Failed to register Firebase messaging service worker.', error);
      }
    };

    registerFirebaseMessaging();
  }, []);

  return (
    <SessionProvider>
      <AuthWrapper>
        <AntdRegistry>{children}</AntdRegistry>
      </AuthWrapper>
    </SessionProvider>
>>>>>>> branch-dewa-adit
  );
}
