import {db} from '@/lib/db';
import {authorize,fail,json} from '@/lib/http';
export async function GET(){try{const u=await authorize('manage');return json(await db.auditLog.findMany({where:{businessId:u.businessId},include:{user:{select:{name:true,role:true}}},orderBy:{createdAt:'desc'},take:300}));}catch(e){return fail(e);}}
