import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Colmado ERP | Administración',description:'Sistema de inventario, ventas, caja y facturación para colmados de República Dominicana',applicationName:'Colmado ERP'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
