"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Typography,
  Input,
  Button,
  Select,
  Row,
  Col,
  Card,
  Space,
  Tooltip,
  Modal,
  Empty,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import DepartmentCard from "../../../../components/card/DepartementCard";
import EditDivisionModal from "../../../../components/card/EditDivisionModal";
import { confirmDelete } from "../../../../components/common/confirm";
import { useDepartementViewModel } from "./useDepartementViewModel";
import { useAuth } from "../../../../utils/auth/authService";

const { Title } = Typography;

const THEME = {
  token: {
    colorPrimary: "#003A6F",
    colorPrimaryHover: "#C89B63",
    colorPrimaryActive: "#B98953",
    colorLink: "#003A6F",
    colorLinkHover: "#C89B63",
    colorLinkActive: "#B98953",
    controlOutline: "rgba(217,169,111,0.25)",
  },
  components: {
    Button: {
      defaultHoverBorderColor: "#003A6F",
      defaultActiveBorderColor: "#B98953",
      primaryShadow: "0 0 0 2px rgba(217,169,111,0.18)",
      linkHoverBg: "rgba(217,169,111,0.08)",
    },
    Input: {
      hoverBorderColor: "#003A6F",
      activeBorderColor: "#003A6F",
    },
    Select: {
      hoverBorderColor: "#003A6F",
      activeBorderColor: "#003A6F",
      optionSelectedBg: "rgba(217,169,111,0.10)",
      optionSelectedColor: "#3a2c17",
    },
    Pagination: {
      itemActiveBg: "#003A6F",
    },
  },
};

export default function DepartementContent() {
  const router = useRouter();
  const { divisions, departementLoading, onAdd, onUpdate, onDelete } = useDepartementViewModel();
  const { name } = useAuth();

  const [layout, setLayout] = useState("grid");     // "grid" | "list"
  const [orderBy, setOrderBy] = useState("name");   // "name" | "members"
  const [q, setQ] = useState("");

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (id, nm) => {
    setEditId(id);
    setEditName(nm);
    setEditOpen(true);
  };

  const goToEmployees = (d) => {
    router.push(
      `/home/kelola_karyawan/departement/karyawan?id=${encodeURIComponent(d.id)}&name=${encodeURIComponent(d.name)}`
    );
  };

  const filtered = useMemo(() => {
    const base = Array.isArray(divisions) ? divisions : [];
    const f = q.trim().toLowerCase();
    let res = f
      ? base.filter((d) => (d?.name || "").toLowerCase().includes(f))
      : base.slice();
    if (orderBy === "name") {
      res.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else {
      res.sort((a, b) => (b?.count || 0) - (a?.count || 0));
    }
    return res;
  }, [divisions, q, orderBy]);

  return (
        <div className="space-y-4 px-4 md:px-6 lg:px-8 py-5">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold">Data Departement</h2>

            {/* kiri: Search + Urutkan */}
            <div className="flex items-center gap-2 ml-auto md:ml-6">
                <Input.Search
                allowClear
                placeholder="Cari departemen…"
                onSearch={setQ}
                onChange={(e) => setQ(e.target.value)}
                className="w-52"             
                />
                <Select
                value={orderBy}
                onChange={setOrderBy}
                className="w-44"             
                options={[
                    { value: "name", label: "Urutkan: Nama" },
                    { value: "members", label: "Urutkan: Jumlah Karyawan" },
                ]}
                />
            </div>

            {/* kanan: tampilan + Tambah */}
            <div className="flex items-center gap-2">
                <Space.Compact>
                <Tooltip title="Tampilan Grid">
                    <Button
                    type={layout === "grid" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setLayout("grid")}
                    />
                </Tooltip>
                <Tooltip title="Tampilan List">
                    <Button
                    type={layout === "list" ? "primary" : "default"}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setLayout("list")}
                    />
                </Tooltip>
                </Space.Compact>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                Tambah
                </Button>
            </div>
        </div>


        {/* Grid/List */}
        {filtered.length === 0 ? (
          <Card loading={departementLoading}>
            <Empty description="Belum ada departemen" />
          </Card>
        ) : layout === "grid" ? (
          <Row gutter={[16, 16]}>
            {filtered.map((d) => (
              <Col key={d.id} xs={30} sm={12} xl={8} xxl={6}>
                <DepartmentCard
                  name={d.name}
                  count={d.count}
                  layout="grid"
                  onClick={() => goToEmployees(d)}
                  showActions
                  onEdit={() => openEdit(d.id, d.name)}
                  onDelete={() =>
                    confirmDelete({
                      onOk: async () => {
                        await onDelete(d.id);
                      },
                    })
                  }
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="space-y-2">
            {filtered.map((d) => (
              <DepartmentCard
                key={d.id}
                name={d.name}
                count={d.count}
                layout="list"
                onClick={() => goToEmployees(d)}
                showActions
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
          </div>
        )}

        {/* ADD Modal */}
        <Modal
          title="Tambah Departemen"
          open={addOpen}
          onOk={async () => {
            if (!addName.trim()) return;
            await onAdd(addName.trim());
            setAddOpen(false);
            setAddName("");
          }}
          okText="Simpan"
          onCancel={() => setAddOpen(false)}
          destroyOnClose
        >
          <Input
            autoFocus
            placeholder="Nama departemen"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onPressEnter={async () => {
              if (!addName.trim()) return;
              await onAdd(addName.trim());
              setAddOpen(false);
              setAddName("");
            }}
          />
        </Modal>

        {/* EDIT Modal (punyamu) */}
        <EditDivisionModal
          open={editOpen}
          initialName={editName}
          loading={saving}
          onCancel={() => setEditOpen(false)}
          onSubmit={async (nm) => {
            try {
              setSaving(true);
              await onUpdate(editId, nm);
              setEditOpen(false);
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
  );
}
