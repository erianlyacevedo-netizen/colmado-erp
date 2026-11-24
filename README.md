# Colmado ERP — variante de escritorio (código preparado, no compilado)

## Generar el instalador en Windows x64
1. Extraiga el ZIP en una carpeta nueva. No sobrescriba el proyecto original ni su base de datos.
2. Instale Node.js 22 x64 en una versión compatible con su Windows. Se necesita Internet durante la compilación.
3. Haga doble clic en `COMPILAR-EXE.bat`. Alternativamente ejecute `npm install` y luego `npm run dist` en CMD.
4. Si todas las etapas terminan correctamente, el instalador aparecerá en `dist/Colmado-ERP-Setup-1.0.0.exe`.
5. Instale y abra Colmado ERP. El asistente solicitará nombre del negocio, correo y contraseña (mínimo 12 caracteres). No necesita configurar Docker o PostgreSQL para esta variante.

## Alternativa GitHub Actions
Suba el contenido del proyecto a un repositorio propio, incluida la carpeta oculta `.github`. En GitHub, Actions > Compilar instalador Windows > Run workflow. Si la ejecución termina correctamente, descargue el artefacto Colmado-ERP-Instalador y extraiga el EXE. No suba archivos `.env` ni datos reales.

## Datos
La variante cambia PostgreSQL por SQLite. No importa bases de datos anteriores. El primer inicio copia una base vacía creada durante la compilación y genera un secreto local. No se cargan los datos ficticios del seed original. La base `colmado.db` y `auth-secret` están en el directorio de datos de Electron (normalmente bajo `%APPDATA%`, carpeta Colmado ERP). El arranque intenta crear una copia diaria si no detecta archivos de journal/WAL. No hay restaurador gráfico, migración automática ni retención implementados. Para un respaldo manual, cierre completamente la aplicación y copie toda esa carpeta. Las fotos locales se guardan en SQLite como data URLs; verifique rendimiento con catálogos grandes.

## Estado y advertencias
- Se corrigió formato de Prisma, se añadió generación postinstall, se retiraron tipos/filtros exclusivos de PostgreSQL y se preparó SQLite.
- Se añadió configuración inicial, servidor local, configuración NSIS y flujo Windows. Se conservó el código original de los módulos comerciales.
- El entorno de preparación no tuvo acceso a registry.npmjs.org (EAI_AGAIN). No se instalaron dependencias, no se ejecutó Prisma, TypeScript, las pruebas unitarias ni Next build; tampoco se creó ni probó el EXE. Solo se verificó la sintaxis de los scripts de escritorio con Node. No es una versión certificada para uso comercial.
- El Windows 10 build 18363 indicado es antiguo; compatibilidad de runtime no comprobada. Actualice a una versión de Windows con soporte de seguridad cuando sea posible. No desactive SmartScreen.
- El instalador previsto no está firmado. No hay integración fiscal DGII acreditada. Validar cálculos monetarios SQLite, operaciones, impresión, descarga de archivos, seguridad y persistencia antes de usar con información real. No se implementó migración de datos existentes, firma, restauración gráfica ni todas las pruebas descritas en el prompt.
- README-ORIGINAL.md documenta el proyecto PostgreSQL de origen; sus instrucciones de Docker no corresponden a esta variante.
