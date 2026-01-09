'use client';

import React from 'react';
import { LogoutOutlined } from '@ant-design/icons';

import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function Header({ userLabel = 'Admin', avatarSrc = '/logo-burung.png', onLogout }) {
  const canLogout = typeof onLogout === 'function';

  return (
    <header className='w-full bg-white border-b border-gray-200'>
      <div className='mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center justify-end'>
        <div className='flex items-center gap-3'>
          <AppTypography.Text
            size={14}
            weight={600}
            className='text-gray-800'
          >
            {userLabel}
          </AppTypography.Text>

          <AppAvatar
            size={28}
            src={avatarSrc}
            alt='User avatar'
            name={userLabel}
            bordered={false}
            className='ring-1 ring-gray-200'
          />

          <AppButton
            variant='text'
            disabled={!canLogout}
            onClick={onLogout}
            aria-label='Logout'
            title='Logout'
            icon={<LogoutOutlined className='text-red-600 text-lg' />}
            className='grid place-items-center rounded-md !p-1 hover:!bg-red-50 transition'
          />
        </div>
      </div>
    </header>
  );
}
