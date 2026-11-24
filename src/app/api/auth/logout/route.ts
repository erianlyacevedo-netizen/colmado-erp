import {NextResponse} from 'next/server';
import {cookieName} from '@/lib/auth';
import {mutationGuard,fail} from '@/lib/http';
export async function POST(req:Request){try{await mutationGuard(req);const response=NextResponse.json({ok:true});response.cookies.delete(cookieName);return response;}catch(e){return fail(e);}}
