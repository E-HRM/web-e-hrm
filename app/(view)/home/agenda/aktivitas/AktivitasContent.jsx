"use client";

import { Card, List, Button, Skeleton, Empty, Tag } from "antd";
import useAktivitasViewModel from "./AktivitasViewModel";

const BRAND = { accent: "#D9A96F", dark: "#0A3848" };

export default function AktivitasContent() {
  const { loading, tasks, toggle, refresh } = useAktivitasViewModel();

  return (
    <div className="p-4">
      <Card
        title="Aktivitas Harian"
        extra={
          <Button style={{ background: BRAND.accent, color: BRAND.dark }} onClick={refresh}>
            Refresh
          </Button>
        }
      >
        {loading ? (
          <Skeleton active />
        ) : tasks.length ? (
          <List
            dataSource={tasks}
            renderItem={(t) => (
              <List.Item actions={[<a onClick={() => toggle(t.id)} key="tgl">Toggle</a>]}>
                <List.Item.Meta title={t.title} description={t.time} />
                <Tag color={t.done ? "success" : "default"}>{t.done ? "Selesai" : "Belum"}</Tag>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Belum ada aktivitas" />
        )}
      </Card>
    </div>
  );
}
