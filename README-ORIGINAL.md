# Colmado ERP 🇩🇴

Aplicación web en **español** para la administración de un colmado de República Dominicana. Proyecto full-stack con **Next.js, PostgreSQL, Prisma y Cloudinary**, con control de inventario, fotografías, ventas, facturas comerciales y fiados.

> **Estado del proyecto:** código fuente entregado como base funcional integral. Se requiere instalar dependencias, inicializar PostgreSQL y completar las variables de entorno antes de usarlo. No se ha certificado para producción ni para emitir e-CF. Las pruebas y la compilación deben ejecutarse en un equipo con acceso a npm y a una base de datos. No se debe conectar un negocio real sin probar primero los flujos financieros.

## Funcionalidades implementadas

- Autenticación con correo/contraseña, contraseñas bcrypt, cookies HTTP-only firmadas, bloqueo tras intentos fallidos, roles y autorización en los endpoints.
- Panel general con ventas, caja, cuentas por cobrar, valor de inventario, alertas y gráficos.
- **Inventario:** alta y edición de artículos, categorías, precios, unidades, impuesto configurable, existencias, stock mínimo, búsqueda y vistas de tabla/tarjetas.
- **Fotografías reales:** subir múltiples imágenes JPG/PNG/WEBP desde PC o móvil, usar cámara, arrastrar y soltar, vista previa, establecer fotografía principal y eliminar. Archivos en Cloudinary, metadatos en PostgreSQL, límite de seis por artículo y 4 MB por imagen.
- **POS:** catálogo con fotografías, búsqueda, carrito, cantidades decimales, descuentos por línea, ITBIS por producto, pagos en efectivo/tarjeta/transferencia/combinados, cambio y crédito con límite. Transacciones serializables, control de existencias e idempotencia por venta.
- Factura comercial numerada, PDF con datos del negocio, cliente, productos, base, ITBIS y pagos; impresión desde navegador.
- Clientes y fiados, abonos, historial de movimientos y saldos.
- Compras con detalle de productos, proveedores, recepción con actualización de inventario y saldos pendientes.
- Cuentas por pagar, pagos parciales a proveedores y registro del historial.
- Caja: apertura, entradas, retiros, ventas en efectivo, gastos, abonos, arqueo y cierre.
- Gastos, reportes de operaciones, exportaciones Excel y CSV.
- Entregas a domicilio y gestión básica de promociones.
- Gestión de usuarios, sucursales, configuración comercial y auditoría.
- Devoluciones **completas** de facturas comerciales, autorizadas, con anulación y posible reintegro a existencias. No procesa automáticamente reembolsos de tarjetas.
- Diseño responsive, tema claro/oscuro, menús íntegramente en español, manifiesto de aplicación instalable.

## Instalación local

**Requisitos:** Node.js 22 o superior, npm, PostgreSQL 16+ (o instancia PostgreSQL en la nube) y cuenta Cloudinary para fotografías.

```bash
# 1. Clonar o descomprimir el proyecto.
cd colmado-erp

# 2. Instalar dependencias (requiere conexión a npm).
npm install

# 3. Crear y configurar variables privadas.
cp .env.example .env

# 4. Opcional: iniciar PostgreSQL local si tienes Docker.
docker compose up -d
# Atención: el valor predeterminado de la contraseña es solo para desarrollo local.

# 5. Crear tablas.
npm run db:push

# 6. Crear negocio, sucursal, 100 artículos de muestra y administrador.
# Antes del paso 6, definir ADMIN_EMAIL y ADMIN_PASSWORD seguros en .env.
npm run db:seed

# 7. Iniciar la aplicación.
npm run dev
```

Abrir **http://localhost:3000** y acceder con el correo y contraseña definidos en `.env`.

**Variables requeridas:** `DATABASE_URL`, `AUTH_SECRET` (mínimo 32 caracteres), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mínimo 12 caracteres para inicialización).

**Variables para fotografías:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Si no se configuran, la aplicación seguirá funcionando, pero la carga de fotografías devolverá una explicación clara hasta que se habilite el almacenamiento. No se guardan archivos en el servidor efímero.

### Generar un secreto

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Guárdalo en `AUTH_SECRET`. **Nunca subas el archivo `.env` a GitHub.**

## Despliegue en Vercel

