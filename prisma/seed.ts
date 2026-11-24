import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
async function main(){
 const email=process.env.ADMIN_EMAIL;
 const password=process.env.ADMIN_PASSWORD;
 if(!email||!password||password.length<12)throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) antes de ejecutar seed.');
 if(await db.user.findUnique({where:{email}})){console.log('Administrador ya existe; no se modifica.');return;}
 const business=await db.business.create({data:{name:'Colmado El Progreso',legalName:'Colmado El Progreso',phone:'809-000-0000',address:'República Dominicana'}});
 const branch=await db.branch.create({data:{name:'Sucursal principal',businessId:business.id}});
 await db.user.create({data:{name:'Propietario',email,passwordHash:await bcrypt.hash(password,12),businessId:business.id,branchId:branch.id,role:Role.PROPIETARIO}});
 const cats=['Alimentos','Bebidas','Lácteos','Limpieza','Higiene','Snacks','Enlatados','Condimentos','Panadería','Otros'];
 const ids:Record<string,string>={};
 for(const name of cats){let c=await db.category.create({data:{name,businessId:business.id}});ids[name]=c.id;}
 const products:[string,string,number,number,string][]=[
 ['Arroz selecto','Alimentos',35,45,'libra'],['Azúcar blanca','Alimentos',30,40,'libra'],['Habichuelas rojas','Alimentos',55,75,'libra'],['Aceite vegetal 16 oz','Alimentos',100,130,'botella'],['Harina de trigo','Alimentos',30,43,'libra'],['Espagueti 400 g','Alimentos',35,48,'paquete'],['Avena 400 g','Alimentos',55,75,'paquete'],['Sal refinada','Condimentos',18,25,'unidad'],['Café molido 1 lb','Alimentos',195,245,'paquete'],['Leche evaporada','Lácteos',60,80,'lata'],['Leche en polvo','Lácteos',150,190,'paquete'],['Queso blanco','Lácteos',170,215,'libra'],['Huevos','Lácteos',7,10,'unidad'],['Mantequilla','Lácteos',65,85,'unidad'],['Agua 500 ml','Bebidas',12,20,'botella'],['Refresco 500 ml','Bebidas',35,50,'botella'],['Jugo de naranja','Bebidas',45,65,'unidad'],['Malta','Bebidas',45,60,'botella'],['Galletas saladas','Snacks',25,35,'paquete'],['Papas fritas','Snacks',35,50,'paquete'],['Chocolate','Snacks',25,40,'unidad'],['Atún en lata','Enlatados',75,105,'lata'],['Sardinas','Enlatados',55,78,'lata'],['Maíz dulce','Enlatados',65,90,'lata'],['Salsa de tomate','Condimentos',30,43,'unidad'],['Sazón en polvo','Condimentos',20,32,'sobre'],['Orégano','Condimentos',20,35,'sobre'],['Pan de agua','Panadería',6,10,'unidad'],['Pan sobao','Panadería',12,20,'unidad'],['Detergente 500 g','Limpieza',65,90,'paquete'],['Cloro 1 litro','Limpieza',55,75,'botella'],['Lavaplatos','Limpieza',70,95,'botella'],['Jabón de baño','Higiene',45,65,'unidad'],['Papel higiénico','Higiene',35,50,'rollo'],['Pasta dental','Higiene',85,115,'unidad']];
 for(let i=0;i<100;i++){const [name,cat,cost,price,unit]=products[i%products.length];await db.product.create({data:{name:i<products.length?name:`${name} presentación ${Math.floor(i/products.length)+1}`,sku:`ART-${String(i+1).padStart(4,'0')}`,businessId:business.id,branchId:branch.id,categoryId:ids[cat],cost,price,unit,stock:20+(i%12)*5,minStock:10,taxRate:['Bebidas','Snacks','Limpieza','Higiene'].includes(cat)?18:0}});}
 for(const name of ['Distribuidora Norte','Comercial Dominicana','Productos del Cibao','Mayorista Central','Suministros Nacionales'])await db.supplier.create({data:{name,businessId:business.id}});
 for(let i=1;i<=20;i++)await db.customer.create({data:{name:`Cliente de ejemplo ${i}`,businessId:business.id,phone:`809-555-${String(i).padStart(4,'0')}`}});
 console.log('Datos de ejemplo creados. Correo administrador:',email);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
