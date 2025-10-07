"use client";

import Image from "next/image";
import { LogoutOutlined } from "@ant-design/icons";

export default function Header({
  userLabel = "Admin",
  avatarSrc = "/logo-burung.png",
  onLogout,
}) {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-800">{userLabel}</span>

          <Image
            src={avatarSrc}
            alt="User avatar"
            width={28}
            height={28}
            className="rounded-full ring-1 ring-gray-200"
            priority
          />

          <button
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className="grid place-items-center rounded-md p-1 hover:bg-red-50 transition"
          >
            <LogoutOutlined className="text-red-600 text-lg" />
          </button>
        </div>
      </div>
    </header>
  );
}
