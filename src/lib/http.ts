import { NextResponse } from 'next/server';
import { userFromCookie,can } from './auth';
import type { SessionUser } from './auth';
export class AppError extends Error {constructor(public status:number,message:string){super(message);}}
export async function authorize(action:'read'|'sell'|'inventory'|'manage'|'finance'|'users'='read'){
 const user=await userFromCookie();if(!user)throw new AppError(401,'Inicia sesión para continuar.');if(!can(user,action))throw new AppError(403,'No tienes permisos para realizar esta operación.');return user;
}
export function branchOf(user:SessionUser){if(!user.branchId)throw new AppError(400,'Tu usuario no tiene una sucursal asignada.');return user.branchId;}
export async function mutationGuard(req:Request){const origin=req.headers.get('origin');const host=req.headers.get('host');if(origin&&host){try{if(new URL(origin).host!==host)throw new AppError(403,'Origen de solicitud no permitido.');}catch(err){if(err instanceof AppError)throw err;throw new AppError(403,'Origen inválido.');}}}
export function json(data:unknown,status=200){return NextResponse.json(data,{status});}
export function fail(err:unknown){if(err instanceof AppError)return json({error:err.message},err.status);console.error('ERROR API',err);return json({error:'No se pudo procesar la solicitud. Revisa la información e inténtalo nuevamente.'},500);}
export function assert(condition:unknown,message:string,status=400):asserts condition{if(!condition)throw new AppError(status,message);}
export function number(value:unknown){const n=Number(value);if(!Number.isFinite(n))throw new AppError(400,'Cantidad o importe inválido.');return n;}
export async function audit(user:SessionUser,action:string,entity:string,entityId?:string,details?:Record<string,unknown>){const {db}=await import('./db');await db.auditLog.create({data:{businessId:user.businessId,userId:user.id,action,entity,entityId,details:details as never}});}
