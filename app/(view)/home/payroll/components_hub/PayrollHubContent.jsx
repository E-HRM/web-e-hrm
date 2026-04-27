'use client';

import { Fragment } from 'react';
import { ArrowRightOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, RightOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function AvailabilityTag({ status }) {
  if (status === 'ready') {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        className='!font-semibold'
      >
        Siap Digunakan
      </AppTag>
    );
  }

  if (status === 'temporary') {
    return (
      <AppTag
        tone='info'
        variant='soft'
        size='sm'
        className='!font-semibold'
      >
        Mapping Sementara
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='warning'
      variant='soft'
      size='sm'
      className='!font-semibold'
    >
      Tahap Berikutnya
    </AppTag>
  );
}

function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className='mb-3 flex flex-wrap items-center gap-1.5'>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={item.key || item.href || item.label}>
            {index > 0 ? <RightOutlined className='text-[10px] text-slate-400' /> : null}

            {item.href && !isLast ? (
              <AppButton
                variant='text'
                href={item.href}
                className='!h-auto !px-0 !py-0 !text-xs !font-medium !text-slate-500 hover:!text-[#003A6F]'
              >
                {item.label}
              </AppButton>
            ) : (
              <AppTypography.Text
                size={12}
                weight={isLast ? 600 : 500}
                className={isLast ? 'text-slate-700' : 'text-slate-500'}
              >
                {item.label}
              </AppTypography.Text>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function HubActionButton({ item }) {
  if (!item.href) {
    return (
      <AppButton
        variant='outline'
        disabled
        className='!h-10 !rounded-lg !border-slate-300 !px-4 !font-semibold !text-slate-400'
      >
        {item.disabledCtaLabel || 'Tahap Berikutnya'}
      </AppButton>
    );
  }

  return (
    <AppButton
      href={item.href}
      variant='outline'
      icon={<ArrowRightOutlined />}
      className='!h-10 !rounded-lg !border-[#003A6F] !px-4 !font-semibold !text-[#003A6F] hover:!border-[#003E86] hover:!text-[#003E86]'
    >
      {item.ctaLabel || 'Buka Halaman'}
    </AppButton>
  );
}

function HubItemCard({ item, showStatusTag = true }) {
  const Icon = item.icon;

  return (
    <AppCard
      rounded='xl'
      shadow='none'
      ring={false}
      className='h-full border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex h-full flex-col'>
        <div className={`mb-5 flex items-start gap-4 ${showStatusTag ? 'justify-between' : 'justify-start'}`}>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconWrapClassName}`}>
            <Icon className={`text-2xl ${item.iconClassName}`} />
          </div>

          {showStatusTag ? <AvailabilityTag status={item.status} /> : null}
        </div>

        <div className='mb-6 min-h-[136px]'>
          <AppTypography.Text
            size={20}
            weight={700}
            className='mb-2 block text-gray-900'
          >
            {item.title}
          </AppTypography.Text>

          <AppTypography.Text
            size={14}
            className='mb-3 block leading-6 text-gray-600'
          >
            {item.description}
          </AppTypography.Text>

          {item.helperText ? (
            <AppTypography.Text
              size={12}
              className='block leading-5 text-slate-500'
            >
              {item.helperText}
            </AppTypography.Text>
          ) : null}
        </div>

        <div className='mt-auto'>
          <HubActionButton item={item} />
        </div>
      </div>
    </AppCard>
  );
}

export default function PayrollHubContent({ title, description, items, breadcrumbItems = [], showHeaderSummary = true, showStatusTag = true }) {
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const temporaryCount = items.filter((item) => item.status === 'temporary').length;
  const upcomingCount = items.filter((item) => item.status === 'upcoming').length;

  return (
    <div className='p-8'>
      <div className={showHeaderSummary ? 'mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between' : 'mb-8'}>
        <div>
          <Breadcrumbs items={breadcrumbItems} />

          <AppTypography.Title
            level={3}
            className='!mb-1 !text-gray-900'
          >
            {title}
          </AppTypography.Title>

          <AppTypography.Text className='block max-w-3xl leading-6 text-gray-600'>{description}</AppTypography.Text>
        </div>

        {showHeaderSummary ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[430px]'>
            <AppCard
              rounded='xl'
              shadow='none'
              ring={false}
              className='border border-emerald-200 bg-emerald-50'
              bodyStyle={{ padding: 18 }}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100'>
                  <CheckCircleOutlined className='text-lg text-emerald-600' />
                </div>

                <div>
                  <AppTypography.Text
                    size={22}
                    weight={700}
                    className='block text-emerald-700'
                  >
                    {readyCount}
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='text-emerald-700'
                  >
                    Siap digunakan
                  </AppTypography.Text>
                </div>
              </div>
            </AppCard>

            <AppCard
              rounded='xl'
              shadow='none'
              ring={false}
              className='border border-blue-200 bg-blue-50'
              bodyStyle={{ padding: 18 }}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                  <CalendarOutlined className='text-lg text-blue-600' />
                </div>

                <div>
                  <AppTypography.Text
                    size={22}
                    weight={700}
                    className='block text-blue-700'
                  >
                    {temporaryCount}
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='text-blue-700'
                  >
                    Mapping sementara
                  </AppTypography.Text>
                </div>
              </div>
            </AppCard>

            <AppCard
              rounded='xl'
              shadow='none'
              ring={false}
              className='border border-amber-200 bg-amber-50'
              bodyStyle={{ padding: 18 }}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100'>
                  <ClockCircleOutlined className='text-lg text-amber-600' />
                </div>

                <div>
                  <AppTypography.Text
                    size={22}
                    weight={700}
                    className='block text-amber-700'
                  >
                    {upcomingCount}
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='text-amber-700'
                  >
                    Tahap berikutnya
                  </AppTypography.Text>
                </div>
              </div>
            </AppCard>
          </div>
        ) : null}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
        {items.map((item) => (
          <HubItemCard
            key={item.key}
            item={item}
            showStatusTag={showStatusTag}
          />
        ))}
      </div>
    </div>
  );
}
