import {redirect} from 'next/navigation';
import {userFromCookie} from '@/lib/auth';
import AppShell from '@/components/AppShell';
export const dynamic='force-dynamic';
export default async function Home(){const user=await userFromCookie();if(!user)redirect('/iniciar-sesion');return <AppShell user={{id:user.id,name:user.name,email:user.email,role:user.role,business:user.business.name,branch:user.branch?.name??'Sin sucursal'}}/>}
