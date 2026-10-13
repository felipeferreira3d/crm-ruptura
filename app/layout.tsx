import type {Metadata} from "next";
import "./globals.css";
import "./crm.css";
export const metadata:Metadata={title:"Ruptura CRM — Meu estúdio",description:"Clientes, oportunidades, projetos e financeiro do seu estúdio criativo.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
