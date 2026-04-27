'use client';

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';

import { ApiEndpoints } from '@/constrainst/endpoints';

async function apiJson(url, { method = 'GET', body } = {}) {
  const token = Cookies.get('token');
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['content-type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.message || data?.error || 'Request gagal';
    throw new Error(message);
  }

  return data;
}

function fileNameFromUrl(url) {
  try {
    if (!url) return '';
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last);
  } catch {
    const parts = String(url || '').split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || '');
  }
}

function inferSourceType(url) {
  const value = String(url || '').trim().toLowerCase();
  if (!value) return 'upload';
  if (value.includes('/storage/v1/object/')) return 'upload';
  if (value.includes('master-template')) return 'upload';
  if (/\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|zip|rar)(\?|$)/i.test(value)) return 'upload';
  return 'link';
}

export default function useMasterTemplateViewModel() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const url = useMemo(() => ApiEndpoints.GetMasterTemplate({ all: true }), []);
  const { data, error, isLoading, mutate } = useSWR(url, (target) => apiJson(target), {
    revalidateOnFocus: false,
  });

  const templates = useMemo(() => {
    const raw = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

    return raw.map((item) => {
      const fileUrl = String(item?.file_template_url || '').trim();
      const sourceType = inferSourceType(fileUrl);
      return {
        id_master_template: item?.id_master_template || item?.id || '',
        nama_template: item?.nama_template || '-',
        file_template_url: fileUrl,
        file_name: fileNameFromUrl(fileUrl) || 'template-file',
        source_type: sourceType,
        created_at: item?.created_at || '',
        updated_at: item?.updated_at || '',
      };
    });
  }, [data]);

  const openCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((template) => {
    setEditingTemplate(template || null);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback((template) => {
    setSelectedTemplate(template || null);
  }, []);

  const saveTemplate = useCallback(
    async (payload) => {
      const namaTemplate = String(payload?.nama_template || '').trim();
      if (!namaTemplate) throw new Error('Nama template wajib diisi');

      const sourceType = payload?.source_type === 'link' ? 'link' : 'upload';
      const fd = new FormData();
      fd.append('nama_template', namaTemplate);

      if (sourceType === 'upload') {
        const file = payload?.fileList?.[0]?.originFileObj;
        if (file) {
          fd.append('file_template', file);
        } else if (payload?.file_template_url) {
          fd.append('file_template_url', String(payload.file_template_url));
        } else {
          fd.append('file_template_url', '');
        }
      } else {
        const link = String(payload?.link_url || '').trim();
        if (!link) throw new Error('Link template wajib diisi');
        fd.append('file_template_url', link);
      }

      const templateId = String(payload?.id_master_template || '').trim();
      const isEdit = Boolean(templateId);
      const endpoint = isEdit ? ApiEndpoints.UpdateMasterTemplate(templateId) : ApiEndpoints.CreateMasterTemplate();
      const method = isEdit ? 'PUT' : 'POST';

      await apiJson(endpoint, { method, body: fd });
      await mutate();
      setFormOpen(false);
      setEditingTemplate(null);
    },
    [mutate]
  );

  const deleteTemplate = useCallback(
    async (idOrRecord) => {
      const templateId =
        typeof idOrRecord === 'object'
          ? String(idOrRecord?.id_master_template || idOrRecord?.id || '').trim()
          : String(idOrRecord || '').trim();

      if (!templateId) throw new Error('ID template tidak valid');

      await apiJson(ApiEndpoints.DeleteMasterTemplate(templateId), { method: 'DELETE' });
      await mutate();

      setSelectedTemplate((current) => {
        if (!current) return null;
        return current.id_master_template === templateId ? null : current;
      });
    },
    [mutate]
  );

  return {
    templates,
    loading: isLoading,
    error,

    formOpen,
    setFormOpen,
    editingTemplate,
    setEditingTemplate,
    selectedTemplate,
    setSelectedTemplate,

    openCreate,
    openEdit,
    openDetail,
    saveTemplate,
    deleteTemplate,
  };
}
