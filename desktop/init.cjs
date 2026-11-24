const {PrismaClient,Role}=require('@prisma/client');
const bcrypt=require('bcryptjs');
const db=new PrismaClient();
(async()=>{
 if(process.argv.includes('--check')) { console.log(await db.user.count()); return; }
 const email=process.env.INIT_EMAIL, password=process.env.INIT_PASSWORD, name=process.env.INIT_BUSINESS;
 if(!email || !password || password.length<12 || !name) throw Error('Datos de propietario inválidos');
 await db.$transaction(async tx=>{
  if(await tx.user.count()) throw Error('Ya existe un propietario');
  const business=await tx.business.create({data:{name}});
  const branch=await tx.branch.create({data:{name:'Sucursal principal',businessId:business.id}});
  await tx.user.create({data:{name:'Propietario',email:email.toLowerCase(),passwordHash:await bcrypt.hash(password,12),role:Role.PROPIETARIO,businessId:business.id,branchId:branch.id}});
 });
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
