import {db} from '@/lib/db';
import {authorize,mutationGuard,fail,json} from '@/lib/http';
import {z} from 'zod';
const schema=z.object({name:z.string().min(2).max(130),legalName:z.string().max(200).nullish(),rnc:z.string().max(20).nullish(),address:z.string().max(240).nullish(),phone:z.string().max(30).nullish(),email:z.string().email().or(z.literal('')).nullish(),defaultTax:z.coerce.number().min(0).max(100)});
export async function GET(){try{const u=await authorize();return json(await db.business.findUnique({where:{id:u.businessId},select:{id:true,name:true,legalName:true,rnc:true,address:true,phone:true,email:true,logoUrl:true,defaultTax:true,branches:{select:{id:true,name:true,address:true}}}}));}catch(e){return fail(e);}}
export async function PATCH(req:Request){try{await mutationGuard(req);const u=await authorize('manage');const v=schema.parse(await req.json());return json(await db.business.update({where:{id:u.businessId},data:v}));}catch(e){if(e instanceof z.ZodError)return json({error:e.issues[0]?.message},400);return fail(e);}}
