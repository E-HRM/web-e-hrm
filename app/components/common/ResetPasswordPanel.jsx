"use client";

import { useMemo } from "react";
import { Form, Input, Button, Typography, Space } from "antd";
import useResetPasswordViewModel from "../../(view)/auth/resetpass/useResetPassViewModel";

const BRAND = {
  primary: "#003A6F",
  accent: "#98D5FF",
  accentHover: "#6FC0FF",
};

export default function ResetPasswordPanel({ onBackToLogin }) {
  const {
    step,
    email,
    left,
    canResend,
    sending,
    confirming,
    requestCode,
    resendCode,
    confirmReset,
    setStep,
  } = useResetPasswordViewModel();

  const hintText = useMemo(() => {
    if (step === "confirm") {
      return (
        <>
          Masukkan <b>kode 6 digit</b> yang dikirim ke email {email ? <b>{email}</b> : null}.
        </>
      );
    }
    return "Masukkan email yang terdaftar untuk menerima kode reset password.";
  }, [step, email]);

  return (
    <div className="w-full max-w-md mx-auto md:ml-24 p-8 md:p-12">
      {/* Judul */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
        <Button type="link" className="p-0" onClick={onBackToLogin} style={{ color: BRAND.accent }}>
          Kembali ke Login
        </Button>
      </div>

      <Typography.Paragraph type="secondary" className="mb-6">
        {hintText}
      </Typography.Paragraph>

      {step === "request" ? (
        <Form layout="vertical" onFinish={requestCode}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input placeholder="nama@domain.com" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={sending}
            block
            style={{ background: BRAND.primary, borderColor: BRAND.primary }}
          >
            Kirim Kode
          </Button>
        </Form>
      ) : (
        <Form
          layout="vertical"
          onFinish={async (values) => {
            const ok = await confirmReset(values);
            if (ok && typeof onBackToLogin === "function") onBackToLogin();
          }}
        >
          <Form.Item
            label="Kode Verifikasi (6 digit)"
            name="code"
            rules={[
              { required: true, message: "Kode wajib diisi" },
              { len: 6, message: "Kode harus 6 digit" },
            ]}
          >
            <Input maxLength={6} placeholder="123456" />
          </Form.Item>

          <Form.Item
            label="Password Baru"
            name="password"
            rules={[
              { required: true, message: "Password wajib diisi" },
              { min: 8, message: "Minimal 8 karakter" },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Konfirmasi Password"
            name="confirm_password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Konfirmasi password wajib diisi" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Konfirmasi password tidak sama"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Space direction="vertical" className="w-full">
            <Button
              htmlType="submit"
              type="primary"
              loading={confirming}
              block
              style={{ background: BRAND.primary, borderColor: BRAND.primary }}
            >
              Reset Password
            </Button>

            <div className="flex items-center justify-between">
              <Button type="link" className="p-0" onClick={() => setStep("request")}>
                Ganti Email
              </Button>
              <Button
                type="link"
                className="p-0"
                disabled={!canResend}
                onClick={resendCode}
                style={{ color: canResend ? BRAND.accent : undefined }}
              >
                {canResend ? "Kirim Ulang Kode" : `Kirim ulang dalam ${left}s`}
              </Button>
            </div>
          </Space>
        </Form>
      )}
    </div>
  );
}
