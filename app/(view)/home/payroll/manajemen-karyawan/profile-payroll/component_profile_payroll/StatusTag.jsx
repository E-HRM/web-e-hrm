import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

import AppTag from '@/app/(view)/component_shared/AppTag';

export default function StatusTag({ active }) {
  if (active) {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        icon={<CheckCircleOutlined />}
        className='!font-medium'
      >
        Aktif
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='danger'
      variant='soft'
      size='sm'
      icon={<CloseCircleOutlined />}
      className='!font-medium'
    >
      Non-Aktif
    </AppTag>
  );
}
