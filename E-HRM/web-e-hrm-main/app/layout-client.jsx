"use client";

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
  );
}
