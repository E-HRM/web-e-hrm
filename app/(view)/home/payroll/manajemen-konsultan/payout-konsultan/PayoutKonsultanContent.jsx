'use client';

import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import PayoutKonsultanCreateModalSection from './components/PayoutKonsultanCreateModalSection';
import PayoutKonsultanDeleteModalSection from './components/PayoutKonsultanDeleteModalSection';
import PayoutKonsultanEditModalSection from './components/PayoutKonsultanEditModalSection';
import PayoutKonsultanHeaderSection from './components/PayoutKonsultanHeaderSection';
import PayoutKonsultanInfoSection from './components/PayoutKonsultanInfoSection';
import PayoutKonsultanListSection from './components/PayoutKonsultanListSection';
import PayoutKonsultanPostModalSection from './components/PayoutKonsultanPostModalSection';
import PayoutKonsultanStatusCountSection from './components/PayoutKonsultanStatusCountSection';
import PayoutKonsultanSummarySection from './components/PayoutKonsultanSummarySection';
import usePayoutKonsultanViewModel from './usePayoutKonsultanViewModel';

export default function PayoutKonsultanContent() {
  const vm = usePayoutKonsultanViewModel();

  if (!vm.auth.isLoading && !vm.canAccess) {
    return (
      <div className='p-8'>
        <AppEmpty.Card
          title='Akses Ditolak'
          description='Modul payout konsultan hanya tersedia untuk HR, Direktur, dan Superadmin.'
        />
      </div>
    );
  }

  return (
    <div className='p-8'>
      <PayoutKonsultanHeaderSection
        filterPeriode={vm.filterPeriode}
        setFilterPeriode={vm.setFilterPeriode}
        periodeOptions={vm.filterPeriodeOptions}
        activePeriode={vm.activeFilterPeriode}
        formatPeriodeKonsultanLabel={vm.formatPeriodeKonsultanLabel}
        onCreate={vm.openCreateModal}
        onReload={vm.reloadData}
        loading={vm.loading}
        refreshing={vm.refreshing}
      />

      <PayoutKonsultanSummarySection
        summary={vm.summary}
        formatCurrency={vm.formatCurrency}
      />

      <PayoutKonsultanStatusCountSection statusCounts={vm.statusCounts} />

      <PayoutKonsultanListSection
        loading={vm.loading}
        payoutWithMeta={vm.filteredPayoutWithMeta}
        pendingActionId={vm.pendingActionId}
        formatCurrency={vm.formatCurrency}
        formatDate={vm.formatDate}
        onApprovePayout={vm.handleApprovePayout}
        onEditPayout={vm.openEditModal}
        onDeletePayout={vm.openDeleteDialog}
        onPostToPayroll={vm.openPostModal}
        onUnpostPayout={vm.handleUnpostPayout}
        onHoldPayment={vm.handleHoldPayment}
        onReleaseHold={vm.handleReleaseHold}
      />

      <PayoutKonsultanInfoSection />

      <PayoutKonsultanCreateModalSection
        open={vm.isCreateModalOpen}
        onClose={vm.closeCreateModal}
        formData={vm.formData}
        consultantOptions={vm.createConsultantOptions}
        periodeOptions={vm.periodeKonsultanOptions}
        setFormValue={vm.setFormValue}
        formSummary={vm.formSummary}
        eligibleTransactions={vm.selectedEligibleTransactions}
        toggleHeldTransaction={vm.toggleHeldTransaction}
        nominalDibayarkanPreview={vm.nominalDibayarkanPreview}
        formatCurrency={vm.formatCurrency}
        formatDate={vm.formatDate}
        formatPeriodeKonsultanLabel={vm.formatPeriodeKonsultanLabel}
        isSubmitting={vm.isSubmitting}
        isPreviewLoading={vm.isPreviewLoading}
        onSubmit={vm.handleCreate}
      />

      <PayoutKonsultanEditModalSection
        open={vm.isEditModalOpen}
        onClose={vm.closeEditModal}
        formData={vm.formData}
        consultantOptions={vm.identityConsultantOptions}
        periodeOptions={vm.periodeKonsultanOptions}
        setFormValue={vm.setFormValue}
        formSummary={vm.formSummary}
        eligibleTransactions={vm.selectedEligibleTransactions}
        toggleHeldTransaction={vm.toggleHeldTransaction}
        nominalDibayarkanPreview={vm.nominalDibayarkanPreview}
        formatCurrency={vm.formatCurrency}
        formatDate={vm.formatDate}
        formatPeriodeKonsultanLabel={vm.formatPeriodeKonsultanLabel}
        isSubmitting={vm.isSubmitting}
        isPreviewLoading={vm.isPreviewLoading}
        onSubmit={vm.handleEdit}
      />

      <PayoutKonsultanDeleteModalSection
        open={vm.isDeleteDialogOpen}
        onClose={vm.closeDeleteDialog}
        selectedPayout={vm.selectedPayout}
        isSubmitting={vm.isSubmitting}
        onSubmit={vm.handleDelete}
      />

      <PayoutKonsultanPostModalSection
        open={vm.isPostModalOpen}
        onClose={vm.closePostModal}
        selectedPayout={vm.selectedPayout}
        postingSummary={vm.selectedPayoutPostingSummary}
        postFormData={vm.postFormData}
        payrollOptions={vm.payrollOptions}
        definisiKomponenOptions={vm.definisiKomponenOptions}
        selectedDefinition={vm.selectedPostingDefinition}
        setPostFormValue={vm.setPostFormValue}
        formatCurrency={vm.formatCurrency}
        isDefinisiKomponenLoading={vm.isDefinisiKomponenLoading}
        isSubmitting={vm.isSubmitting}
        onSubmit={vm.handlePostToPayroll}
      />
    </div>
  );
}
