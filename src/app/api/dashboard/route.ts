import {db} from '@/lib/db';
import {authorize,branchOf,fail,json} from '@/lib/http';
import {money} from '@/lib/pricing';
function startDay(){const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Santo_Domingo'}).formatToParts(new Date());const get=(s:string)=>parts.find(p=>p.type===s)?.value||'01';return new Date(`${get('year')}-${get('month')}-${get('day')}T04:00:00.000Z`);}
export async function GET(){try{const u=await authorize();const branchId=branchOf(u),today=startDay();const scope={businessId:u.businessId,branchId};const [sales,monthSales,expenses,stock,customers,products,creditCount,recent,topSales,open]=await Promise.all([
 db.sale.aggregate({where:{...scope,createdAt:{gte:today},status:{not:'ANULADA'}},_sum:{total:true,tax:true},_count:{_all:true}}),
 db.sale.aggregate({where:{...scope,createdAt:{gte:new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1,4,0,0))},status:{not:'ANULADA'}},_sum:{total:true}}),
 db.expense.aggregate({where:{...scope,createdAt:{gte:today}},_sum:{amount:true}}),
 db.product.findMany({where:{...scope,active:true},select:{id:true,name:true,stock:true,minStock:true,price:true,cost:true,expiresAt:true},take:10000}),
 db.customer.aggregate({where:{businessId:u.businessId},_sum:{balance:true}}),
 db.product.count({where:{...scope,active:true}}),
 db.customer.count({where:{businessId:u.businessId,balance:{gt:0}}}),
 db.sale.findMany({where:scope,select:{id:true,number:true,createdAt:true,total:true,status:true,customer:{select:{name:true}}},orderBy:{createdAt:'desc'},take:7}),
 db.saleItem.groupBy({by:['productId'],where:{sale:{...scope}},_sum:{quantity:true},orderBy:{_sum:{quantity:'desc'}},take:6}),
 db.cashSession.findFirst({where:{...scope,userId:u.id,status:'ABIERTA'},include:{movements:true}})
 ]);
 const inventoryValue=stock.reduce((v,p)=>v+p.stock.toNumber()*p.cost.toNumber(),0);const low=stock.filter(p=>p.stock.lte(p.minStock));const todayGross=money(sales._sum.total??0);const todayExpense=money(expenses._sum.amount??0);const names=await db.product.findMany({where:{id:{in:topSales.map(s=>s.productId)}},select:{id:true,name:true}});const map=new Map(names.map(p=>[p.id,p.name]));
 const days=await db.sale.findMany({where:{...scope,createdAt:{gte:new Date(Date.now()-6*86400000)}},select:{total:true,createdAt:true}});const chart=Array.from({length:7},(_,i)=>{const d=new Date(Date.now()-(6-i)*86400000);const key=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santo_Domingo'}).format(d);return {fecha:key,ventas:money(days.filter(s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santo_Domingo'}).format(s.createdAt)===key).reduce((n,s)=>n+s.total.toNumber(),0)).toNumber()};});
 return json({todaySales:todayGross,monthSales:monthSales._sum.total??0,salesCount:sales._count._all,todayTax:sales._sum.tax??0,todayExpense,inventoryValue:money(inventoryValue),productCount:products,lowStock:low.slice(0,6),lowCount:low.length,outCount:stock.filter(p=>p.stock.lte(0)).length,customerDebt:customers._sum.balance??0,creditCount,recent,top:topSales.map(s=>({name:map.get(s.productId)||'Artículo',quantity:s._sum.quantity||0})),chart,cash:open?money(open.opening.plus(open.movements.reduce((n,m)=>n.plus(m.amount),money(0)))):null});
 }catch(e){return fail(e);}}
