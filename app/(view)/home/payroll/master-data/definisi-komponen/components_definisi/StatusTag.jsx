import AppTag from '@/app/(view)/component_shared/AppTag';

export default function StatusTag({ active }) {
  if (active) {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        Aktif
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='neutral'
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      Tidak Aktif
    </AppTag>
  );
}
