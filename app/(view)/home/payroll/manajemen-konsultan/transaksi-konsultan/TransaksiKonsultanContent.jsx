'use client';

import CreateModalSection from './components_transaksi_konsultan/CreateModalSection';
import DeleteModalSection from './components_transaksi_konsultan/DeleteModalSection';
import EditModalSection from './components_transaksi_konsultan/EditModalSection';
import HeaderSection from './components_transaksi_konsultan/HeaderSection';
import ImportModalSection from './components_transaksi_konsultan/ImportModalSection';
import PayoutInfoSection from './components_transaksi_konsultan/PayoutInfoSection';
import ShareInfoSection from './components_transaksi_konsultan/ShareInfoSection';
import SummarySection from './components_transaksi_konsultan/SummarySection';
import TransaksiTableSection from './components_transaksi_konsultan/TransaksiTableSection';
import useTransaksiKonsultanViewModel from './useTransaksiKonsultanViewModel';

export default function TransaksiKonsultanContent() {
  const vm = useTransaksiKonsultanViewModel();

  return (
    <div className='p-8'>
      <HeaderSection vm={vm} />
      <SummarySection vm={vm} />
      <TransaksiTableSection vm={vm} />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <ShareInfoSection />
        <PayoutInfoSection />
      </div>

      <CreateModalSection vm={vm} />
      <EditModalSection vm={vm} />
      <DeleteModalSection vm={vm} />
      <ImportModalSection vm={vm} />
    </div>
  );
}
