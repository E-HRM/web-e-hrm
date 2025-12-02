import prisma from '@/lib/prisma';
import { getMessaging } from 'firebase-admin/messaging';
import { adminApp, isAdminConfigured } from '@/app/utils/firebase/admin';

function formatMessage(template, data) {
  if (!template) return '';
  let msg = template;
  for (const k in data || {}) {
    msg = msg.replace(new RegExp(`{${k}}`, 'g'), String(data[k]));
  }
  return msg;
}

export async function sendNotification(eventTrigger, userId, dynamicData = {}, opts = {}) {
  if (!isAdminConfigured || !adminApp) {
    return;
  }

  const now = new Date();
  const dedupeKey = opts.dedupeKey || `${eventTrigger}:${userId}:${dynamicData?.id || now.getTime()}`;
  const collapseKey = opts.collapseKey || eventTrigger;
  const deeplink = opts.deeplink || dynamicData?.deeplink || '';

  const devices = await prisma.device.findMany({
    where: { id_user: userId, push_enabled: true, fcm_token: { not: null } },
    select: { id_device: true, fcm_token: true },
  });
  const tokens = devices.map((d) => d.fcm_token).filter(Boolean);
  if (!tokens.length) {
    return;
  }

  const tpl = await prisma.notificationTemplate.findUnique({ where: { eventTrigger } });
  const overrideTitle = dynamicData?.overrideTitle;
  const overrideBody = dynamicData?.overrideBody;

  let title = 'Notifikasi';
  let body = 'Anda memiliki notifikasi baru.';
  if (tpl && tpl.isActive) {
    title = formatMessage(tpl.titleTemplate, dynamicData) || title;
    body = formatMessage(tpl.bodyTemplate, dynamicData) || body;
  } else {
    if (dynamicData?.title) title = dynamicData.title;
    if (dynamicData?.body) body = dynamicData.body;
  }
  if (overrideTitle) title = overrideTitle;
  if (overrideBody) body = overrideBody;

  const notifRecord = await prisma.notification.create({
    data: {
      id_user: userId,
      title,
      body,
      data_json: JSON.stringify({ eventTrigger, dedupeKey, deeplink, dynamicData }),
      related_table: dynamicData?.related_table || null,
      related_id: dynamicData?.related_id || null,
      status: 'unread',
    },
  });

  const dataPayload = {
    title,
    body,
    eventTrigger,
    dedupeKey,
    deeplink,
    notificationId: String(notifRecord.id_notification),
    ts: String(now.getTime()),
  };

  const message = {
    tokens,
    data: dataPayload,
    android: {
      priority: 'high',
      collapseKey,
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          contentAvailable: true,
          mutableContent: true,
        },
      },
    },
    webpush: {
      headers: { Urgency: 'high', TTL: '1800' },
      fcmOptions: { link: deeplink || '/' },
    },
  };

  const resp = await getMessaging(adminApp).sendEachForMulticast(message);

  const updates = [];
  resp.responses.forEach((r, idx) => {
    const device = devices[idx];
    if (r.success) {
      updates.push(
        prisma.device.update({
          where: { id_device: device.id_device },
          data: { last_push_at: now, failed_push_count: 0 },
        })
      );
    } else {
      const code = r.error?.code || '';
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        updates.push(
          prisma.device.update({
            where: { id_device: device.id_device },
            data: { push_enabled: false, failed_push_count: { increment: 1 } },
          })
        );
      } else {
        updates.push(
          prisma.device.update({
            where: { id_device: device.id_device },
            data: { failed_push_count: { increment: 1 } },
          })
        );
      }
    }
  });
  if (updates.length) await prisma.$transaction(updates);
}
