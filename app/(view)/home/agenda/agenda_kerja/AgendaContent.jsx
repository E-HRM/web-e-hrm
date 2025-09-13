"use client";

import { Card, List, Button, Skeleton, Empty, Typography } from "antd";
import useAgendaViewModel from "./AgendaViewModel";

const BRAND = { accent: "#D9A96F", dark: "#0A3848" };

export default function AgendaContent() {
  const { loading, items, refresh } = useAgendaViewModel();

  return (
    <div className="p-4">
      <Card
        title="Agenda Kerja"
        extra={
          <Button style={{ background: BRAND.accent, color: BRAND.dark }} onClick={refresh}>
            Refresh
          </Button>
        }
      >
        {loading ? (
          <Skeleton active />
        ) : items.length ? (
          <List
            dataSource={items}
            renderItem={(it) => (
              <List.Item>
                <List.Item.Meta title={it.title} description={it.date} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Belum ada agenda" />
        )}
      </Card>
      <Typography.Paragraph className="mt-3 opacity-70">
        *Tampilan sementara untuk validasi routing & integrasi.
      </Typography.Paragraph>
    </div>
  );
}
