'use client';

import React from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';

import NotificationContent from '@/app/(view)/home/notification/NotificationContent';

/* ======= Profile Dropdown ======= */
function ProfileDropdown({ onLogout }) {
  const { data: session } = useSession();

  const userId = session?.user?.id || session?.user?.id_user || session?.user?.idUser || null;

  const userName = session?.user?.name ?? 'User';
  const userRole = session?.user?.jabatan_name ?? session?.user?.role ?? '-';
  const userDepartment = session?.user?.departement_name ?? session?.user?.divisi ?? '-';
  const avatarSrc = session?.user?.image ?? session?.user?.foto_profil_user ?? null;

  const profileHref = userId ? `/home/kelola_karyawan/karyawan/${encodeURIComponent(userId)}` : '/home/profile';

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined className='text-gray-600' />,
      label: 'Profil Saya',
      href: profileHref,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined className='text-red-500' />,
      label: <span className='text-red-600'>Keluar</span>,
      danger: true,
      confirm: {
        title: 'Keluar dari akun?',
        content: 'Anda akan keluar dari sesi saat ini.',
        okText: 'Logout',
        cancelText: 'Batal',
        okType: 'danger',
      },
      onClick: onLogout,
    },
  ];

  return (
    <AppDropdown
      items={menuItems}
      placement='bottomRight'
      overlayClassName='profileDropdownOverlay'
      menuProps={{
        className: 'rounded-xl shadow-lg border border-gray-200 py-2',
      }}
    >
      <button
        type='button'
        className='flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200'
        aria-label='Buka menu pengguna'
      >
        <div className='relative'>
          <AppAvatar
            size={40}
            src={avatarSrc || undefined}
            alt={userName}
            name={userName}
            bordered
            showStatus
            status='online'
            className='border-2 border-white shadow-sm'
            icon={<UserOutlined />}
          />
        </div>

        <div className='hidden lg:block text-left'>
          <div className='font-semibold text-gray-900 text-sm leading-tight'>{userName}</div>
          <div className='text-gray-500 text-xs leading-tight'>
            {userRole} <span className='text-gray-400'>|</span> {userDepartment}
          </div>
        </div>

        <DownOutlined className='text-gray-400 text-xs' />

        <style
          jsx
          global
        >{`
          .profileDropdownOverlay {
            min-width: 240px;
          }
        `}</style>
      </button>
    </AppDropdown>
  );
}

/* ======= AppHeader ======= */
export default function AppHeader({ collapsed = false, onToggleSider, onLogout, showBell = true }) {
  return (
    <header className='sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-16'>
      <div className='flex items-center justify-between h-full px-6'>
        <div className='flex items-center gap-4'>
          <AppButton
            variant='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSider}
            className='hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-200 transition-all duration-200'
          />
        </div>

        <div className='flex items-center gap-3'>
          {showBell ? <NotificationContent /> : null}
          <div className='h-6 w-px bg-gray-300 hidden sm:block' />
          <ProfileDropdown onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
