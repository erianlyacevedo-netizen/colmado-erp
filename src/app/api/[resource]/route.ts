import {db} from '@/lib/db';
import {authorize,branchOf,mutationGuard,AppError,assert,fail,json,audit} from '@/lib/http';
import {z} from 'zod';
const str=z.string().trim().min(1).max(250),opt=z.string().trim().max(500).nullish(),money=z.coerce.number().finite().min(0).max(100000000),qty=z.coerce.number().finite().min(0).max(100000000);
const product=z.object({name:str,sku:opt,barcode:opt,description:opt,brand:opt,unit:z.string().min(1).max(30).default('unidad'),cost:money,price:money,wholesalePrice:money.nullish(),stock:qty.default(0),minStock:qty.default(5),taxRate:z.coerce.number().min(0).max(100).default(0),taxIncluded:z.boolean().default(true),categoryId:opt,supplierId:opt,expiresAt:opt,active:z.boolean().default(true)});
const customer=z.object({name:str,document:opt,phone:opt,email:z.union([z.literal(''),z.string().email()]).nullish(),address:opt,creditLimit:money.default(0),active:z.boolean().default(true)});
const supplier=z.object({name:str,rnc:opt,phone:opt,email:opt,address:opt,active:z.boolean().default(true)});
const category=z.object({name:str});
const expense=z.object({description:str,category:str,amount:money.positive(),method:z.enum(['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO']).default('EFECTIVO')});
const delivery=z.object({customerId:opt,saleId:opt,address:str,driver:opt,fee:money.default(0),status:z.enum(['PENDIENTE','PREPARANDO','LISTO','EN_CAMINO','ENTREGADO','CANCELADO']).default('PENDIENTE'),notes:opt});
const promotion=z.object({title:str,description:opt,discountPercent:z.coerce.number().min(0).max(100),active:z.boolean().default(true),startsAt:opt,endsAt:opt});
const schemas={productos:product,clientes:customer,proveedores:supplier,categorias:category,gastos:expense,entregas:delivery,promociones:promotion};
type Resource=keyof typeof schemas;
const valid=(name:string):name is Resource=>name in schemas;
const allowedAction=(resource:Resource,verb:string)=>resource==='gastos'?'finance':resource==='clientes'||resource==='entregas'?(verb==='GET'?'read':'sell'):resource==='productos'||resource==='categorias'||resource==='proveedores'?'inventory':resource==='promociones'?'manage':'read';
async function requireScope(resource:Resource,verb:string){return authorize(verb==='GET'?(resource==='gastos'?'finance':'read'):allowedAction(resource,verb));}
const paramsOf=async(context:{params:Promise<{resource:string}>})=>(await context.params).resource;
export async function GET(req:Request,ctx:{params:Promise<{resource:string}>}){
 try{const resource=await paramsOf(ctx);assert(valid(resource),'Sección no encontrada.',404);const user=await requireScope(resource,'GET');const branchId=branchOf(user);const query=new URL(req.url).searchParams;const search=(query.get('buscar')||'').slice(0,120);const take=Math.min(3000,Math.max(1,Number(query.get('limite')||100)||100));let items:unknown[]=[];
 switch(resource){
 case 'productos':items=await db.product.findMany({where:{businessId:user.businessId,branchId,active:query.get('todos')==='1'?undefined:true,...(search?{OR:[{name:{contains:search}},{sku:{contains:search}},{barcode:{contains:search}}]}:{})},include:{category:true,supplier:true,images:{orderBy:{sortOrder:'asc'}}},orderBy:{name:'asc'},take});break;
 case 'clientes':items=await db.customer.findMany({where:{businessId:user.businessId,...(search?{name:{contains:search}}:{})},orderBy:{name:'asc'},take});break;
 case 'proveedores':items=await db.supplier.findMany({where:{businessId:user.businessId,...(search?{name:{contains:search}}:{})},orderBy:{name:'asc'},take});break;
 case 'categorias':items=await db.category.findMany({where:{businessId:user.businessId},orderBy:{name:'asc'},take});break;
 case 'gastos':items=await db.expense.findMany({where:{businessId:user.businessId,branchId},orderBy:{createdAt:'desc'},take});break;
 case 'entregas':items=await db.delivery.findMany({where:{businessId:user.businessId,branchId},include:{customer:{select:{name:true,phone:true}},sale:{select:{number:true,total:true}}},orderBy:{createdAt:'desc'},take});break;
 case 'promociones':items=await db.promotion.findMany({where:{businessId:user.businessId},orderBy:{createdAt:'desc'},take});break;
 }
 return json(items);
 }catch(e){return fail(e);}
}
export async function POST(req:Request,ctx:{params:Promise<{resource:string}>}){
 try{await mutationGuard(req);const resource=await paramsOf(ctx);assert(valid(resource),'Sección no encontrada.',404);const user=await requireScope(resource,'POST');const branchId=branchOf(user);const data=schemas[resource].parse(await req.json());let created:{id:string};
 switch(resource){
 case 'productos':{const p=data as z.infer<typeof product>;if(p.categoryId)assert(await db.category.count({where:{id:p.categoryId,businessId:user.businessId}}),'Categoría inválida.');if(p.supplierId)assert(await db.supplier.count({where:{id:p.supplierId,businessId:user.businessId}}),'Proveedor inválido.');created=await db.$transaction(async tx=>{const result=await tx.product.create({data:{...p,sku:p.sku||null,barcode:p.barcode||null,description:p.description||null,brand:p.brand||null,categoryId:p.categoryId||null,supplierId:p.supplierId||null,wholesalePrice:p.wholesalePrice??null,expiresAt:p.expiresAt?new Date(p.expiresAt):null,businessId:user.businessId,branchId}});if(p.stock>0)await tx.stockMovement.create({data:{productId:result.id,businessId:user.businessId,branchId,userId:user.id,type:'INICIAL',quantity:p.stock,previous:0,resulting:p.stock,note:'Existencia inicial'}});return result;});break;}
 case 'clientes':created=await db.customer.create({data:{...(data as z.infer<typeof customer>),businessId:user.businessId}});break;
 case 'proveedores':created=await db.supplier.create({data:{...(data as z.infer<typeof supplier>),businessId:user.businessId}});break;
 case 'categorias':created=await db.category.create({data:{...(data as z.infer<typeof category>),businessId:user.businessId}});break;
 case 'gastos':{const v=data as z.infer<typeof expense>;created=await db.$transaction(async tx=>{const expense=await tx.expense.create({data:{...v,businessId:user.businessId,branchId}});if(v.method==='EFECTIVO'){const s=await tx.cashSession.findFirst({where:{userId:user.id,businessId:user.businessId,branchId,status:'ABIERTA'},orderBy:{openedAt:'desc'}});if(s)await tx.cashMovement.create({data:{sessionId:s.id,kind:'GASTO',description:v.description,amount:-v.amount,reference:expense.id}});}return expense;});break;}
 case 'entregas':{const v=data as z.infer<typeof delivery>;if(v.customerId)assert(await db.customer.count({where:{id:v.customerId,businessId:user.businessId}}),'Cliente inválido.');if(v.saleId)assert(await db.sale.count({where:{id:v.saleId,businessId:user.businessId,branchId}}),'Venta inválida.');created=await db.delivery.create({data:{...v,customerId:v.customerId||null,saleId:v.saleId||null,notes:v.notes||null,driver:v.driver||null,businessId:user.businessId,branchId}});break;}
 case 'promociones':{const v=data as z.infer<typeof promotion>;created=await db.promotion.create({data:{...v,description:v.description||null,startsAt:v.startsAt?new Date(v.startsAt):null,endsAt:v.endsAt?new Date(v.endsAt):null,businessId:user.businessId}});break;}
 }
 await audit(user,'CREAR',resource,created!.id);return json(created!,201);
 }catch(e){if(e instanceof z.ZodError)return json({error:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')},400);return fail(e);}
}
export async function PATCH(req:Request,ctx:{params:Promise<{resource:string}>}){
 try{await mutationGuard(req);const resource=await paramsOf(ctx);assert(valid(resource),'Sección no encontrada.',404);const user=await requireScope(resource,'PATCH');const branchId=branchOf(user);const body=await req.json();assert(typeof body.id==='string','Falta el identificador.');const parsed=schemas[resource].partial().parse(body);delete (parsed as {id?:unknown}).id;let updated:{id:string};
 switch(resource){
 case 'productos':{const data=parsed as z.infer<typeof product>;assert(await db.product.count({where:{id:body.id,businessId:user.businessId,branchId}}),'Producto no encontrado.',404);assert(data.stock===undefined,'Para modificar existencias usa Ajustar inventario.');if(data.categoryId)assert(await db.category.count({where:{id:data.categoryId,businessId:user.businessId}}),'Categoría inválida.');if(data.supplierId)assert(await db.supplier.count({where:{id:data.supplierId,businessId:user.businessId}}),'Proveedor inválido.');updated=await db.product.update({where:{id:body.id},data:{...data,sku:data.sku===undefined?undefined:data.sku||null,barcode:data.barcode===undefined?undefined:data.barcode||null,categoryId:data.categoryId===undefined?undefined:data.categoryId||null,supplierId:data.supplierId===undefined?undefined:data.supplierId||null,expiresAt:data.expiresAt?new Date(data.expiresAt):data.expiresAt===null?null:undefined}});break;}
 case 'clientes':{assert(await db.customer.count({where:{id:body.id,businessId:user.businessId}}),'Cliente no encontrado.',404);updated=await db.customer.update({where:{id:body.id},data:parsed as z.infer<typeof customer>});break;}
 case 'proveedores':{assert(await db.supplier.count({where:{id:body.id,businessId:user.businessId}}),'Proveedor no encontrado.',404);updated=await db.supplier.update({where:{id:body.id},data:parsed as z.infer<typeof supplier>});break;}
 case 'categorias':{assert(await db.category.count({where:{id:body.id,businessId:user.businessId}}),'Categoría no encontrada.',404);updated=await db.category.update({where:{id:body.id},data:parsed as z.infer<typeof category>});break;}
 case 'gastos':throw new AppError(403,'Los gastos registrados no se modifican directamente. Registra el ajuste correspondiente.');
 case 'entregas':{assert(await db.delivery.count({where:{id:body.id,businessId:user.businessId,branchId}}),'Entrega no encontrada.',404);const v=parsed as z.infer<typeof delivery>;updated=await db.delivery.update({where:{id:body.id},data:{...v,customerId:v.customerId||undefined,saleId:v.saleId||undefined}});break;}
 case 'promociones':{assert(await db.promotion.count({where:{id:body.id,businessId:user.businessId}}),'Promoción no encontrada.',404);const v=parsed as z.infer<typeof promotion>;updated=await db.promotion.update({where:{id:body.id},data:{...v,startsAt:v.startsAt?new Date(v.startsAt):undefined,endsAt:v.endsAt?new Date(v.endsAt):undefined}});break;}
 }
 await audit(user,'EDITAR',resource,updated!.id);return json(updated!);
 }catch(e){if(e instanceof z.ZodError)return json({error:e.issues.map(i=>i.message).join('; ')},400);return fail(e);}
}
export async function DELETE(req:Request,ctx:{params:Promise<{resource:string}>}){
 try{await mutationGuard(req);const resource=await paramsOf(ctx);assert(valid(resource),'Sección no encontrada.',404);const user=await requireScope(resource,'DELETE');const id=new URL(req.url).searchParams.get('id');assert(id,'Falta identificador.');
 if(resource==='productos'){assert(await db.product.count({where:{id,businessId:user.businessId}}),'Producto no encontrado.',404);await db.product.update({where:{id},data:{active:false}});}
 else if(resource==='clientes'){assert(await db.customer.count({where:{id,businessId:user.businessId}}),'Cliente no encontrado.',404);await db.customer.update({where:{id},data:{active:false}});}
 else if(resource==='proveedores'){assert(await db.supplier.count({where:{id,businessId:user.businessId}}),'Proveedor no encontrado.',404);await db.supplier.update({where:{id},data:{active:false}});}
 else if(resource==='promociones'){assert(await db.promotion.count({where:{id,businessId:user.businessId}}),'Promoción no encontrada.',404);await db.promotion.update({where:{id},data:{active:false}});}
 else throw new AppError(403,'No está permitido eliminar registros de esta sección.');
 await audit(user,'DESACTIVAR',resource,id);return json({ok:true});
 }catch(e){return fail(e);}
}
