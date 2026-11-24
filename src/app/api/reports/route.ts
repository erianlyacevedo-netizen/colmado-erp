import {db} from '@/lib/db';
import {authorize,branchOf,fail,json} from '@/lib/http';
export async function GET(req:Request){try{const u=await authorize('finance');const q=new URL(req.url).searchParams;const from=q.get('desde')?new Date(q.get('desde')!+'T00:00:00-04:00'):new Date(Date.now()-30*86400000);const to=q.get('hasta')?new Date(q.get('hasta')!+'T23:59:59-04:00'):new Date();if(Number.isNaN(+from)||Number.isNaN(+to)||from>to)return json({error:'Rango de fechas inválido.'},400);const scope={businessId:u.businessId,branchId:branchOf(u),createdAt:{gte:from,lte:to}};const [sales,expenses,purchases,credits,products]=await Promise.all([
 db.sale.findMany({where:scope,include:{user:{select:{name:true}},customer:{select:{name:true}},payments:true,items:true},orderBy:{createdAt:'desc'},take:5000}),
 db.expense.findMany({where:scope,orderBy:{createdAt:'desc'},take:5000}),
 db.purchase.findMany({where:scope,include:{supplier:{select:{name:true}},items:true},orderBy:{createdAt:'desc'},take:5000}),
 db.customer.findMany({where:{businessId:u.businessId,balance:{gt:0}},select:{name:true,balance:true,phone:true,creditLimit:true},take:5000}),
 db.product.findMany({where:{businessId:u.businessId,branchId:branchOf(u)},select:{name:true,sku:true,stock:true,cost:true,price:true,category:{select:{name:true}}},take:5000})
 ]);return json({sales,expenses,purchases,credits,products});}catch(e){return fail(e);}}
