"use client";

import { useState } from "react";
import DivisionCard from "../../../components/card/DivisionCard";
import AddDivisionCard from "../../../components/card/AddDivisionCard";
import EditDivisionModal from "../../../components/card/EditDivisionModal";
import { confirmDelete } from "../../../components/common/confirm";
import { useDepartementViewModel } from "./useDepartementViewModel";

export default function DepartementPage() {
  const { divisions, onAdd, onUpdate, onDelete } = useDepartementViewModel();

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (id, name) => {
    setEditId(id);
    setEditName(name);
    setEditOpen(true);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Data Karyawan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divisions.map((d) => (
          <DivisionCard
            key={d.id}
            name={d.name}
            count={d.count}
            align={d.align}
            onEdit={() => openEdit(d.id, d.name)}
            onDelete={() =>
              confirmDelete({
                onOk: async () => {
                  await onDelete(d.id);
                },
              })
            }
          />
        ))}
        <AddDivisionCard onAdd={onAdd} />
      </div>

      <EditDivisionModal
        open={editOpen}
        initialName={editName}
        loading={saving}
        onCancel={() => setEditOpen(false)}
        onSubmit={async (name) => {
          try {
            setSaving(true);
            await onUpdate(editId, name);
            setEditOpen(false);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
