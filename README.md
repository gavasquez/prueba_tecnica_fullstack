# Prueba técnica Fullstack - Secure Storage

¡Bienvenido! Este repo contiene un backend en Laravel (carpeta `secure-storage`) y un frontend en Vite/JS (carpeta `front`) que implementan un gestor seguro de archivos con roles, 
grupos, cuotas y validaciones.

## Decisiones de diseño

- **Roles y permisos**: Dos roles (`admin`, `user`). Se usa `Gate` y `Policies` para autorizar acciones (ver, descargar, eliminar, administrar usuarios/grupos, etc.).
- **Grupos**: El admin crea grupos y asigna usuarios. Los archivos pertenecen a un grupo y a un usuario.
- **Cuotas de almacenamiento**: Prioridad clara para evitar sorpresas:
  1) Límite por usuario (si está configurado)
  2) Límite por grupo
  3) Límite global por defecto
  Se calcula el uso del usuario (suma de sus archivos) antes de subir, y si excede, el backend bloquea con un mensaje claro. El frontend muestra el mensaje sin recargar.
- **Validaciones de seguridad de archivos**:
  - Lista de extensiones prohibidas configurable por admin.
  - Si subes un `.zip`, se inspecciona su contenido y se rechaza si hay extensiones prohibidas dentro.
  - Todas las validaciones ocurren en el backend.
- **Experiencia de usuario**:
  - Dashboard del usuario: lista sus archivos, muestra uso/cuota y permite subir/descargar/eliminar sin recargar la página.
  - Panel de admin: gestiona usuarios, grupos y configuración (límites y extensiones) con modales sencillos.
- **Rutas de configuración**:
  - Admin: `/api/settings` (CRUD protegido).
  - Usuarios autenticados: `/api/settings/public` (solo lectura de límites globales, sin permisos de admin).

## Requisitos previos

- PHP 8.2+
- Composer
- MySQL/PostgreSQL
- Node.js 18+

## Instalación y configuración

### 1. Backend (Laravel) - carpeta `secure-storage`

```bash
cd secure-storage
cp .env.example .env
```

Edita `.env` y configura tu base de datos, por ejemplo:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=secure_storage
DB_USERNAME=root
DB_PASSWORD=tu_password
```

Instala dependencias y genera la clave de la app:

```bash
composer install
php artisan key:generate
```

Ejecuta migraciones crea tablas y, si quieres, seeders:

```bash
php artisan migrate
# (Opcional) php artisan db:seed
```

Crea el enlace de almacenamiento público para descargas:

```bash
php artisan storage:link
```

Inicia el servidor del backend:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 2. Frontend (Vite) - carpeta `front`

En otra terminal:

```bash
cd ../front
cp .env.example .env  # si NO existe, crea .env con la línea de abajo
```

Asegúrate de tener en `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Instala dependencias e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre el navegador en la URL que te muestra Vite (por defecto `http://localhost:5173`).

## Cómo usarlo

1) Regístrate o inicia sesión.
2) Como usuario: ve a Mis Archivos, sube, descarga o elimina archivos. Verás tu uso y cuota.
3) Como admin: entra a Panel de Administración para:
   - Crear/editar/eliminar grupos.
   - Crear/editar/eliminar usuarios y asignarlos a grupos.
   - Configurar límites globales, tamaño máximo por archivo y extensiones prohibidas.

## Cuotas y validaciones

- Antes de subir, el backend verifica: `uso_actual_usuario + tamaño_nuevo <= cuota_asignada`.
- Prioridad de cuota: Usuario > Grupo > Global.
- Si se excede, responde 422 con: `Error: Cuota de almacenamiento (X MB) excedida` y el frontend lo muestra sin recargar.
- Para `.zip`, se inspeccionan todos los archivos internos y se rechaza si alguno tiene extensión prohibida.

## Credenciales de ejemplo, si ejecutas SEEDS

- **Administrador**
  - Email: `admin@gmail.com`
  - Password: `123456789`
  - (Si no existe, crea un usuario y en BD ponle `role_id = 1`)

- **Usuario**
  - Email: `user@gmail.com`
  - Password: `123456789`
  - (Regístralo desde la UI; por defecto queda con `role_id = 2`)

## Notas:

- Si cambias la configuración global (p.ej., límite por defecto a 20 MB), el Dashboard mostrará ese valor a usuarios que no tengan límite de usuario.
- Si das un Límite de almacenamiento (MB) al usuario en el panel admin, ese valor tiene la mayor prioridad.

## Scripts útiles

```bash
# Backend
php artisan migrate          # aplica migraciones
php artisan migrate:status   # estado de migraciones
php artisan storage:link     # link de storage público

# Frontend
npm run dev                  # servidor de desarrollo
```


