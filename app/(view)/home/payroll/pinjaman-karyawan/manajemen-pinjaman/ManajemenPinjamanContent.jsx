'use client';

import useManajemenPinjamanViewModel from './useManajemenPinjamanViewModel';
import CreatePinjamanModalSection from './components_pinjaman/CreatePinjamanModalSection';
import DeletePinjamanModalSection from './components_pinjaman/DeletePinjamanModalSection';
import DetailPinjamanModalSection from './components_pinjaman/DetailPinjamanModalSection';
import EditPinjamanModalSection from './components_pinjaman/EditPinjamanModalSection';
import HeaderSection from './components_pinjaman/HeaderSection';
import PinjamanListSection from './components_pinjaman/PinjamanListSection';
import SummarySection from './components_pinjaman/SummarySection';

export default function ManajemenPinjamanContent() {
  const vm = useManajemenPinjamanViewModel();

  return (
    <div className='p-8'>
      <HeaderSection vm={vm} />
      <SummarySection vm={vm} />
      <PinjamanListSection vm={vm} />
      <CreatePinjamanModalSection vm={vm} />
      <EditPinjamanModalSection vm={vm} />
      <DetailPinjamanModalSection vm={vm} />
      <DeletePinjamanModalSection vm={vm} />
    </div>
  );
}
