# Android y Capacitor

## Identidad y compatibilidad

- Application ID de producción: `com.merypalencia.admin`.
- Application ID de debug: `com.merypalencia.admin.debug`.
- Nombre visible: `Mery Palencia Admin`.
- Android mínimo: API 24.
- Target/compile SDK: API 36.
- Java: JDK 21.

Los iconos y splash se generan de forma reproducible con:

```bash
python scripts/build_android_assets.py
```

## Compilación debug

Desde la raíz:

```bash
pnpm --filter mery-palencia-admin build
pnpm --filter mery-palencia-admin exec cap sync android
cd admin/android
gradlew.bat clean assembleDebug bundleDebug
```

Artefactos esperados:

- APK: `admin/android/app/build/outputs/apk/debug/app-debug.apk`.
- AAB: `admin/android/app/build/outputs/bundle/debug/app-debug.aab`.

La variante debug permite inspección de WebView. La variante release la desactiva,
rechaza HTTP sin cifrar, deshabilita backups y activa R8/resource shrinking.

## Vista previa offline con Firebase Emulator Suite

Esta vista permite revisar el panel sin Firebase ni servidor de producción. Usa
datos ficticios claramente marcados y una cuenta creada únicamente dentro de los
emuladores locales. No es una aplicación autónoma: mientras se prueba por USB, el
equipo debe mantener Firebase Emulator Suite en ejecución.

1. Copia `admin/.env.offline-preview.example` como
   `admin/.env.offline-preview`. Este último archivo está ignorado por Git.
2. Inicia los servicios locales desde la raíz:

   ```bash
   pnpm exec firebase emulators:start --project demo-mery-portfolio --only auth,firestore,storage
   ```

3. En otra terminal, carga los datos de prueba y enlaza los puertos por USB:

   ```bash
   pnpm run preview:firebase:seed
   adb reverse tcp:9099 tcp:9099
   adb reverse tcp:8080 tcp:8080
   adb reverse tcp:9199 tcp:9199
   ```

4. Construye e instala únicamente la variante debug:

   ```bash
   pnpm --filter mery-palencia-admin run android:sync:offline-preview
   cd admin/android
   gradlew.bat lintDebug assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

El acceso local se inicia automáticamente y muestra el aviso “Vista previa
offline”. La activación exige simultáneamente las variables de preview, una
plataforma nativa y una identidad o versión Android `debug`. La excepción HTTP
para `127.0.0.1` existe solo en `src/debug`; la variante release conserva HTTPS
estricto y nunca admite esta cuenta.

## Navegación y deep links

Esquemas admitidos:

- Producción: `merypalenciaadmin://app/<ruta>`.
- Debug: `merypalenciaadmin-debug://app/<ruta>`.

Rutas admitidas: `/`, `/login`, `/gallery`, `/galeria`, `/blog` y
`/commissions`. Se rechazan hosts, parámetros, fragmentos y rutas desconocidas.

Prueba local:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "merypalenciaadmin-debug://app/blog" com.merypalencia.admin.debug
```

El botón Atrás usa el historial interno y cierra la aplicación solamente desde
la raíz o el login. La última sección válida se conserva sin almacenar tokens.
Firebase Auth persiste la sesión en IndexedDB y actualiza el token cuando la app
vuelve a primer plano.

## Actualizaciones APK

El actualizador lateral se activa únicamente cuando
`VITE_ANDROID_UPDATE_BASE_URL` contiene un directorio HTTPS de confianza. El
documento privado `settings/appVersion` debe incluir `version`, `apkUrl`,
`sha256`, `updatedAt` y opcionalmente `changelog`. El APK se abre solamente tras
verificar SHA-256.

`REQUEST_INSTALL_PACKAGES` es incompatible con algunas políticas de Google Play.
Para una distribución exclusiva mediante Play Store debe retirarse el actualizador
lateral y ese permiso antes de publicar.

## Firma release

El keystore debe crearse y respaldarse fuera del repositorio. Nunca reutilices el
keystore previamente comprometido. Crea localmente `admin/android/keystore.properties`
(ignorado por Git):

```properties
storeFile=C:/ruta/privada/mery-palencia-production.jks
storePassword=...
keyAlias=mery-palencia
keyPassword=...
```

Compilación firmada:

```bash
cd admin/android
gradlew.bat clean assembleRelease bundleRelease
```

El build release se detiene si falta el keystore, el archivo no existe o alguna
credencial está vacía. Guarda por separado el keystore, contraseñas y certificados;
perderlos impide actualizar la aplicación instalada.

## Publicación y versionado

`pnpm --filter mery-palencia-admin release:prepare` incrementa `versionName` y
`versionCode`. Tras compilar y revisar el APK, `release:publish` requiere, solo en
el entorno local, `GITHUB_TOKEN`, `GITHUB_REPO`, `FIREBASE_ID_TOKEN` y la
configuración pública Firebase. El script calcula SHA-256, publica el APK y escribe
los metadatos protegidos en Firestore.

No ejecutes `release:publish` hasta verificar el APK firmado en un dispositivo
real. Ningún artefacto, keystore o token debe entrar en Git.
