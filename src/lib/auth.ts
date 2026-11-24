import { db } from './db';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';
const COOKIE='colmado_sesion';
function secret(){const value=process.env.AUTH_SECRET;if(!value||value.length<32)throw new Error('Configura AUTH_SECRET con al menos 32 caracteres');return new TextEncoder().encode(value);}
export async function tokenFor(id:string){return new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuedAt().setExpirationTime('7d').sign(secret());}
export async function userFromCookie(){
 try {const raw=(await cookies()).get(COOKIE)?.value;if(!raw)return null;const {payload}=await jwtVerify(raw,secret(),{algorithms:['HS256']});if(!payload.sub)return null;const user=await db.user.findUnique({where:{id:payload.sub},select:{id:true,name:true,email:true,role:true,active:true,businessId:true,branchId:true,business:{select:{name:true,logoUrl:true}},branch:{select:{name:true}}}});return user?.active?user:null;} catch{return null;}
}
export type SessionUser=NonNullable<Awaited<ReturnType<typeof userFromCookie>>>;
export function can(user:SessionUser,action:'read'|'sell'|'inventory'|'manage'|'finance'|'users'){
 if(['PROPIETARIO','ADMINISTRADOR'].includes(user.role))return true;
 const access:Record<Role,string[]>={PROPIETARIO:['read','sell','inventory','manage','finance','users'],ADMINISTRADOR:['read','sell','inventory','manage','finance','users'],SUPERVISOR:['read','sell','inventory','manage','finance'],CAJERO:['read','sell'],INVENTARIO:['read','inventory'],CONTADOR:['read','finance'],REPARTIDOR:['read']};
 return access[user.role].includes(action);
}
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production' && process.env.COLMADO_DESKTOP!=='1',sameSite:'lax' as const,path:'/',maxAge:60*60*24*7};
export const cookieName=COOKIE;
