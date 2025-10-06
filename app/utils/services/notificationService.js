import prisma from '@/lib/prisma';
import { getMessaging } from 'firebase-admin/messaging';
import { adminApp, isAdminConfigured } from '@/app/utils/firebase/admin';
/**
 * Mengganti placeholder di dalam string template dengan data dinamis.
 * @param {string} template - String template, cth: "Halo, {nama_karyawan}!"
 * @param {object} data - Objek berisi data dinamis, cth: { nama_karyawan: "Budi" }
 * @returns {string} - String yang sudah diformat.
 */
function formatMessage(template, data) {
  if (!template) return '';
  let message = template;
  for (const key in data) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), data[key]);
  }
  return message;
}

/**
 * Service utama untuk mengirim notifikasi.
 * @param {string} eventTrigger - Kode unik pemicu dari tabel NotificationTemplate, cth: "SUCCESS_CHECK_IN".
 * @param {string} userId - ID pengguna yang akan menerima notifikasi.
 * @param {object} dynamicData - Objek berisi data untuk mengisi placeholder.
 */
export async function sendNotification(eventTrigger, userId, dynamicData) {
  try {
    if (!isAdminConfigured || !adminApp) {
      throw new Error('Firebase Admin SDK belum dikonfigurasi. Pastikan variabel lingkungan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY sudah diisi.');
    }

    // 1. Ambil template notifikasi dari database
    const template = await prisma.notificationTemplate.findUnique({
      where: { eventTrigger: eventTrigger },
    });

    // Jangan kirim jika template tidak ada atau tidak aktif
    if (!template || !template.isActive) {
      console.log(`Template untuk ${eventTrigger} tidak ditemukan atau tidak aktif.`);
      return;
    }

    // 2. Ambil semua token FCM milik pengguna dari tabel Device
    const devices = await prisma.device.findMany({
      where: {
        id_user: userId,
        fcm_token: { not: null }, // Pastikan hanya ambil yang punya token
      },
    });

    const fcmTokens = devices.map((device) => device.fcm_token);

    if (fcmTokens.length === 0) {
      console.log(`Tidak ada token FCM yang ditemukan untuk user ID: ${userId}`);
      return;
    }

    // 3. Format judul dan isi pesan dengan data dinamis
    const title = formatMessage(template.titleTemplate, dynamicData);
    const body = formatMessage(template.bodyTemplate, dynamicData);

    // 4. Simpan riwayat notifikasi ke database (tabel Notification)
    await prisma.notification.create({
      data: {
        id_user: userId,
        title: title,
        body: body,
        // (Opsional) data tambahan jika diperlukan di aplikasi mobile
        // data_json: JSON.stringify({ screen: 'AbsensiDetail', id: dynamicData.absensiId }),
      },
    });

    // 5. Kirim Push Notification menggunakan Firebase Admin SDK
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: fcmTokens,
      android: {
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await getMessaging(adminApp).sendEachForMulticast(message);
    console.log(`Notifikasi ${eventTrigger} berhasil dikirim ke user ${userId}. Response:`, response);
  } catch (error) {
    console.error(`Gagal mengirim notifikasi ${eventTrigger} untuk user ${userId}:`, error);
  }
}
