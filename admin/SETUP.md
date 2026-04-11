# Setup del Panel Admin

## 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Activa **Authentication** → Sign-in method → Email/Password
4. Activa **Firestore Database** (modo producción)
5. Activa **Storage**

## 2. Configurar variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```
cp .env.example .env
```

Los valores los encuentras en: Firebase Console → Project Settings → Your apps → Web app

## 3. Crear el usuario administrador

En Firebase Console → Authentication → Users → Add user
- Ingresa el email y contraseña del administrador

## 4. Activar 2FA (TOTP)

En Firebase Console → Authentication → Sign-in method → Multi-factor authentication → Enable

El administrador activa el 2FA desde la app la primera vez que inicia sesión
(o puedes hacerlo manualmente desde la consola de Firebase).

## 5. Crear colecciones en Firestore

Crea estas colecciones con sus documentos iniciales:

### `commissions` (3 documentos)
```json
{
  "name": "Ilustración Simple",
  "price": "$150 - $300",
  "description": "...",
  "includes": ["Diseño conceptual", "1 revisión", "Archivo digital"],
  "featured": false,
  "order": 0
}
```

### `processSteps` (6 documentos)
```json
{
  "number": "01",
  "title": "Concepto",
  "description": "Discutimos tu idea...",
  "order": 0
}
```

### `gallery` y `blogPosts`
Se crean desde el panel admin directamente.

## 6. Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 7. Reglas de Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 8. Instalar y correr

```bash
cd admin
pnpm install
pnpm dev
```

El admin corre en `http://localhost:3001`
