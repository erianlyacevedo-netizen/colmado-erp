import { Prisma } from '@prisma/client';
const D=Prisma.Decimal;
export const dec=(v:string|number|Prisma.Decimal)=>new D(v);
export const money=(v:string|number|Prisma.Decimal)=>dec(v).toDecimalPlaces(2,D.ROUND_HALF_UP);
export type PriceInput={price:string|number;quantity:string|number;discount?:string|number;taxRate?:string|number;taxIncluded?:boolean};
export function calculateLine(input:PriceInput){
 const qty=dec(input.quantity),unit=money(input.price),discount=money(input.discount??0),rate=dec(input.taxRate??0);
 if(!qty.isFinite()||qty.lte(0)||!unit.isFinite()||unit.lt(0)||!discount.isFinite()||discount.lt(0)||!rate.isFinite()||rate.lt(0)||rate.gt(100))throw new Error('Cantidad, precio, descuento o tasa inválida.');
 const gross=money(unit.mul(qty));if(discount.gt(gross))throw new Error('El descuento supera el importe del artículo.');
 const discounted=gross.minus(discount);
 const tax=input.taxIncluded?money(discounted.minus(discounted.div(new D(1).plus(rate.div(100))))):money(discounted.mul(rate).div(100));
 const base=input.taxIncluded?money(discounted.minus(tax)):discounted;
 const total=input.taxIncluded?discounted:money(discounted.plus(tax));
 return {base,tax,total,discount,quantity:qty,unitPrice:unit,rate};
}
export function sumAmounts(values:Prisma.Decimal[]){return values.reduce((a,b)=>a.plus(b),new D(0));}
