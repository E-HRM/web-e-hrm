"use client";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-6">
      <div className="mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center justify-center">
        <span className="text-xs text-gray-600">OSS @ {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
