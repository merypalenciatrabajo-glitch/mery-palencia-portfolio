# Panel administrativo

## Preparación local

Desde la raíz del monorepo:

```bash
pnpm install --frozen-lockfile
pnpm --filter mery-palencia-admin typecheck
pnpm --filter mery-palencia-admin test
pnpm --filter mery-palencia-admin dev
```

El panel web se abre en `http://localhost:3001`.

## Variables de entorno

Copia `admin/.env.example` a `admin/.env.local` y completa únicamente la
configuración pública de la aplicación web de Firebase y Cloudinary. El archivo
local está ignorado por Git.

No guardes cuentas de servicio, claves privadas, tokens de GitHub ni tokens de
Firebase en variables que empiecen por `VITE_`: todo valor `VITE_` queda visible
en el bundle frontend.

## Firebase y permisos

Las reglas oficiales son `../firestore.rules` y `../storage.rules`. No copies
reglas permisivas desde documentación o desde la consola. Los usuarios del panel
requieren custom claims `role: "admin"`, `role: "editor"` o el claim heredado
`admin: true`; autenticar un usuario no le concede permisos administrativos.

Consulta `../FIREBASE_SECURITY.md` para asignación de roles, pruebas locales y
orden de despliegue.

## Android

La aplicación Android comparte este frontend mediante Capacitor. Las instrucciones
de compilación, deep links, firma y publicación están en [ANDROID.md](./ANDROID.md).