1. Crea un repositorio GitHub privado para este proyecto y sube el código; no incluyas `.env`.
2. Aprovisiona PostgreSQL administrado con acceso desde Vercel (por ejemplo, Neon, Supabase o un servicio equivalente).
3. Aprovisiona Cloudinary y configura sus tres variables en el panel de variables de Vercel.
4. Configura `DATABASE_URL` y `AUTH_SECRET` en Vercel. Activa TLS y credenciales seguras para la base de datos.
5. En un entorno seguro, ejecuta **una vez** `npm run db:push` y `npm run db:seed`, con las credenciales del administrador. Para producción real, utiliza migraciones versionadas y revisadas, no `db:push` como estrategia de cambios continuos.
6. Conecta el repositorio a Vercel. El comando de construcción es `npm run build` (generación del cliente Prisma y compilación de Next.js).
7. Configura dominio, HTTPS, copias de seguridad y monitoreo antes de usar el sistema real.

## Facturación dominicana: limitación importante

La funcionalidad incluida **genera documentos comerciales internos en PDF**. No genera NCF/e-NCF válidos. Para facturación oficial se requiere integrar los servicios o proveedor autorizado, certificación/aprobaciones correspondientes, generación y firma de XML, envío, recepción, seguimiento, QR y procedimientos de anulación según DGII vigente. **Nunca consideres el PDF comercial como e-CF aprobado.**

El ITBIS se configura **por producto** (0% y tasas aplicables), pero el administrador debe revisar la clasificación fiscal real de cada artículo. El impuesto no debe suponerse idéntico para todos los productos.

## Límites conocidos y pendientes para producción

Aunque hay muchos flujos implementados, no es un ERP certificado ni una entrega final con todos los requisitos avanzados del prompt original. Quedan por implementar o ampliar: facturación fiscal DGII completa; impresión directa mediante hardware/puente local; POS offline con conciliación segura; devoluciones parciales; órdenes de compra con recepción parcial; inventario multialmacén/transferencias; FIFO/lotes completos; roles con permisos editables granularmente; copias de seguridad automatizadas; pruebas end-to-end sobre infraestructura real; conciliación bancaria; promociones automáticas vinculadas a productos; reportes fiscales 606/607 según normativa; interfaz más detallada de cuentas/estados financieros. Las ventas, compras y fiados implementan controles importantes, pero requieren pruebas integradas con PostgreSQL antes del uso comercial.

**Almacenamiento de imágenes:** no se incluyen imágenes con marcas comerciales. Las fotografías reales las sube el administrador mediante el formulario de productos. El backend valida el contenido real de archivos JPG/PNG/WEBP y restringe el tamaño.

**Seguridad:** no usar contraseñas de demostración. Revisar periódicamente dependencias, roles y los registros de auditoría; habilitar límites a nivel infraestructura y backups. Cualquier despliegue real debe pasar pruebas de concurrencia, seguridad y contabilidad.

## Rutas y estructura

- `src/app/page.tsx`: pantalla principal protegida.
- `src/app/iniciar-sesion`: acceso.
- `src/components/AppShell.tsx`: menú y navegación.
- `src/components/Dashboard.tsx`: indicadores.
- `src/components/ManagePage.tsx`: productos con fotografía, clientes, proveedores, categorías, gastos y delivery.
- `src/components/POS.tsx`: caja rápida / ventas.
- `src/components/Operations.tsx`: compras, fiados, caja, facturas, reportes, configuración y usuarios.
- `src/app/api`: endpoints protegidos.
- `src/app/api/uploads`: Cloudinary.
- `src/app/api/invoices/[id]/pdf`: PDF.
- `prisma/schema.prisma`: modelos de datos.
- `prisma/seed.ts`: semilla con negocio, sucursal, administrador y 100 productos.
- `tests/pricing.test.ts`: tests del motor de cálculos.

## Comprobaciones sugeridas

```bash
npm run check
npm run test
npm run build
```

Verifica además manualmente: alta de producto, subida de fotografía, búsqueda en POS, venta con y sin ITBIS, pago mixto, venta fiada, abono, compra, pago de proveedor, cierre de caja, exportación y PDF. Abre dos sesiones simultáneas para probar ventas concurrentes.

**Licencia:** este código se entrega para que lo adaptes a tu negocio. La marca comercial y las integraciones de servicios de terceros mantienen sus propios términos de uso.
