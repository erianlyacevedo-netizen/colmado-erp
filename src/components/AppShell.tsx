'use client';
import {useEffect,useRef,useState} from 'react';
import {LayoutDashboard,ShoppingCart,Package,Boxes,Tags,Truck,Users,HandCoins,ReceiptText,Wallet,ArrowDownUp,ChartNoAxesCombined,CircleDollarSign,ClipboardList,Bike,TicketPercent,UserCog,Settings,ShieldCheck,Store,Menu,X,LogOut,Moon,Sun,Search,Building2,ChevronDown,Activity,PackagePlus,History} from 'lucide-react';
import Dashboard from './Dashboard';
import ManagePage from './ManagePage';
import POS from './POS';
import {PurchasesPage,InventoryPage,CreditsPage,CashPage,InvoicesPage,PayablesPage,ReportsPage,SettingsPage,UsersPage,AuditPage} from './Operations';
import type {Notify} from './shared';
import {api} from './shared';
type Props={user:{id:string;name:string;email:string;role:string;business:string;branch:string}};
type Nav={id:string;label:string;icon:React.ComponentType<{size?:number}>;section:string;action?:string};
const navigation:Nav[]=[
 {id:'inicio',label:'Panel general',icon:LayoutDashboard,section:'GENERAL'},
 {id:'pos',label:'Punto de venta',icon:ShoppingCart,section:'GENERAL',action:'sell'},
 {id:'facturas',label:'Facturación',icon:ReceiptText,section:'GENERAL'},
 {id:'productos',label:'Productos y fotografías',icon:Package,section:'INVENTARIO'},
 {id:'movimientos',label:'Movimientos de stock',icon:ArrowDownUp,section:'INVENTARIO',action:'inventory'},
 {id:'categorias',label:'Categorías',icon:Tags,section:'INVENTARIO'},
 {id:'compras',label:'Compras',icon:PackagePlus,section:'INVENTARIO',action:'inventory'},
 {id:'proveedores',label:'Proveedores',icon:Truck,section:'INVENTARIO'},
 {id:'clientes',label:'Clientes',icon:Users,section:'CLIENTES'},
 {id:'fiados',label:'Fiados y abonos',icon:HandCoins,section:'CLIENTES',action:'sell'},
 {id:'caja',label:'Control de caja',icon:Wallet,section:'FINANZAS',action:'sell'},
 {id:'gastos',label:'Gastos',icon:CircleDollarSign,section:'FINANZAS',action:'finance'},
 {id:'pagos',label:'Cuentas por pagar',icon:ClipboardList,section:'FINANZAS',action:'finance'},
 {id:'reportes',label:'Reportes y estadísticas',icon:ChartNoAxesCombined,section:'FINANZAS',action:'finance'},
 {id:'entregas',label:'Pedidos y delivery',icon:Bike,section:'OPERACIONES'},
 {id:'promociones',label:'Promociones',icon:TicketPercent,section:'OPERACIONES',action:'manage'},
 {id:'usuarios',label:'Empleados y usuarios',icon:UserCog,section:'ADMINISTRACIÓN',action:'users'},
 {id:'auditoria',label:'Auditoría',icon:ShieldCheck,section:'ADMINISTRACIÓN',action:'manage'},
 {id:'configuracion',label:'Configuración',icon:Settings,section:'ADMINISTRACIÓN',action:'manage'}
];
const sectionNames:Record<string,string>={inicio:'Panel general',pos:'Punto de venta',facturas:'Facturación',productos:'Productos e inventario',movimientos:'Movimientos de inventario',categorias:'Categorías',compras:'Compras a proveedores',proveedores:'Proveedores',clientes:'Clientes',fiados:'Fiados y abonos',caja:'Control de caja',gastos:'Gastos',pagos:'Cuentas por pagar',reportes:'Centro de reportes',entregas:'Pedidos y delivery',promociones:'Promociones',usuarios:'Empleados y usuarios',auditoria:'Auditoría',configuracion:'Configuración'};
export default function AppShell({user}:Props){const [section,setSection]=useState('inicio');const [sidebarOpen,setSidebarOpen]=useState(false);const [dark,setDark]=useState(false);const [message,setMessage]=useState<{text:string;bad:boolean}|null>(null);const [keyword,setKeyword]=useState('');const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const allowed=(action?:string)=>{if(!action)return true;if(['PROPIETARIO','ADMINISTRADOR'].includes(user.role))return true;const p:Record<string,string[]>={SUPERVISOR:['sell','inventory','finance','manage'],CAJERO:['sell'],INVENTARIO:['inventory'],CONTADOR:['finance'],REPARTIDOR:[]};return (p[user.role]||[]).includes(action);};
 const notify:Notify=(text,bad=false)=>{setMessage({text,bad});if(timeout.current)clearTimeout(timeout.current);timeout.current=setTimeout(()=>setMessage(null),5000);};
 function navigate(id:string){if(!sectionNames[id])return;setSection(id);setSidebarOpen(false);history.replaceState(null,'',id==='inicio'?'/':`/?modulo=${encodeURIComponent(id)}`);window.scrollTo({top:0,behavior:'smooth'});}
 useEffect(()=>{const query=new URLSearchParams(window.location.search).get('modulo');if(query&&sectionNames[query])setSection(query);const saved=localStorage.getItem('colmado_tema');setDark(saved==='oscuro');return()=>{if(timeout.current)clearTimeout(timeout.current);};},[]);
 function toggleTheme(){setDark(p=>{localStorage.setItem('colmado_tema',!p?'oscuro':'claro');return !p;});}
 async function logout(){try{await api('/api/auth/logout','POST');location.href='/iniciar-sesion';}catch(e){notify((e as Error).message,true);}}
 const readonly=!allowed('inventory');
 function display(){switch(section){case'inicio':return <Dashboard navigate={navigate}/>;case'pos':return <POS notify={notify} navigate={navigate}/>;case'facturas':return <InvoicesPage notify={notify} canReturn={allowed('manage')}/>;case'productos':return <ManagePage resource="productos" notify={notify} readonly={readonly} searchDefault={keyword}/>;case'movimientos':return <InventoryPage notify={notify}/>;case'categorias':return <ManagePage resource="categorias" notify={notify} readonly={readonly}/>;case'compras':return <PurchasesPage notify={notify}/>;case'proveedores':return <ManagePage resource="proveedores" notify={notify} readonly={readonly}/>;case'clientes':return <ManagePage resource="clientes" notify={notify} readonly={!allowed('sell')}/>;case'fiados':return <CreditsPage notify={notify}/>;case'caja':return <CashPage notify={notify} userId={user.id}/>;case'gastos':return <ManagePage resource="gastos" notify={notify}/>;case'pagos':return <PayablesPage notify={notify}/>;case'reportes':return <ReportsPage/>;case'entregas':return <ManagePage resource="entregas" notify={notify} readonly={!allowed('sell')}/>;case'promociones':return <ManagePage resource="promociones" notify={notify}/>;case'usuarios':return <UsersPage notify={notify}/>;case'auditoria':return <AuditPage/>;case'configuracion':return <SettingsPage notify={notify}/>;default:return <Dashboard navigate={navigate}/>;}}
 const visible=navigation.filter(n=>allowed(n.action));const groups=['GENERAL','INVENTARIO','CLIENTES','FINANZAS','OPERACIONES','ADMINISTRACIÓN'];
 return <div className={'app-shell '+(dark?'dark':'')}><aside className={'sidebar '+(sidebarOpen?'mobile-open':'')}><div className="brand"><span className="brand-icon"><Store size={24}/></span><span>Colmado <b>ERP</b></span></div><div style={{padding:'0 18px 10px'}}><div className="pill" style={{background:'#153e63',color:'#a5d3f5',maxWidth:'100%'}}><Building2 size={12}/> {user.branch}</div></div>{groups.map(g=>visible.some(n=>n.section===g)?<div key={g}><div className="side-label">{g}</div>{visible.filter(n=>n.section===g).map(n=><button key={n.id} className={'nav-item '+(section===n.id?'active':'')} onClick={()=>navigate(n.id)}><n.icon size={17}/>{n.label}</button>)}</div>:null)}<div className="sidebar-foot"><div style={{fontSize:12,marginBottom:5}}>© Colmado ERP</div><span style={{fontSize:11}}>Gestión comercial · República Dominicana</span></div></aside>{sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,zIndex:25,background:'#061a2b88'}}/>}<div className="app-main"><header className="topbar"><div className="row"><button className="icon-btn mobile-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)} aria-label="Abrir menú"><Menu size={20}/></button><div><h2>{sectionNames[section]}</h2><div className="topbar-sub">{user.business} · {user.branch}</div></div></div><div className="top-user"><div className="search" style={{maxWidth:230,display:section==='productos'?'none':undefined}}><Search size={16}/><input aria-label="Buscar productos" placeholder="Buscar artículos..." value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')navigate('productos');}}/></div><button className="icon-btn" title={dark?'Activar modo claro':'Activar modo oscuro'} onClick={toggleTheme}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><span className="avatar">{user.name.slice(0,1).toUpperCase()}</span><span className="user-text"><strong>{user.name}</strong><span>{user.role.replaceAll('_',' ').toLowerCase()}</span></span><button className="icon-btn" title="Cerrar sesión" onClick={()=>void logout()}><LogOut size={17}/></button></div></header><main className="content">{display()}</main></div>{message&&<div className={'toast '+(message.bad?'bad':'')} role="status">{message.bad?<X size={17}/>:<ShieldCheck size={17}/>}<span>{message.text}</span><button onClick={()=>setMessage(null)} style={{background:'none',border:'none',color:'white',marginLeft:8}}><X size={15}/></button></div>}</div>;
}
