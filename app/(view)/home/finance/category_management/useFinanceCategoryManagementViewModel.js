'use client';

import { useCallback, useMemo, useState } from 'react';

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applySearch(list, q) {
  const s = (q || '').toLowerCase().trim();
  if (!s) return list;
  return list.filter((x) => (x?.nama || '').toLowerCase().includes(s) || (x?.deskripsi || '').toLowerCase().includes(s));
}

function slicePage(list, page, pageSize) {
  const p = page || 1;
  const ps = pageSize || 10;
  const start = (p - 1) * ps;
  return list.slice(start, start + ps);
}

export default function useFinanceCategoryManagementViewModel() {
  const [activeTab, setActiveTab] = useState('payment'); // payment | pocket_money | reimburses
  const [search, setSearch] = useState('');

  // dummy data
  const [itemsPayment, setItemsPayment] = useState([
    { id: 'pay-1', nama: 'Sponsorship', deskripsi: 'Pembayaran sponsorship event' },
    { id: 'pay-2', nama: 'Vendor', deskripsi: 'Pembayaran vendor eksternal' },
  ]);

  const [itemsPocketMoney, setItemsPocketMoney] = useState([
    { id: 'pm-1', nama: 'Transport', deskripsi: 'Uang muka untuk transport' },
    { id: 'pm-2', nama: 'Konsumsi', deskripsi: 'Uang muka konsumsi kegiatan' },
  ]);

  const [itemsReimburses, setItemsReimburses] = useState([
    { id: 'rb-1', nama: 'ATK', deskripsi: 'Reimburse pembelian ATK' },
    { id: 'rb-2', nama: 'Operasional', deskripsi: 'Reimburse pengeluaran operasional' },
  ]);

  // pagination per tab
  const [pagPayment, setPagPayment] = useState({ page: 1, pageSize: 10 });
  const [pagPocketMoney, setPagPocketMoney] = useState({ page: 1, pageSize: 10 });
  const [pagReimburses, setPagReimburses] = useState({ page: 1, pageSize: 10 });

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [modalKind, setModalKind] = useState('payment'); // payment | pocket_money | reimburses
  const [editingItem, setEditingItem] = useState(null);

  const openCreate = useCallback((kind) => {
    setModalMode('create');
    setModalKind(kind);
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((kind, item) => {
    setModalMode('edit');
    setModalKind(kind);
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const deleteItem = useCallback((kind, item) => {
    if (!item?.id) return;

    if (kind === 'payment') setItemsPayment((prev) => prev.filter((x) => x.id !== item.id));
    else if (kind === 'pocket_money') setItemsPocketMoney((prev) => prev.filter((x) => x.id !== item.id));
    else setItemsReimburses((prev) => prev.filter((x) => x.id !== item.id));
  }, []);

  const submitForm = useCallback(
    async (values) => {
      const payload = {
        nama: values?.nama_kategori?.trim() || '',
        deskripsi: values?.deskripsi?.trim() || '',
      };

      if (!payload.nama) return;

      const kind = modalKind;

      if (modalMode === 'create') {
        const newItem = { id: makeId(kind), ...payload };

        if (kind === 'payment') setItemsPayment((prev) => [newItem, ...prev]);
        else if (kind === 'pocket_money') setItemsPocketMoney((prev) => [newItem, ...prev]);
        else setItemsReimburses((prev) => [newItem, ...prev]);

        // reset page to 1 for that tab
        if (kind === 'payment') setPagPayment((p) => ({ ...p, page: 1 }));
        if (kind === 'pocket_money') setPagPocketMoney((p) => ({ ...p, page: 1 }));
        if (kind === 'reimburses') setPagReimburses((p) => ({ ...p, page: 1 }));
      } else {
        const id = editingItem?.id;

        if (kind === 'payment') setItemsPayment((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
        else if (kind === 'pocket_money') setItemsPocketMoney((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
        else setItemsReimburses((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
      }
    },
    [modalKind, modalMode, editingItem?.id]
  );

  const onPageChange = useCallback((kind, page, pageSize) => {
    if (kind === 'payment') setPagPayment({ page, pageSize });
    else if (kind === 'pocket_money') setPagPocketMoney({ page, pageSize });
    else setPagReimburses({ page, pageSize });
  }, []);

  // filtered + paginated views
  const computed = useMemo(() => {
    const fPay = applySearch(itemsPayment, search);
    const fPm = applySearch(itemsPocketMoney, search);
    const fRb = applySearch(itemsReimburses, search);

    const pay = slicePage(fPay, pagPayment.page, pagPayment.pageSize);
    const pm = slicePage(fPm, pagPocketMoney.page, pagPocketMoney.pageSize);
    const rb = slicePage(fRb, pagReimburses.page, pagReimburses.pageSize);

    return {
      fPay,
      fPm,
      fRb,
      pay,
      pm,
      rb,
      totals: {
        payment: fPay.length,
        pocket_money: fPm.length,
        reimburses: fRb.length,
      },
    };
  }, [
    itemsPayment,
    itemsPocketMoney,
    itemsReimburses,
    search,
    pagPayment.page,
    pagPayment.pageSize,
    pagPocketMoney.page,
    pagPocketMoney.pageSize,
    pagReimburses.page,
    pagReimburses.pageSize,
  ]);

  return {
    activeTab,
    setActiveTab,

    search,
    setSearch,

    itemsPaymentView: computed.pay,
    itemsPocketMoneyView: computed.pm,
    itemsReimbursesView: computed.rb,

    totals: computed.totals,

    pagPayment: { ...pagPayment, total: computed.totals.payment },
    pagPocketMoney: { ...pagPocketMoney, total: computed.totals.pocket_money },
    pagReimburses: { ...pagReimburses, total: computed.totals.reimburses },

    onPageChange,

    modalOpen,
    setModalOpen,
    modalMode,
    modalKind,
    editingItem,

    openCreate,
    openEdit,
    deleteItem,
    submitForm,
  };
}
