import {db} from '@/lib/db';
import {authorize,branchOf,mutationGuard,assert,fail,json,audit,AppError} from '@/lib/http';
import {z} from 'zod';
import {money} from '@/lib/pricing';
const schema=z.object({customerId:z.string(),amount:z.coerce.number().positive(),method:z.enum(['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO']),note:z.string().max(300).optional()});
export async function GET(req:Request){try{const u=await authorize();const customerId=new URL(req.url).searchParams.get('cliente');return json(await db.creditEntry.findMany({where:{businessId:u.businessId,...(customerId?{customerId}:{})},include:{customer:{select:{name:true}},sale:{select:{number:true}}},orderBy:{createdAt:'desc'},take:200}));}catch(e){return fail(e);}}
export async function POST(req:Request){try{
 await mutationGuard(req);const u=await authorize('sell');const v=schema.parse(await req.json());const branchId=branchOf(u);
 const entry=await db.$transaction(async tx=>{
 const customer=await tx.customer.findFirst({where:{id:v.customerId,businessId:u.businessId}});assert(customer,'Cliente no encontrado.',404);
 const amount=money(v.amount);assert(amount.lte(customer.balance),'El abono no puede superar el saldo pendiente.');
 const changed=await tx.customer.updateMany({where:{id:customer.id,balance:{gte:amount}},data:{balance:{decrement:amount}}});assert(changed.count===1,'El saldo cambió. Actualiza los datos.',409);
 const sales=await tx.sale.findMany({where:{businessId:u.businessId,customerId:customer.id,due:{gt:0},status:{not:'ANULADA'}},orderBy:{createdAt:'asc'}});
 let remaining=amount;let firstEntry=null;
 for(const sale of sales){if(remaining.lte(0))break;const applied=remaining.lte(sale.due)?remaining:sale.due;const outstanding=sale.due.minus(applied);
 const updated=await tx.sale.updateMany({where:{id:sale.id,due:{gte:applied}},data:{due:{decrement:applied},paid:{increment:applied},status:outstanding.eq(0)?'PAGADA':'PARCIAL'}});
 assert(updated.count===1,'Otra operación modificó el saldo de esta venta.',409);
 await tx.salePayment.create({data:{saleId:sale.id,method:v.method,amount:applied,reference:'ABONO'}});
 const record=await tx.creditEntry.create({data:{businessId:u.businessId,customerId:v.customerId,saleId:sale.id,type:'ABONO',amount:applied.neg(),method:v.method,note:v.note||'Abono a factura'}});
 if(!firstEntry)firstEntry=record;remaining=remaining.minus(applied);
 }
 if(remaining.gt(0))throw new AppError(409,'Inconsistencia entre saldo del cliente y facturas abiertas. No se registró el abono.');
 const session=await tx.cashSession.findFirst({where:{userId:u.id,businessId:u.businessId,branchId,status:'ABIERTA'}});
 if(session&&v.method==='EFECTIVO')await tx.cashMovement.create({data:{sessionId:session.id,kind:'ABONO',description:`Abono de ${customer.name}`,amount,reference:firstEntry?.id}});
 return firstEntry;
 },{isolationLevel:'Serializable'});
 await audit(u,'ABONO','clientes',v.customerId,{cantidad:v.amount});return json(entry,201);
 }catch(e){if(e instanceof z.ZodError)return json({error:e.issues[0]?.message},400);return fail(e);}}
