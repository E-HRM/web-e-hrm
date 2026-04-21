'use client';

import HeaderSection from './components_cicilan/HeaderSection';
import SummarySection from './components_cicilan/SummarySection';
import FilterSection from './components_cicilan/FilterSection';
import CicilanTableSection from './components_cicilan/CicilanTableSection';
import DetailCicilanModalSection from './components_cicilan/DetailCicilanModalSection';
import PostToPayrollModalSection from './components_cicilan/PostToPayrollModalSection';
import useTagihanCicilanPinjamanViewModel from './useTagihanCicilanPinjamanViewModel';

export default function TagihanCicilanPinjamanContent() {
  const vm = useTagihanCicilanPinjamanViewModel();

  return (
    <div className='p-8'>
      <HeaderSection vm={vm} />
      <SummarySection vm={vm} />
      <FilterSection vm={vm} />
      <CicilanTableSection vm={vm} />
      <DetailCicilanModalSection vm={vm} />
      <PostToPayrollModalSection vm={vm} />
    </div>
  );
}
