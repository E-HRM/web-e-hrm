"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AntdApp } from "antd";
import { crudService } from "../../../utils/services/crudService";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints"

const RESEND_SECONDS = 60;

export default function useResetPasswordViewModel() {
  const { notification } = AntdApp.useApp();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);  
  const [confirming, setConfirming] = useState(false); 

 
  const [left, setLeft] = useState(0);
  const timerRef = useRef(null);

  const canResend = useMemo(() => left <= 0, [left]);

  useEffect(() => {
    if (left <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [left]);

  const startCountdown = useCallback(() => {
    setLeft(RESEND_SECONDS);
  }, []);

  const requestCode = useCallback(
    async (values) => {
      try {
        setSending(true);
        const normalized = String(values.email || "").trim().toLowerCase();
        if (!normalized) throw new Error("Email wajib diisi.");
        setEmail(normalized);

        await crudService.post(ApiEndpoints.ResetPasswordRequest, {
          email: normalized,
        });

        notification.success({
          message: "Kode dikirim",
          description:
            "Jika email terdaftar, kode verifikasi telah dikirim. Periksa inbox/spam.",
        });

        // lanjut ke step konfirmasi
        setStep("confirm");
        startCountdown();
      } catch (err) {
        notification.info({
          message: "Cek email Anda",
          description:
            "Jika email terdaftar, kode verifikasi telah dikirim.",
        });

        setStep("confirm");
        startCountdown();
      } finally {
        setSending(false);
      }
    },
    [notification, startCountdown]
  );

  const resendCode = useCallback(async () => {
    if (!canResend) return;
    try {
      setSending(true);
      await crudService.post(ApiEndpoints.ResetPasswordRequest, { email });
      notification.success({
        message: "Kode dikirim ulang",
        description: "Silakan cek email Anda.",
      });
      startCountdown();
    } catch (err) {
      notification.error({
        message: "Gagal kirim ulang",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSending(false);
    }
  }, [canResend, email, notification, startCountdown]);

  const confirmReset = useCallback(
    async (values) => {
      try {
        setConfirming(true);

        const token = String(values.code || "").trim();
        const password = String(values.password || "");
        const confirm = String(values.confirm_password || "");

        if (!token || token.length !== 6) {
          throw new Error("Kode harus 6 digit.");
        }
        if (password.length < 8) {
          throw new Error("Password minimal 8 karakter.");
        }
        if (password !== confirm) {
          throw new Error("Konfirmasi password tidak sama.");
        }

        await crudService.post(ApiEndpoints.ResetPasswordConfirm, {
          token,
          password,
        });

        notification.success({
          message: "Password direset",
          description: "Silakan login dengan password baru Anda.",
        });

        return true;
      } catch (err) {
        notification.error({
          message: "Gagal reset",
          description: err?.message || "Terjadi kesalahan.",
        });
        return false;
      } finally {
        setConfirming(false);
      }
    },
    [notification]
  );

  return {
    step,
    email,
    left,
    canResend,
    sending,
    confirming,
    // actions
    requestCode,
    resendCode,
    confirmReset,
    setStep, // kalau mau balik ke request
  };
}
