import 'antd/dist/reset.css';
import './globals.css';
import 'react-quill/dist/quill.snow.css';

import LayoutClient from './layout-client';
import { App, ConfigProvider } from 'antd';
import { fontBodyClassName, fontFamily } from './(view)/component_shared/Font';

export const metadata = {
  title: 'E-HRM',
  description: 'HR Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={fontBodyClassName}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily,
              fontFamilyCode: fontFamily,
            },
          }}
        >
          <App>
            <LayoutClient>{children}</LayoutClient>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}