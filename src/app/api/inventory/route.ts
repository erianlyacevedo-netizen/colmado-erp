import {db} from '@/lib/db';
import {authorize,branchOf,mutationGuard,assert,fail,json,AppError,audit} from '@/lib/http';
import {z} from 'zod';
import {Prisma} from '@prisma/client';
const schema=z.object({productId:z.string().min(1),quantity:z.coerce.number().finite().refine(x=>x!==0,'La cantidad no puede ser cero.'),note:z.string().trim().min(3).max(500)});
export async function GET(){try{const u=await authorize();return json(await db.stockMovement.findMany({where:{businessId:u.businessId,branchId:branchOf(u)},include:{product:{select:{name:true,sku:true}}},orderBy:{createdAt:'desc'},take:200}));}catch(e){return fail(e);}}
export async function POST(req:Request){try{await mutationGuard(req);const u=await authorize('inventory');const branchId=branchOf(u);const v=schema.parse(await req.json());const result=await db.$transaction(async tx=>{
 const p=await tx.product.findFirst({where:{id:v.productId,businessId:u.businessId,branchId}});assert(p,'Producto no encontrado.',404);const amount=new Prisma.Decimal(v.quantity);const updated=await tx.product.updateMany({where:{id:p.id,stock:{gte:amount.lt(0)?amount.abs():0}},data:{stock:{increment:amount}}});if(updated.count!==1)throw new AppError(409,'El ajuste produciría existencias negativas.');const after=await tx.product.findUniqueOrThrow({where:{id:p.id}});await tx.stockMovement.create({data:{productId:p.id,branchId,businessId:u.businessId,userId:u.id,quantity:amount,previous:after.stock.minus(amount),resulting:after.stock,type:'AJUSTE',note:v.note}});return after;},{isolationLevel:'Serializable'});
 await audit(u,'AJUSTE_STOCK','productos',v.productId,{cantidad:v.quantity,motivo:v.note});return json(result);
 }catch(e){if(e instanceof z.ZodError)return json({error:e.issues[0]?.message},400);return fail(e);}}
