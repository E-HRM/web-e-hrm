'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ConfigProvider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

import FormComponent from '../../component_shared/AppForm';
import AppImage from '../../component_shared/AppImage';
import AppTypography from '../../component_shared/AppTypography';
import { fontBodyClassName, fontFamily } from '../../component_shared/Font';

import useLoginViewModel from './useLoginViewModel';

const BRAND = {
  primary: '#003A6F',
  primaryHover: '#003E86',
  primaryActive: '#00366F',
  accent: '#98D5FF',
  accentHover: '#6FC0FF',
  accentActive: '#4AAEFF',
};

export default function LoginContent() {
  const { onFinish, loading } = useLoginViewModel();

  const fields = useMemo(
    () => [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'Input email',
        prefix: <MailOutlined className='text-gray-400' />,
        rules: [
          { required: true, message: 'Email is required' },
          { type: 'email', message: 'Invalid email' },
        ],
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Password',
        prefix: <LockOutlined className='text-gray-400' />,
        rules: [{ required: true, message: 'Password is required' }],
      },
      {
        key: 'forgot-link',
        render: () => (
          <div className='mt-2 mb-3 text-center'>
            <span className='text-sm text-gray-500 font-medium'>
              Forgot Password?{' '}
              <Link
                href='/auth/resetpass'
                prefetch={false}
                className='font-semibold'
              >
                Reset Password
              </Link>
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className={`relative min-h-dvh bg-white ${fontBodyClassName}`}>
      <div className='absolute inset-0 z-0'>
        <AppImage
          src='/bglogin2.jpg'
          alt='Background Login'
          fill
          priority
          fit='cover'
          position='center'
          rounded={0}
          wrapperClassName='w-full h-full'
        />
        <div className='absolute inset-0 bg-white/40 pointer-events-none z-10' />
      </div>

      <div className='relative z-10 flex min-h-dvh items-center justify-center p-4 sm:p-5 md:p-6'>
        <div className='grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 md:grid-cols-2'>
          <div className='relative hidden md:block'>
            <AppImage
              src='/kirilogo2.png'
              alt='Login Illustration'
              fill
              sizes='(min-width: 768px) 50vw, 0vw'
              priority
              fit='cover'
              position='center'
              rounded={0}
              wrapperClassName='w-full h-full'
            />
          </div>

          <div className='login-card p-6 sm:p-7 md:p-8 lg:p-10'>
            <AppTypography.Title
              level={3}
              weight={700}
              className='!m-0 !leading-tight text-gray-900'
            >
              Login
            </AppTypography.Title>
            <AppTypography.Text
              tone='muted'
              weight={500}
              className='mt-1 block'
            >
              Masuk untuk melanjutkan
            </AppTypography.Text>

            <ConfigProvider
              theme={{
                token: {
                  fontFamily,
                  fontFamilyCode: fontFamily,
                  fontWeightStrong: 700,
                  colorPrimary: BRAND.primary,
                  colorPrimaryHover: BRAND.primaryHover,
                  colorPrimaryActive: BRAND.primaryActive,
                  colorLink: BRAND.accent,
                  colorLinkHover: BRAND.accentHover,
                  colorLinkActive: BRAND.accentActive,
                  controlOutline: BRAND.primary,
                  colorBorder: '#E5E7EB',
                  colorBorderSecondary: '#E5E7EB',
                  borderRadius: 12,
                  fontSize: 13,
                },
                components: {
                  Button: { controlHeight: 42 },
                  Input: {
                    controlHeight: 42,
                    activeShadow: `0 0 0 2px ${BRAND.accent}33`,
                  },
                },
              }}
            >
              <div className='mx-auto mt-6 w-full max-w-sm'>
                <FormComponent
                  onFinish={onFinish}
                  loading={loading}
                  submitText='Login'
                  submitProps={{ size: 'large', className: 'font-semibold' }}
                  fields={fields}
                />
              </div>
            </ConfigProvider>
          </div>
        </div>
      </div>

      <style
        jsx
        global
      >{`
        .login-card a {
          color: ${BRAND.accent};
        }
        .login-card a:hover {
          color: ${BRAND.accentHover};
        }
        .login-card a:active {
          color: ${BRAND.accentActive};
        }

        .login-card .ant-form-item {
          margin-bottom: 12px;
        }
        .login-card .ant-form .ant-btn-primary {
          margin-top: 6px;
        }

        .login-card .ant-btn-primary:not([disabled]) {
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        }
        .login-card .ant-btn-primary:not([disabled]):hover {
          background: ${BRAND.primaryHover};
          border-color: ${BRAND.primaryHover};
        }
        .login-card .ant-btn-primary:not([disabled]):active {
          background: ${BRAND.primaryActive};
          border-color: ${BRAND.primaryActive};
        }

        .login-card .ant-input:focus,
        .login-card .ant-input-focused,
        .login-card .ant-input-affix-wrapper-focused {
          border-color: ${BRAND.primary};
          box-shadow: 0 0 0 2px ${BRAND.accent}33;
        }
      `}</style>
    </div>
  );
}
