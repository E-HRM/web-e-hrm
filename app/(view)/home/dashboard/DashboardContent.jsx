'use client';

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, Cell } from 'recharts';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import useDashboardViewModel from './useDashboardViewModel';
import PerfomanceSection from './component_dashboard/PerfomanceSection';
import Top5Section from './component_dashboard/Top5Section';

function LeaveAvatar({ name = '' }) {
  return (
    <AppAvatar
      size={36}
      name={name}
      alt={name || 'User'}
      bordered={false}
    />
  );
}

function MiniCalendar({ year, monthIndex, today, eventsByDay, onPrevMonth, onNextMonth, onSelectDay }) {
  const first = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex]);
  const startOffset = useMemo(() => (first.getDay() + 6) % 7, [first]);
  const daysInMonth = useMemo(() => new Date(year, monthIndex + 1, 0).getDate(), [year, monthIndex]);

  const cells = useMemo(() => Array.from({ length: startOffset + daysInMonth }, (_, i) => (i < startOffset ? null : i - startOffset + 1)), [startOffset, daysInMonth]);

  const monthLabel = useMemo(
    () =>
      new Date(year, monthIndex, 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
    [year, monthIndex]
  );

  return (
    <div className='rounded-2xl bg-[#F2F8FF] p-3 h-full'>
      <div className='flex items-center justify-between'>
        <button
          type='button'
          onClick={onPrevMonth}
          className='h-7 w-7 rounded-md hover:bg-white/70 flex items-center justify-center'
          aria-label='Bulan sebelumnya'
        >
          <svg
            viewBox='0 0 24 24'
            className='h-4 w-4'
            fill='currentColor'
          >
            <path d='M15.4 7.4L14 6l-6 6 6 6 1.4-1.4L10.8 12z' />
          </svg>
        </button>

        <AppTypography.Text
          size={13}
          weight={800}
          className='text-gray-800'
        >
          {monthLabel}
        </AppTypography.Text>

        <button
          type='button'
          onClick={onNextMonth}
          className='h-7 w-7 rounded-md hover:bg-white/70 flex items-center justify-center'
          aria-label='Bulan berikutnya'
        >
          <svg
            viewBox='0 0 24 24'
            className='h-4 w-4'
            fill='currentColor'
          >
            <path d='M8.6 16.6L10 18l6-6-6-6-1.4 1.4L13.2 12z' />
          </svg>
        </button>
      </div>

      <div className='grid grid-cols-7 gap-y-2 mt-2 text-[11px] font-medium'>
        {['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].map((d, i) => (
          <div
            key={d}
            className={`text-center ${i === 6 ? 'text-rose-500' : 'text-gray-500'}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className='mt-1 grid grid-cols-7 gap-y-3 text-sm'>
        {cells.map((day, idx) => {
          if (!day)
            return (
              <div
                key={idx}
                className='h-10'
              />
            );

          const isToday = today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;

          const ev = eventsByDay?.[day];

          const handleClick = () => {
            if (!ev || !Array.isArray(ev.items) || ev.items.length === 0) return;
            if (typeof onSelectDay === 'function') onSelectDay(new Date(year, monthIndex, day), ev);
          };

          return (
            <div
              key={idx}
              className='h-10 relative group'
            >
              <div
                className={`mx-auto h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-violet-100 text-violet-700' : 'text-gray-700'} ${ev ? 'cursor-pointer hover:bg-white/80' : ''}`}
                title={ev?.tip || undefined}
                onClick={handleClick}
              >
                {day}
              </div>

              {ev?.color ? (
                <div className='absolute left-1/2 -translate-x-1/2 bottom-1 w-14'>
                  <span className={`block h-1 rounded-full ${ev.color}`} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const vm = useDashboardViewModel();

  const miniColors = useMemo(() => ['#D1D5DB', '#F5A524', '#E7B67E', '#E8C39B', '#EEE2CF'], []);
  const miniBars = Array.isArray(vm?.miniBars) ? vm.miniBars : [];
  const chartData = Array.isArray(vm?.chartData) ? vm.chartData : [];

  const perfTabs = Array.isArray(vm?.perfTabs) ? vm.perfTabs : [];
  const perfTab = vm?.perfTab || (perfTabs[0]?.key ?? 'late');
  const perfDivisionOptions = Array.isArray(vm?.perfDivisionOptions) ? vm.perfDivisionOptions : [{ label: '--Semua Divisi--', value: '' }];
  const currentPerfRows = Array.isArray(vm?.currentPerfRows) ? vm.currentPerfRows : [];

  const leaveList = Array.isArray(vm?.leaveList) ? vm.leaveList : [];

  const today = vm?.today ?? new Date();
  const calYear = Number.isFinite(vm?.calYear) ? vm.calYear : today.getFullYear();
  const calMonth = Number.isFinite(vm?.calMonth) ? vm.calMonth : today.getMonth();

  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const handleSelectDay = (date, ev) => {
    const items = Array.isArray(ev?.items) ? ev.items : [];
    if (!items.length) return;
    setSelectedDateInfo({ date, items });
  };

  return (
    <div className='mx-auto max-w-6xl px-4 py-6'>
      <div className='mb-4'>
        <AppGrid.Row
          className='mb-4'
          gutter={[0, 0]}
        >
          <AppGrid.Col span={24}>
            <div>
              <AppTypography.Text
                size={20}
                weight={800}
                className='text-gray-800'
              >
                Hello, HR!
              </AppTypography.Text>
            </div>

            <div>
              <AppTypography.Text
                size={12}
                tone='muted'
                className='text-gray-500'
              >
                {vm?.tanggalTampilan}
              </AppTypography.Text>
            </div>
          </AppGrid.Col>
        </AppGrid.Row>
      </div>

      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12 md:col-span-7 bg-white rounded-2xl shadow-sm p-4 pb-3'>
          <div className='flex items-center justify-between mb-2'>
            <AppTypography.Text
              size={13}
              weight={700}
              className='text-gray-700'
            >
              Total Karyawan
            </AppTypography.Text>

            <div className='h-8 w-8 rounded-full bg-[#F4F1FB] flex items-center justify-center'>
              <svg
                viewBox='0 0 24 24'
                className='h-4 w-4 text-[#7C5CFF]'
                fill='currentColor'
              >
                <path d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z' />
              </svg>
            </div>
          </div>

          <div className='mt-1 grid grid-cols-12 gap-6 h-[260px]'>
            <div className='col-span-3 flex'>
              <div className='m-auto text-5xl font-semibold text-gray-800 leading-none'>{vm?.totalKaryawan ?? 0}</div>
            </div>

            <div className='col-span-9'>
              <div className='w-full h-full'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <BarChart
                    data={miniBars}
                    barCategoryGap={24}
                    barSize={28}
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke='#EFF2F6'
                      strokeDasharray='3 3'
                    />
                    <XAxis
                      dataKey='label'
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      ticks={[0, 5, 10]}
                      allowDecimals={false}
                      label={{
                        angle: -90,
                        position: 'insideLeft',
                        offset: 8,
                        style: { fill: '#9CA3AF', fontSize: 11 },
                      }}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar
                      dataKey='value'
                      radius={[10, 10, 10, 10]}
                    >
                      {miniBars.map((_, i) => (
                        <Cell
                          key={i}
                          fill={miniColors[i % 5]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className='col-span-12 md:col-span-5 bg-white rounded-2xl shadow-sm p-4'>
          <MiniCalendar
            year={calYear}
            monthIndex={calMonth}
            today={today}
            eventsByDay={vm?.calendarEvents ?? {}}
            onPrevMonth={vm?.prevMonth}
            onNextMonth={vm?.nextMonth}
            onSelectDay={handleSelectDay}
          />
        </div>

        <div className='col-span-12 grid grid-cols-12 gap-4'>
          {[
            {
              value: vm?.totalKaryawan ?? 0,
              label: 'Karyawan',
              bg: 'bg-indigo-50',
              ring: 'ring-indigo-200/60',
              text: 'text-indigo-600',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z' />
                </svg>
              ),
            },
            {
              value: vm?.totalDivisi ?? 0,
              label: 'Divisi',
              bg: 'bg-orange-50',
              ring: 'ring-orange-200/60',
              text: 'text-orange-500',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M12 2l8 4v6c0 5-3.5 8-8 10C7.5 20 4 17 4 12V6l8-4zm0 2.2L6 6.7v5.3c0 3.9 2.9 6.6 6 8 3.1-1.4 6-4.1 6-8V6.7l-6-2.5z' />
                </svg>
              ),
            },
            {
              value: vm?.statCards?.lokasi ?? 0,
              label: 'Lokasi Kehadiran',
              bg: 'bg-rose-50',
              ring: 'ring-rose-200/60',
              text: 'text-rose-500',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z' />
                </svg>
              ),
            },
            {
              value: vm?.statCards?.presensi ?? 0,
              label: 'Presensi',
              bg: 'bg-slate-50',
              ring: 'ring-slate-200/60',
              text: 'text-slate-600',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z' />
                </svg>
              ),
            },
            {
              value: vm?.statCards?.admin ?? 0,
              label: 'Admin',
              bg: 'bg-emerald-50',
              ring: 'ring-emerald-200/60',
              text: 'text-emerald-600',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 7v-1c0-3 4-5 7-5s7 2 7 5v1H5z' />
                </svg>
              ),
            },
            {
              value: vm?.statCards?.polaKerja ?? 0,
              label: 'Pola Kerja',
              bg: 'bg-green-50',
              ring: 'ring-green-200/60',
              text: 'text-green-600',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M7 3h10v2H7V3zm5 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2v5l4 2-.8 1.8L11 13V7h1z' />
                </svg>
              ),
            },
            {
              value: vm?.statCards?.izin ?? 0,
              label: 'Izin (disetujui)',
              bg: 'bg-amber-50',
              ring: 'ring-amber-200/60',
              text: 'text-amber-500',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M4 15h6l2 3h8v2H11l-2-3H4v-2zm2-9a3 3 0 1 1 6 0v6H6V6zm9 3h5v7h-5V9z' />
                </svg>
              ),
            },
            {
              value: vm?.onLeaveCount ?? 0,
              label: 'Cuti (hari ini)',
              bg: 'bg-teal-50',
              ring: 'ring-teal-200/60',
              text: 'text-teal-600',
              icon: (
                <svg
                  viewBox='0 0 24 24'
                  className='h-6 w-6'
                  fill='currentColor'
                >
                  <path d='M20 6h-3V4a2 2 0 0 0-4 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 0 1 2 0v2h-2V4zM7 8h13v2H7V8zm0 4h13v6H7v-6z' />
                </svg>
              ),
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className='col-span-6 md:col-span-3'
            >
              <div className='h-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition'>
                <div className={`h-10 w-10 rounded-xl ring-1 flex items-center justify-center ${s.bg} ${s.ring} ${s.text}`}>{s.icon}</div>
                <div className='leading-tight'>
                  <div className='text-3xl font-semibold text-slate-800'>{s.value}</div>
                  <div className='text-sm text-slate-500 mt-0.5'>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='col-span-12 bg-white rounded-2xl shadow-sm p-4'>
          <div className='flex items-center justify-between mb-3'>
            <AppTypography.Text
              size={13}
              weight={700}
              className='text-gray-700'
            >
              Akumulasi Kehadiran
            </AppTypography.Text>

            <div className='flex items-center gap-2 text-xs text-gray-400'>
              <span>7 Hari Terakhir</span>
              <svg
                viewBox='0 0 24 24'
                className='h-3.5 w-3.5'
                fill='currentColor'
              >
                <path d='M12 8l6 6H6l6-6z' />
              </svg>
            </div>
          </div>

          <div className='h-[340px]'>
            <ResponsiveContainer
              width='100%'
              height='100%'
            >
              <BarChart
                data={chartData}
                barCategoryGap={16}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                />
                <XAxis
                  dataKey='name'
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  label={{
                    value: 'Jumlah',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    style: { fill: '#9CA3AF', fontSize: 11 },
                  }}
                  domain={[0, 20]}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RTooltip />
                <Legend
                  verticalAlign='bottom'
                  height={36}
                  iconType='circle'
                  wrapperStyle={{ paddingTop: 8 }}
                />
                <Bar
                  dataKey='Kedatangan'
                  fill='#3B82F6'
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey='Kepulangan'
                  fill='#10B981'
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='col-span-12'>
          <PerfomanceSection
            tabs={perfTabs}
            tab={perfTab}
            setTab={vm?.setPerfTab}
            date={vm?.perfDate}
            setDate={vm?.setPerfDate}
            division={vm?.perfDivision}
            setDivision={vm?.setPerfDivision}
            divisionOptions={perfDivisionOptions}
            q={vm?.perfQuery}
            setQ={vm?.setPerfQuery}
            rows={currentPerfRows}
          />
        </div>

        <div className='col-span-12'>
          <Top5Section
            period={vm?.top5Period}
            setPeriod={vm?.setTop5Period}
            leftRows={vm?.top5Late}
            rightRows={vm?.top5Discipline}
          />
        </div>

        <div className='col-span-12 bg-white rounded-2xl shadow-sm p-4'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-8 rounded-full bg-[#F4F1FB] flex items-center justify-center'>
                <svg
                  viewBox='0 0 24 24'
                  className='h-4 w-4 text-[#7C5CFF]'
                  fill='currentColor'
                >
                  <path d='M20 6h-3V4a2 2 0 0 0-4 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 0 1 2 0v2h-2V4zM7 8h13v2H7V8zm0 4h13v6H7v-6z' />
                </svg>
              </div>

              <AppTypography.Text
                size={13}
                weight={700}
                className='text-gray-700'
              >
                Karyawan Cuti
              </AppTypography.Text>
            </div>

            <span className='text-xs px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] font-medium'>
              {vm?.onLeaveCount ?? 0}/{vm?.totalKaryawan ?? 0}
            </span>
          </div>

          <div className='grid grid-cols-12 text-[11px] text-gray-400 mb-2 px-2'>
            <div className='col-span-9'>Nama Karyawan</div>
            <div className='col-span-3 text-right'>Waktu</div>
          </div>

          <div className='space-y-2'>
            {leaveList.length === 0 ? (
              <div className='px-2 py-2 text-xs text-gray-400'>Tidak ada data cuti.</div>
            ) : (
              leaveList.map((u, idx) => (
                <div
                  key={u?.id ?? idx}
                  className='grid grid-cols-12 items-center px-2 py-2'
                >
                  <div className='col-span-9 flex items-center gap-3'>
                    <LeaveAvatar name={u?.name ?? ''} />
                    <div>
                      <div className='text-sm font-medium text-gray-800'>{u?.name ?? '—'}</div>
                    </div>
                  </div>
                  <div className='col-span-3 text-right text-[11px] text-gray-500'>—</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AppModal
        open={!!selectedDateInfo}
        onClose={() => setSelectedDateInfo(null)}
        footer={null}
        title={
          selectedDateInfo
            ? `Karyawan cuti • ${selectedDateInfo.date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            : ''
        }
      >
        {selectedDateInfo && Array.isArray(selectedDateInfo.items) && selectedDateInfo.items.length > 0 ? (
          <div className='space-y-3'>
            {selectedDateInfo.items.map((item, idx) => (
              <div
                key={item?.id ?? idx}
                className='flex items-start gap-3 border-b border-gray-100 pb-2 last:border-b-0'
              >
                <LeaveAvatar name={item?.name ?? ''} />
                <div className='flex-1'>
                  <div className='text-sm font-medium text-gray-900'>{item?.name ?? '—'}</div>
                  <div className='text-xs text-gray-500'>
                    {item?.categoryName ?? '—'} • {item?.rangeLabel ?? '—'}
                  </div>
                  {item?.note ? <div className='mt-1 text-xs text-gray-600'>{item.note}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-xs text-gray-500'>Tidak ada karyawan cuti di tanggal ini.</div>
        )}
      </AppModal>
    </div>
  );
}
