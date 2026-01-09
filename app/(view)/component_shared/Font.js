import { Poppins } from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const fontClassName = poppins.className;
export const fontVariable = poppins.variable;
export const fontBodyClassName = `${poppins.className} ${poppins.variable}`;
export const fontFamily = poppins.style.fontFamily;
