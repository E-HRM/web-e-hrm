"use client";

import React from "react";
import { Table } from "antd";

export default function ApprovalTable({
  columns,
  dataSource,
  page,
  pageSize,
  total,
  onChangePage,
  loading,
  pageSizeOptions = [10, 20, 50],
  scrollX = 1200,
  scrollY = 600,
}) {
  const safeTotal =
    typeof total === "number"
      ? total
      : Array.isArray(dataSource)
      ? dataSource.length
      : 0;

  return (
    <>
      <Table
        columns={columns}
        dataSource={dataSource}
        size="middle"
        tableLayout="fixed"
        sticky
        pagination={{
          current: page,
          pageSize,
          total: safeTotal,
          pageSizeOptions,
          showSizeChanger: true,
          showTotal: (t, range) =>
            `${range[0]}-${range[1]} dari ${t} data`,
          onChange: onChangePage,
        }}
        scroll={{ x: scrollX, y: scrollY }}
        loading={loading}
        rowClassName={() => "approval-table-row"}
      />

      <style jsx global>{`
        /* pastikan semua sel putih & rata atas */
        .approval-table-row > td {
          background-color: #ffffff !important;
          vertical-align: top !important;
        }

        /* hilangkan efek hover abu-abu TANPA tembus pandang */
        .ant-table-tbody > tr.approval-table-row:hover > td {
          background-color: #ffffff !important;
        }

        /* sticky kiri/kanan juga putih */
        .ant-table-tbody
          > tr.approval-table-row
          > td.ant-table-cell-fix-left,
        .ant-table-tbody
          > tr.approval-table-row
          > td.ant-table-cell-fix-right {
          background-color: #ffffff !important;
        }

        /* matikan shadow garis vertikal sticky kolom */
        .ant-table-cell-fix-right-first::after,
        .ant-table-cell-fix-left-last::after {
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
}
