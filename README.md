# 🚀 Guía de Onboarding: Configuración del Entorno de Desarrollo Local

Esta guía detalla los pasos exactos que un nuevo desarrollador debe seguir en su primer día para tener el proyecto (Backend + Frontend) corriendo de forma completamente local usando los simuladores de Firebase y su propia base de datos MongoDB.

---

## 🛠️ Prerrequisitos Globales

Antes de descargar el código, asegúrate de tener instaladas las siguientes herramientas en tu máquina:

1. **Flutter SDK** (y Dart).
2. **Node.js** (recomendada versión 18+ o LTS) y **npm**.
3. **Firebase CLI**: Instálalo globalmente ejecutando `npm install -g firebase-tools`.
4. **MongoDB Compass** o Docker (Necesitas tener una instancia de MongoDB corriendo en tu puerto local `27017`).
5. **Git**.

---

## 🏗️ Fase 1: Levantando el Backend (Cloud Functions)

El backend de Cloud Functions actuará como el "servidor" al que se comunicará tu aplicación de Flutter localmente.

### 1. Clonar e Instalar
```bash
git clone <URL_DEL_REPO_DE_CLOUD_FUNCTIONS>
cd cloud_functions/functions
npm install
```

### 2. Autenticarse en Firebase
Es necesario hacer login en la herramienta de consola de Firebase para que los emuladores puedan descargar la configuración del proyecto:
```bash
firebase login
```
*(Opcional)* Si te lo solicitan, asegúrate de estar apuntando al proyecto correcto corriendo: `firebase use dev`

### 3. Crear las Variables de Entorno Locales
Por razones de seguridad, las contraseñas no se suben a Git. Debes crear tu propio archivo de configuración local.

1. En la carpeta `functions/`, crea un archivo llamado exactamente **`.env.dev`**.
2. Ábrelo y pega el siguiente contenido:

```env
ENVIRONMENT=dev
MONGO_URI=mongodb://admin:admin@localhost:27017/
MONGO_DB_NAME=club_movil_dev
```
> [!NOTE]
> Si tu MongoDB local no usa usuario/contraseña, asegúrate de cambiar la URL a la que te corresponda, por ejemplo: `mongodb://localhost:27017/`

### 4. Encender los Emuladores
Asegúrate de que tu MongoDB Compass esté abierto y corriendo. Luego activa los emuladores o dile que lea el ambiente dev:
```bash
firebase use dev
firebase emulators:start
```
> [!TIP]
> Deja esta terminal abierta. Verás en pantalla que se levantan servicios como **Auth Emulator** y **Functions Emulator**. También te dará un enlace (usualmente `http://localhost:4000`) donde puedes ver la base de datos de Auth gráficamente en tu navegador.

---

## 📱 Fase 2: Levantando el Frontend (App Flutter)

Con el backend en ejecución, ahora procedemos a encender la aplicación móvil.

### 1. Clonar e Instalar Dependencias
Abre una **nueva pestaña** en tu terminal (sin cerrar la de los emuladores) y ejecuta:
```bash
git clone <URL_DEL_REPO_DE_FLUTTER>
cd app_flutter
flutter pub get
```

### 2. Verificar la Conexión a Emuladores
El código de Flutter probablemente ya esté configurado, pero asegúrate de que al inicio de la app (comúnmente en `main.dart`, justo después de `Firebase.initializeApp();`) exista el bloque de código para conectarse a tu máquina local. Debe verse similar a esto:

```dart
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';

// ... en la función principal:
if (kDebugMode) {
  try {
    // Apunta la Autenticación al emulador local
    FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
    // Apunta las Functions al emulador local
    FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
  } catch (e) {
    print(e);
  }
}
```
> [!WARNING]
> Si estás corriendo desde un emulador de **Android** (Android Studio), la IP local `localhost` muchas veces no funciona. Es posible que tengas que cambiar la palabra `'localhost'` por `'10.0.2.2'` exclusivamente para Android.

### 3. Ejecutar la Aplicación
Conecta tu dispositivo físico o levanta tu simulador de iOS/Android y ejecuta:
```bash
flutter run
```

---

## ✅ Prueba de Éxito / Flujo de Trabajo

Para confirmar que armaste tu ambiente de forma correcta, haz la siguiente prueba:

1. Registra un usuario nuevo directamente en la pantalla de la App en tu dispositivo móvil.
2. Revisa la terminal donde dejaste corriendo `firebase emulators:start`. Deberías ver logs que dicen *"🔥 NUEVO USUARIO DETECTADO (beforeUserCreated)"*.
3. Abre tu **MongoDB Compass** local y revisa la base de datos `club_movil_dev`. ¡Al actualizar la tabla deberás ver el nuevo usuario creado!

¡Si todo esto ocurrió, tu ambiente está configurado al 100% y estás listo para programar!
