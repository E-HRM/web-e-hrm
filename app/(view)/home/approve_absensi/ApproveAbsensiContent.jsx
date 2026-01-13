'use client';

import { Typography, Card, Input, DatePicker, Tabs, Table, Tag, Button, Space, Tooltip, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import useApproveAbsensiViewModel from './useApproveAbsensiViewModel';

const { Title, Text } = Typography;

function onlyDate(v) {
  return v ? dayjs(v).format('DD/MM/YYYY') : '-';
}

// status -> tag
function StatusTag({ status }) {
  const s = String(status || '').toLowerCase();
  if (s === 'disetujui') return <Tag color='green'>Disetujui</Tag>;
  if (s === 'ditolak') return <Tag color='red'>Ditolak</Tag>;
  return <Tag color='geekblue'>Terkirim</Tag>;
}

export default function ApproveAbsensiContent() {
  const vm = useApproveAbsensiViewModel();

  // modal konfirmasi + catatan
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState('approve'); // 'approve' | 'reject'
  const [confirmRow, setConfirmRow] = useState(null);
  const noteRef = useRef(null);

  // modal detail
  const [openDetail, setOpenDetail] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const columns = useMemo(
    () => [
      {
        title: 'Tanggal',
        dataIndex: 'tanggal',
        width: 130,
        render: (v) => onlyDate(v),
        sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix(),
      },
      {
        title: 'Karyawan',
        dataIndex: ['user', 'nama_pengguna'],
        width: 260,
        render: (t, r) => (
          <div className='min-w-0'>
            <div className='font-medium text-slate-800 truncate'>{t || '-'}</div>
            <div className='text-xs text-slate-500 truncate'>{r.user?.departement?.nama_departement || '-'}</div>
          </div>
        ),
        sorter: (a, b) => (a.user?.nama_pengguna || '').localeCompare(b.user?.nama_pengguna || ''),
      },
      {
        title: 'Jam Masuk',
        dataIndex: 'jamMasukView',
        width: 110,
      },
      {
        title: 'Jam Pulang',
        dataIndex: 'jamPulangView',
        width: 110,
      },
      {
        title: 'Status',
        dataIndex: 'status_recipient',
        width: 130,
        render: (s) => <StatusTag status={s} />,
        filters: [
          { text: 'Terkirim', value: 'terkirim' },
          { text: 'Disetujui', value: 'disetujui' },
          { text: 'Ditolak', value: 'ditolak' },
        ],
        onFilter: (val, rec) => String(rec.status_recipient || '').toLowerCase() === String(val),
      },
      {
        title: 'Catatan',
        dataIndex: 'catatan',
        ellipsis: true,
      },
      {
        title: 'Aksi',
        key: 'aksi',
        fixed: 'right',
        width: 220,
        render: (_, row) => {
          const s = String(row.status_recipient || '').toLowerCase();
          return (
            <Space>
              <Tooltip title='Lihat detail'>
                <Button
                  size='small'
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setDetailRow(row);
                    setOpenDetail(true);
                    vm.markRead(row.id_recipient);
                  }}
                />
              </Tooltip>
              {s === 'terkirim' && (
                <>
                  <Tooltip title='Setujui'>
                    <Button
                      size='small'
                      type='primary'
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        setConfirmType('approve');
                        setConfirmRow(row);
                        setOpenConfirm(true);
                        setTimeout(() => noteRef.current?.focus(), 0);
                      }}
                    >
                      Setujui
                    </Button>
                  </Tooltip>
                  <Tooltip title='Tolak'>
                    <Button
                      size='small'
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        setConfirmType('reject');
                        setConfirmRow(row);
                        setOpenConfirm(true);
                        setTimeout(() => noteRef.current?.focus(), 0);
                      }}
                    >
                      Tolak
                    </Button>
                  </Tooltip>
                </>
              )}
            </Space>
          );
        },
      },
    ],
    [vm]
  );

  // Tabs status
  const items = useMemo(
    () => [
      {
        key: 'terkirim',
        label: (
          <span>
            Terkirim
            {vm.counts?.terkirim != null && (
              <Tag
                className='ml-2'
                color='blue'
              >
                {vm.counts.terkirim}
              </Tag>
            )}
          </span>
        ),
      },
      {
        key: 'disetujui',
        label: (
          <span>
            Disetujui
            {vm.counts?.disetujui != null && (
              <Tag
                className='ml-2'
                color='green'
              >
                {vm.counts.disetujui}
              </Tag>
            )}
          </span>
        ),
      },
      {
        key: 'ditolak',
        label: (
          <span>
            Ditolak
            {vm.counts?.ditolak != null && (
              <Tag
                className='ml-2'
                color='red'
              >
                {vm.counts.ditolak}
              </Tag>
            )}
          </span>
        ),
      },
    ],
    [vm.counts]
  );

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <Title
            level={3}
            className='!m-0'
          >
            Persetujuan Absensi
          </Title>
          <Text type='secondary'>Review & setujui/ tolak permintaan presensi</Text>
        </div>
        <div className='flex items-center gap-2'>
          <Input
            allowClear
            placeholder='Cari nama / divisi…'
            prefix={<SearchOutlined className='text-gray-400' />}
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            className='w-64'
          />
          <DatePicker
            allowClear
            value={vm.date}
            onChange={vm.setDate}
            format='DD/MM/YYYY'
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={vm.refresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter status */}
      <Card className='mb-3'>
        <Tabs
          activeKey={vm.status}
          onChange={vm.setStatus}
          items={items}
          type='card'
        />
      </Card>

      {/* Tabel */}
      <Card>
        <Table
          rowKey={(r) => r.id_recipient || `${r.user?.id_user || 'u'}-${r.tanggal || 't'}`}
          columns={columns}
          dataSource={vm.rows}
          loading={vm.loading}
          pagination={{
            current: vm.meta?.page || 1,
            pageSize: vm.meta?.perPage || 10,
            total: vm.meta?.total || vm.rows.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, [a, b]) => `${a}-${b} dari ${t} data`,
          }}
          onChange={vm.onTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Modal konfirmasi approve/reject */}
      <Modal
        open={openConfirm}
        title={confirmType === 'approve' ? 'Setujui Presensi' : 'Tolak Presensi'}
        okText={confirmType === 'approve' ? 'Setujui' : 'Tolak'}
        okButtonProps={{ type: confirmType === 'approve' ? 'primary' : 'default', danger: confirmType === 'reject' }}
        onOk={async () => {
          const note = noteRef.current?.value || '';
          if (!confirmRow) return;
          if (confirmType === 'approve') {
            await vm.approve(confirmRow.id_recipient, note);
          } else {
            await vm.reject(confirmRow.id_recipient, note);
          }
          setOpenConfirm(false);
          setConfirmRow(null);
        }}
        onCancel={() => {
          setOpenConfirm(false);
          setConfirmRow(null);
        }}
      >
        <div className='space-y-2'>
          <div>
            <div className='text-sm text-slate-600'>Karyawan</div>
            <div className='font-medium'>{confirmRow?.user?.nama_pengguna || '-'}</div>
          </div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <div className='text-slate-500'>Tanggal</div>
              <div className='font-medium'>{onlyDate(confirmRow?.tanggal)}</div>
            </div>
            <div>
              <div className='text-slate-500'>Jam</div>
              <div className='font-medium'>
                {confirmRow?.jamMasukView} — {confirmRow?.jamPulangView}
              </div>
            </div>
          </div>
          <div className='pt-2'>
            <label className='text-sm text-slate-600 block mb-1'>Catatan (opsional)</label>
            <textarea
              ref={noteRef}
              rows={3}
              className='w-full rounded-md border border-slate-300 px-2 py-1'
              placeholder='Tulis catatan jika perlu…'
            />
          </div>
        </div>
      </Modal>

      {/* Modal detail */}
      <Modal
        open={openDetail}
        title='Detail Absensi'
        footer={
          <Button
            onClick={() => setOpenDetail(false)}
            type='primary'
          >
            Tutup
          </Button>
        }
        onCancel={() => setOpenDetail(false)}
      >
        <div className='space-y-2'>
          <div>
            <div className='text-sm text-slate-500'>Karyawan</div>
            <div className='font-medium'>{detailRow?.user?.nama_pengguna || '-'}</div>
            <div className='text-sm text-slate-500'>{detailRow?.user?.departement?.nama_departement || '-'}</div>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <div className='text-sm text-slate-500'>Tanggal</div>
              <div className='font-medium'>{onlyDate(detailRow?.tanggal)}</div>
            </div>
            <div>
              <div className='text-sm text-slate-500'>Status</div>
              <div className='font-medium capitalize'>{detailRow?.status_recipient || '-'}</div>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <div className='text-sm text-slate-500'>Jam Masuk</div>
              <div className='font-medium'>{detailRow?.jamMasukView}</div>
            </div>
            <div>
              <div className='text-sm text-slate-500'>Jam Pulang</div>
              <div className='font-medium'>{detailRow?.jamPulangView}</div>
            </div>
          </div>
          {detailRow?.catatan && (
            <div className='pt-2'>
              <div className='text-sm text-slate-500'>Catatan</div>
              <div className='font-medium'>{detailRow.catatan}</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
