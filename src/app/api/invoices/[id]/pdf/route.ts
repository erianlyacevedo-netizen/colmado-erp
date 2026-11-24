import {db} from '@/lib/db';
import {authorize,assert,fail} from '@/lib/http';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
const dollars=(v:unknown)=>`RD$ ${Number(v||0).toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const clean=(s:unknown)=>String(s??'').replace(/[\r\n\t]/g,' ').slice(0,140);
export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){try{const u=await authorize();const {id}=await ctx.params;const sale=await db.sale.findFirst({where:{id,businessId:u.businessId},include:{items:true,payments:true,invoice:true,user:{select:{name:true}},customer:true,branch:true}});assert(sale,'Factura no encontrada.',404);const business=await db.business.findUniqueOrThrow({where:{id:u.businessId}});
 const doc=await PDFDocument.create();const normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);const w=595,h=842;let page=doc.addPage([w,h]);let y=h-52;const ink=rgb(.12,.18,.29),muted=rgb(.43,.48,.56),accent=rgb(.09,.39,.65);
 function text(t:unknown,x:number,size=10,strong=false,color=ink){page.drawText(clean(t),{x,y,size,font:strong?bold:normal,color,maxWidth:w-x-40});}
 function line(){page.drawLine({start:{x:40,y},end:{x:w-40,y},thickness:.75,color:rgb(.83,.86,.9)});}
 function newPage(){page=doc.addPage([w,h]);y=h-55;}
 text(business.name,42,22,true,accent);y-=23;text(business.legalName||'',42,10);y-=15;text(`RNC: ${business.rnc||'No configurado'}  |  Tel: ${business.phone||'No configurado'}`,42,9,false,muted);y-=14;text(business.address||'Dirección no configurada',42,9,false,muted);y-=17;line();y-=28;
 text('FACTURA DE VENTA',42,18,true);y-=22;text(`Número: ${sale.number}`,42,10,true);y-=17;text(`Fecha: ${new Intl.DateTimeFormat('es-DO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Santo_Domingo'}).format(sale.createdAt)}`,42,10);y-=17;text(`Cajero: ${sale.user.name}`,42,10);y-=17;text(`Sucursal: ${sale.branch.name}`,42,10);y-=17;text(`Cliente: ${sale.customer?.name||'Consumidor final'}`,42,10);y-=17;if(sale.customer?.document){text(`Identificación cliente: ${sale.customer.document}`,42,10);y-=17;}
 text(`Comprobante: ${sale.invoice?.type==='COMERCIAL'?'Documento comercial':'Requiere validación fiscal'}`,42,10);y-=15;line();y-=25;
 function heading(){text('ARTÍCULO',42,10,true);text('CANT.',335,9,true);text('PRECIO',405,9,true);text('TOTAL',500,9,true);y-=17;line();y-=17;}
 heading();for(const item of sale.items){if(y<155){newPage();heading();}text(item.nameSnapshot.slice(0,46),42,10);text(String(item.quantity),335,9);text(dollars(item.unitPrice).replace('RD$ ',''),405,9);text(dollars(item.total).replace('RD$ ',''),500,9);y-=24;}
 if(y<190)newPage();line();y-=22;text('Subtotal gravado/exento',330,10);text(dollars(sale.subtotal),460,10,true);y-=20;text('Descuentos',330,10);text(dollars(sale.discount),460,10,true);y-=20;text('ITBIS',330,10);text(dollars(sale.tax),460,10,true);y-=27;page.drawRectangle({x:325,y:y-14,width:230,height:38,color:rgb(.91,.95,.99)});text('TOTAL',340,14,true,accent);text(dollars(sale.total),460,13,true,accent);y-=50;
 text(`Pagado: ${dollars(sale.paid)}`,330,10);y-=20;text(`Pendiente: ${dollars(sale.due)}`,330,10);y-=24;text(`Estado: ${sale.status}`,330,10,true);y-=30;
 if(sale.payments.length){text('MÉTODOS DE PAGO',42,10,true);y-=17;for(const p of sale.payments){text(`${p.method}: ${dollars(p.amount)}`,42,9);y-=16;}}
 if(y<90)newPage();y=Math.max(65,y-30);line();y-=18;text('Gracias por su compra.',42,11,true,accent);y-=16;text('Documento comercial. No es un comprobante fiscal válido de la DGII.',42,9,false,muted);
 doc.setTitle(`Factura ${sale.number}`);doc.setAuthor(clean(business.name));const bytes=await doc.save();return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${sale.number}.pdf"`,'Cache-Control':'private, no-store'}});
 }catch(e){return fail(e);}}
