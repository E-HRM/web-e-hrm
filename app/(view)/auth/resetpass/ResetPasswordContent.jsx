'use client';

import { useMemo } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { MailOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import FormComponent from '../../component_shared/AppForm';
import { fontBodyClassName, fontFamily } from '../../component_shared/Font';
import AppButton from '../../component_shared/AppButton';
import AppSpace, { AppVStack } from '../../component_shared/AppSpace';
import AppTypography from '../../component_shared/AppTypography';
import AppImage from '../../component_shared/AppImage';

import useResetPasswordViewModel from './useResetPassViewModel';

const BRAND = {
  primary: '#003A6F',
  primaryHover: '#003E86',
  primaryActive: '#00366F',
  accent: '#98D5FF',
  accentHover: '#6FC0FF',
  accentActive: '#4AAEFF',
};

export default function ResetPasswordContent() {
  const router = useRouter();
  const onBackToLogin = () => router.replace('/auth/login');

  const { step, email, left, canResend, sending, confirming, requestCode, resendCode, confirmReset, setStep } = useResetPasswordViewModel();

  const hintNode = useMemo(() => {
    if (step === 'confirm') {
      return (
        <>
          Masukkan <span className='font-semibold'>kode 6 digit</span> yang dikirim ke email {email ? <span className='font-semibold'>{email}</span> : null}.
        </>
      );
    }
    return 'Masukkan email yang terdaftar untuk menerima kode reset password.';
  }, [step, email]);

  const requestFields = useMemo(
    () => [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'nama@domain.com',
        icon: <MailOutlined />,
        rules: [
          { required: true, message: 'Email wajib diisi' },
          { type: 'email', message: 'Format email tidak valid' },
        ],
      },
    ],
    []
  );

  const confirmFields = useMemo(
    () => [
      {
        name: 'code',
        label: 'Kode Verifikasi (6 digit)',
        type: 'text',
        placeholder: '123456',
        icon: <KeyOutlined />,
        controlProps: { maxLength: 6 },
        rules: [
          { required: true, message: 'Kode wajib diisi' },
          { len: 6, message: 'Kode harus 6 digit' },
        ],
      },
      {
        name: 'password',
        label: 'Password Baru',
        type: 'password',
        placeholder: '••••••••',
        icon: <LockOutlined />,
        rules: [
          { required: true, message: 'Password wajib diisi' },
          { min: 8, message: 'Minimal 8 karakter' },
        ],
      },
      {
        name: 'confirm_password',
        label: 'Konfirmasi Password',
        type: 'password',
        placeholder: '••••••••',
        icon: <LockOutlined />,
        dependencies: ['password'],
        rules: [
          { required: true, message: 'Konfirmasi password wajib diisi' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) return Promise.resolve();
              return Promise.reject(new Error('Konfirmasi password tidak sama'));
            },
          }),
        ],
      },
    ],
    []
  );

  return (
    <div className={`grid min-h-dvh grid-cols-1 md:grid-cols-2 bg-white ${fontBodyClassName}`}>
      {/* SECTION KIRI: FORM */}
      <section className='flex w-full flex-col items-center justify-center p-4 sm:p-8 md:p-12'>
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
          <AntdApp>
            <div className='w-full max-w-lg'>
              <div className='reset-card p-6 sm:p-7 md:p-8 lg:p-10'>
                <div className='mb-7 flex items-start justify-between gap-4'>
                  <div>
                    <AppTypography.Title
                      level={3}
                      weight={800}
                      className='!m-0 !leading-tight'
                    >
                      Reset Password
                    </AppTypography.Title>
                    <AppTypography.Text
                      tone='muted'
                      weight={500}
                    >
                      {step === 'request' ? 'Minta kode verifikasi' : 'Buat password baru'}
                    </AppTypography.Text>
                  </div>

                  <AppButton
                    variant='link'
                    colors={BRAND}
                    className='p-0 font-semibold'
                    onClick={onBackToLogin}
                  >
                    Kembali ke Login
                  </AppButton>
                </div>

                <AppTypography.Paragraph
                  tone='secondary'
                  weight={500}
                  className='mb-6 !leading-relaxed'
                >
                  {hintNode}
                </AppTypography.Paragraph>

                {step === 'request' ? (
                  <FormComponent
                    onFinish={requestCode}
                    disabled={sending}
                    loading={sending}
                    submitText='Kirim Kode'
                    submitProps={{
                      size: 'large',
                      className: 'font-semibold',
                    }}
                    initialValues={email ? { email } : undefined}
                    fields={requestFields}
                  />
                ) : (
                  <FormComponent
                    onFinish={async (values) => {
                      const ok = await confirmReset(values);
                      if (ok) onBackToLogin();
                    }}
                    disabled={confirming}
                    fields={confirmFields}
                    footer={() => (
                      <AppVStack
                        size='md'
                        className='w-full'
                      >
                        <AppButton
                          variant='primary'
                          htmlType='submit'
                          block
                          size='large'
                          loading={confirming}
                          className='font-semibold'
                        >
                          Reset Password
                        </AppButton>

                        <div className='flex items-center justify-between'>
                          <AppButton
                            variant='link'
                            colors={BRAND}
                            className='p-0 font-semibold'
                            onClick={() => setStep('request')}
                          >
                            Ganti Email
                          </AppButton>

                          <AppButton
                            variant='link'
                            colors={BRAND}
                            className='p-0 font-semibold'
                            disabled={!canResend || sending}
                            onClick={resendCode}
                          >
                            {canResend ? 'Kirim Ulang Kode' : `Kirim ulang dalam ${left}s`}
                          </AppButton>
                        </div>
                      </AppVStack>
                    )}
                  />
                )}
              </div>
            </div>
          </AntdApp>
        </ConfigProvider>
      </section>

      {/* SECTION KANAN: GAMBAR & BRANDING */}
      <section className='relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-slate-50 text-center'>
        <div className='absolute inset-0 z-0'>
          <AppImage
            src='/bglogin2.jpg'
            alt='Background'
            fill
            priority
            fit='cover'
            position='center'
            rounded={0}
            wrapperClassName='w-full h-full'
          />
          {/* FIX: Tambahkan z-10 agar overlay berada DI ATAS gambar (karena AppImage punya z-index: 1) */}
          <div className='pointer-events-none absolute inset-0 bg-white/60 z-10' />
        </div>

        <div className='relative z-10 flex flex-col items-center justify-center p-10'>
          <AppImage
            src='/logo-oss.png'
            alt='OSS Mark'
            width={260}
            height={260}
            className='h-56 w-56 object-contain md:h-64 md:w-64 lg:h-[18rem] lg:w-[18rem]'
            priority
            rounded={0}
          />
          <div className='mt-6'>
            <p className='text-2xl font-black tracking-wide text-[#003A6F] md:text-3xl'>ONE STEP SOLUTION</p>
            <p className='mt-0 text-lg font-semibold text-[#003A6F]/80 md:text-xl'>Make You Priority</p>
          </div>
        </div>
      </section>

      <style
        jsx
        global
      >{`
        .reset-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(229, 231, 235, 0.95);
          border-radius: 18px;
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(6px);
        }

        .reset-card .ant-form-item {
          margin-bottom: 12px;
        }

        .reset-card .ant-btn-primary:not([disabled]):hover {
          background: ${BRAND.primaryHover};
          border-color: ${BRAND.primaryHover};
        }
        .reset-card .ant-btn-primary:not([disabled]):active {
          background: ${BRAND.primaryActive};
          border-color: ${BRAND.primaryActive};
        }

        .reset-card .ant-input:focus,
        .reset-card .ant-input-focused,
        .reset-card .ant-input-affix-wrapper-focused {
          border-color: ${BRAND.primary};
          box-shadow: 0 0 0 2px ${BRAND.accent}33;
        }

        .reset-card a,
        .reset-card .ant-btn-link {
          color: ${BRAND.accent};
        }
        .reset-card a:hover,
        .reset-card .ant-btn-link:hover {
          color: ${BRAND.accentHover};
        }
        .reset-card a:active,
        .reset-card .ant-btn-link:active {
          color: ${BRAND.accentActive};
        }
      `}</style>
    </div>
  );
}
