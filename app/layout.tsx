import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Sichere Nacht | Ajax Alarmanlagen', description: 'Individuelle Ajax Alarmanlagen konfigurieren. Optional mit Montage in Hamburg und Umgebung.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>}
