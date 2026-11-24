import {db} from '@/lib/db';
import {authorize,mutationGuard,fail,json} from '@/lib/http';
import {z} from 'zod';
const schema=z.object({name:z.string().min(3).max(120),address:z.string().max(200).nullish()});
export async function GET(){try{const u=await authorize();return json(await db.branch.findMany({where:{businessId:u.businessId},orderBy:{name:'asc'}}));}catch(e){return fail(e);}}
export async function POST(req:Request){try{await mutationGuard(req);const u=await authorize('manage');return json(await db.branch.create({data:{...schema.parse(await req.json()),businessId:u.businessId}}),201);}catch(e){if(e instanceof z.ZodError)return json({error:e.issues[0]?.message},400);return fail(e);}}
