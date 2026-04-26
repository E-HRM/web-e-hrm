import { DeleteOutlined, RollbackOutlined, UploadOutlined } from '@ant-design/icons';

import AppAlert from '@/app/(view)/component_shared/AppAlert';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppUpload from '@/app/(view)/component_shared/AppUpload';

function StatusTag({ status }) {
  const config = {
    valid: { tone: 'success', label: 'Siap Disimpan' },
    warning: { tone: 'warning', label: 'Perlu Dicek' },
    error: { tone: 'danger', label: 'Bermasalah' },
    ignored: { tone: 'neutral', label: 'Diabaikan' },
  }[status] || { tone: 'neutral', label: status || '-' };

  return (
    <AppTag
      tone={config.tone}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {config.label}
    </AppTag>
  );
}

function SummaryItem({ label, value, tone = 'text-gray-900' }) {
  return (
    <div className='rounded-lg border border-gray-200 bg-white px-3 py-2'>
      <AppTypography.Text
        size={12}
        className='block text-gray-500'
      >
        {label}
      </AppTypography.Text>
      <AppTypography.Text
        size={15}
        weight={700}
        className={`block ${tone}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

function IssueList({ row, vm }) {
  if (row.selected === false) {
    return (
      <AppTypography.Text
        size={12}
        className='text-gray-500'
      >
        Baris ini akan dilewati dan tidak akan disimpan.
      </AppTypography.Text>
    );
  }

  const issues = [...(row.errors || []), ...(row.warnings || [])].map(vm.getIssueMessage).filter(Boolean);

  if (!issues.length) {
    return (
      <AppTypography.Text
        size={12}
        className='text-gray-400'
      >
        -
      </AppTypography.Text>
    );
  }

  return (
    <div className='space-y-1'>
      {issues.slice(0, 3).map((message, index) => (
        <AppTypography.Text
          key={`${row.import_key}-issue-${index}`}
          size={12}
          className={row.status === 'error' ? 'block text-red-600' : 'block text-orange-600'}
        >
          {message}
        </AppTypography.Text>
      ))}
      {issues.length > 3 ? (
        <AppTypography.Text
          size={12}
          className='block text-gray-500'
        >
          +{issues.length - 3} catatan lain
        </AppTypography.Text>
      ) : null}
    </div>
  );
}

export default function ImportModalSection({ vm }) {
  const columns = [
    {
      title: 'BARIS',
      key: 'row',
      width: 90,
      fixed: 'left',
      render: (_, row) => (
        <div className='space-y-1'>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            #{row.excel_row}
          </AppTypography.Text>
          <StatusTag status={row.status} />
        </div>
      ),
    },
    {
      title: 'TRANSAKSI',
      key: 'transaction',
      width: 300,
      render: (_, row) => (
        <div className='min-w-0'>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatDate(row.tanggal_transaksi)}
          </AppTypography.Text>
          <AppTypography.Text
            size={13}
            weight={600}
            className='block text-gray-800 truncate'
          >
            {row.nama_klien || '-'}
          </AppTypography.Text>
          <AppTypography.Text
            size={12}
            className='block text-gray-500'
          >
            {row.deskripsi || '-'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'PEMBAGIAN',
      key: 'sharing',
      width: 260,
      render: (_, row) => (
        <div className='space-y-2'>
          <AppTypography.Text
            size={12}
            className='block text-gray-500'
          >
            Dari Excel: {row.sharing_income_raw || '-'}
          </AppTypography.Text>

          {row.is_oss ? (
            <AppTag
              tone='purple'
              variant='soft'
              size='md'
            >
              OSS
            </AppTag>
          ) : (
            <AppSelect
              value={row.id_user_konsultan || undefined}
              onChange={(value) => vm.setImportRowValue(row.import_key, 'id_user_konsultan', value || null)}
              options={vm.konsultanOptions}
              placeholder='Pilih konsultan'
              showSearch
              optionFilterProp='label'
              selectClassName='!rounded-lg'
            />
          )}
        </div>
      ),
    },
    {
      title: 'PRODUK',
      key: 'produk',
      width: 260,
      render: (_, row) => (
        <AppSelect
          value={row.id_jenis_produk_konsultan || undefined}
          onChange={(value) => vm.setImportRowValue(row.import_key, 'id_jenis_produk_konsultan', value || null)}
          options={vm.produkOptions}
          placeholder='Pilih produk'
          allowClear
          showSearch
          optionFilterProp='label'
          selectClassName='!rounded-lg'
        />
      ),
    },
    {
      title: 'RINCIAN NOMINAL',
      key: 'nominal',
      width: 260,
      align: 'right',
      render: (_, row) => (
        <div className='space-y-1'>
          <AppTypography.Text
            size={12}
            className='block text-gray-500'
          >
            Pemasukan {vm.formatCurrency(row.nominal_debit)} / Pengeluaran {vm.formatCurrency(row.nominal_kredit)}
          </AppTypography.Text>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            Pendapatan {vm.formatCurrency(row.total_income)}
          </AppTypography.Text>
          <AppTypography.Text
            size={12}
            className='block text-blue-600'
          >
            Bagian Konsultan {vm.formatCurrency(row.nominal_share)}
          </AppTypography.Text>
          <AppTypography.Text
            size={12}
            className='block text-purple-600'
          >
            OSS {vm.formatCurrency(row.nominal_oss)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'CATATAN',
      key: 'issues',
      width: 320,
      render: (_, row) => (
        <IssueList
          row={row}
          vm={vm}
        />
      ),
    },
    {
      title: 'AKSI',
      key: 'action',
      width: 130,
      fixed: 'right',
      align: 'center',
      render: (_, row) =>
        row.selected === false ? (
          <AppButton
            variant='text'
            icon={<RollbackOutlined />}
            className='!text-blue-600 hover:!bg-blue-50 !rounded'
            onClick={() => vm.setImportRowSelected(row.import_key, true)}
          >
            Pulihkan
          </AppButton>
        ) : (
          <AppButton
            variant='text'
            icon={<DeleteOutlined />}
            className='!text-red-600 hover:!bg-red-50 !rounded'
            onClick={() => vm.setImportRowSelected(row.import_key, false)}
          >
            Abaikan
          </AppButton>
        ),
    },
  ];

  const rekapMatch = vm.importPreview?.summary?.rekap_total_match;

  return (
    <AppModal
      open={vm.isImportModalOpen}
      onClose={vm.closeImportModal}
      title='Impor Transaksi Konsultan'
      subtitle={`Periode aktif: ${vm.activePeriodeLabel}`}
      footer={null}
      width={1180}
      destroyOnClose
      maskClosable={false}
    >
      <div className='space-y-4'>
        <AppAlert
          type='info'
          message='Pastikan isi Excel sudah sesuai'
          description='Baris dengan tanggal transaksi akan disiapkan untuk disimpan. Baris rekap seperti TOTAL hanya digunakan sebagai pembanding dan tidak akan disimpan.'
        />

        <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
          <div className='flex flex-col md:flex-row md:items-center gap-3'>
            <AppUpload
              accept='.xlsx,.xls'
              maxCount={1}
              maxSizeMB={2}
              showUploadList={false}
              wrapperClassName='!w-auto shrink-0'
              className='!w-auto'
              beforeUpload={(file) => {
                vm.setImportFile(file);
                return false;
              }}
              onRemove={() => {
                vm.setImportFile(null);
                return true;
              }}
            >
              <AppButton
                variant='secondary'
                icon={<UploadOutlined />}
                className='!rounded-lg !px-4 !h-10'
                disabled={vm.isImportPreviewing || vm.isImportCommitting}
              >
                Pilih File Excel
              </AppButton>
            </AppUpload>

            <div className='min-w-0 flex-1 md:max-w-[calc(100%-320px)]'>
              <AppTypography.Text
                size={13}
                weight={600}
                className='block text-gray-900 truncate'
              >
                {vm.importFile?.name || 'Belum ada file dipilih'}
              </AppTypography.Text>
              <AppTypography.Text
                size={12}
                className='block text-gray-500'
              >
                Format yang didukung: .xlsx dan .xls
              </AppTypography.Text>
            </div>

            <AppButton
              onClick={vm.handlePreviewImport}
              loading={vm.isImportPreviewing}
              disabled={!vm.importFile || vm.isImportCommitting}
              className='!rounded-lg !px-4 !h-10 !bg-indigo-600 hover:!bg-indigo-700 !border-indigo-600 hover:!border-indigo-700 !text-white'
            >
              Cek File
            </AppButton>
          </div>
        </div>

        {vm.importRows.length > 0 ? (
          <>
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3'>
              <SummaryItem
                label='Baris'
                value={vm.importSummary.total_rows}
              />
              <SummaryItem
                label='Diabaikan'
                value={vm.importSummary.ignored_rows || 0}
                tone='text-gray-600'
              />
              <SummaryItem
                label='Siap Disimpan'
                value={vm.importSummary.valid_rows}
                tone='text-green-700'
              />
              <SummaryItem
                label='Perlu Dicek'
                value={vm.importSummary.warning_rows}
                tone='text-orange-700'
              />
              <SummaryItem
                label='Bermasalah'
                value={vm.importSummary.error_rows}
                tone='text-red-700'
              />
              <SummaryItem
                label='Total Pendapatan'
                value={vm.formatCurrency(vm.importSummary.total_income)}
              />
              <SummaryItem
                label='Share'
                value={vm.formatCurrency(vm.importSummary.total_share)}
                tone='text-blue-700'
              />
              <SummaryItem
                label='OSS'
                value={vm.formatCurrency(vm.importSummary.total_oss)}
                tone='text-purple-700'
              />
              <SummaryItem
                label='Rekap'
                value={rekapMatch === null || rekapMatch === undefined ? '-' : rekapMatch ? 'Sesuai' : 'Tidak sesuai'}
                tone={rekapMatch === false ? 'text-orange-700' : 'text-gray-900'}
              />
            </div>

            <AppTable
              card={false}
              rowKey='import_key'
              columns={columns}
              dataSource={vm.importRows}
              rowClassName={(row) => (row.selected === false ? 'opacity-60 bg-gray-50' : '')}
              pagination={{
                current: vm.importPreviewPage,
                pageSize: 8,
                showSizeChanger: false,
                showQuickJumper: false,
                onChange: vm.setImportPreviewPage,
              }}
              scroll={{ x: 'max-content', y: 430 }}
              emptyTitle='Belum ada data yang dicek'
            />

            <div className='flex items-center justify-end gap-3 pt-2'>
              <AppButton
                onClick={vm.closeImportModal}
                variant='secondary'
                className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50'
                disabled={vm.isImportCommitting}
              >
                Batal
              </AppButton>

              <AppButton
                onClick={vm.handleCommitImport}
                loading={vm.isImportCommitting}
                disabled={!vm.canCommitImport}
                className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
              >
                Simpan Data Impor
              </AppButton>
            </div>
          </>
        ) : null}
      </div>
    </AppModal>
  );
}
