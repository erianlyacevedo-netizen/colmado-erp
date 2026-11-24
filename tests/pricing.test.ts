import {describe,it,expect} from 'vitest';
import {calculateLine} from '../src/lib/pricing';
describe('Cálculo de facturas',()=>{
 it('calcula ITBIS externo',()=>{const r=calculateLine({price:100,quantity:2,taxRate:18,taxIncluded:false});expect(r.tax.toString()).toBe('36');expect(r.total.toString()).toBe('236');});
 it('calcula ITBIS incluido',()=>{const r=calculateLine({price:118,quantity:1,taxRate:18,taxIncluded:true});expect(r.tax.toString()).toBe('18');expect(r.total.toString()).toBe('118');});
 it('productos exentos',()=>{const r=calculateLine({price:45,quantity:2.5,taxRate:0});expect(r.total.toString()).toBe('112.5');});
 it('descuentos',()=>{const r=calculateLine({price:100,quantity:2,discount:20});expect(r.total.toString()).toBe('180');});
 it('rechaza descuento excesivo',()=>{expect(()=>calculateLine({price:100,quantity:1,discount:110})).toThrow();});
});
