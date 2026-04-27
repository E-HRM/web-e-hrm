import AppTag from '@/app/(view)/component_shared/AppTag';

export default function DirectionTag({ value }) {
  const isPotongan = value === 'POTONGAN';

  return (
    <AppTag
      tone={isPotongan ? 'danger' : 'success'}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {isPotongan ? 'Potongan' : 'Pemasukan'}
    </AppTag>
  );
}
