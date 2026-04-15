# La Guía Definitiva: Arquitectura Multi-Entorno
**Stack:** Flutter + Firebase Cloud Functions + MongoDB

El objetivo de este documento es establecer el "Paso a Paso" desde cero para configurar una arquitectura profesional que contenga tres entornos estrictamente separados: **Desarrollo (Local)**, **Staging (Nube)** y **Producción (Nube)**.

---

## FASE 1: Preparación de la Infraestructura (Consolas)

El primer paso ocurre en los navegadores web, preparando el terreno donde vivirá nuestra aplicación.

### 1. El Entorno Personal de Desarrollo (`dev`)
*Responsable: Cada Desarrollador Individualmente.*
1. El desarrollador entra a su cuenta personal de [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto gratuito nuevo (ej. `mi-app-dev-personal`).
3. Activa Firebase Authentication (con Email/Contraseña u otro proovedor base).
4. Localmente en su máquina, se asegura de tener **MongoDB Compass** instalado y corriendo en su puerto predeterminado (`mongodb://localhost:27017`).

### 2. El Entorno de Ensayo de la Empresa (`stg`)
*Responsable: Líder Técnico / DevOps.*
1. Con la cuenta corporativa de Google, crear un proyecto en Firebase llamado `nombre-empresa-stg`.
2. Habilitar Firebase Authentication.
3. Crear una base de datos MongoDB remota de prueba (ej. MongoDB Atlas con la capa gratuita o compartida). Obtener la cadena de conexión (URL).

### 3. El Entorno de Producción de la Empresa (`prod`)
*Responsable: Líder Técnico / DevOps.*
1. Crear un tercer proyecto en Firebase llamado `nombre-empresa-prod`. Este será el proyecto definitivo de los usuarios reales.
2. Habilitar Authentication y agregar dominio web si es necesario.
3. Crear el clúster definitivo de MongoDB en AWS. Obtener la cadena de conexión de producción. **Esta URL no se comparte con los desarrolladores base**, se guarda celosamente como un Secreto.

---

## FASE 2: Configurando el Backend (Cloud Functions)

### A. Vinculación de Proyectos (Archivos `.firebaserc`)
Dentro de la carpeta donde está `firebase.json`:
1. El líder vincula el proyecto principal como staging y prod:
   ```bash
   firebase use --add  # Selecciona 'empresa-stg' y le pone alias "stg"
   firebase use --add  # Selecciona 'empresa-prod' y le pone alias "prod"
   ```
2. Cada desarrollador que clone el repositorio vinculará su proyecto personal:
   ```bash
   firebase use --add  # Selecciona 'mi-app-dev-personal' y le pone alias "dev"
   ```

### B. Gestión de Enlaces a MongoDB (Variables de Entorno)
Firebase buscará archivos ocultos dependiendo de qué entorno estemos ejecutando o desplegando si se usa el CLI v2. Alternativamente (y la forma más ruda), se usan los parámetros de entorno en `.env`:
* Crear un archivo `.env` (no suele subirse a github, cada quien lo tiene). Ahí se coloca:
  `MONGO_URL="mongodb://localhost:27017/mibase"`
* Crear `.env.stg` (para cuando se despliegue a Staging):
  `MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/stg-db"`
* Crear `.env.prod` (Solo lo maneja el CI/CD o el Tech Lead):
  `MONGO_URL="mongodb+srv://admin:pass@aws-cluster.mongodb.net/prod-db"`

---

## FASE 3: Configurando el Frontend (FlutterFire)

El SDK móvil debe tener el conocimiento de a qué puerta llamar.

### A. Generación de Llaves de Conexión
En la carpeta raíz de Flutter, generar tres archivos distintos (asegúrate de tener `flutterfire_cli` instalado):
```bash
# Proceso del desarrollador en su máquina
flutterfire configure --project=ID-DEV-PERSONAL --out=lib/firebase_options_dev.dart

# Proceso de configuración general 
flutterfire configure --project=ID-EMPRESA-STG --out=lib/firebase_options_stg.dart
flutterfire configure --project=ID-EMPRESA-PROD --out=lib/firebase_options_prod.dart
```

### B. Enrutando el Tráfico en Dart
Configurar el `main.dart` para reaccionar a una variable de entorno inyectada al compilar:

```dart
// En main.dart
const environment = String.fromEnvironment('ENV', defaultValue: 'dev');

if (environment == 'prod') {
  await Firebase.initializeApp(options: DefaultFirebaseOptionsProd.currentPlatform);
} else if (environment == 'stg') {
  await Firebase.initializeApp(options: DefaultFirebaseOptionsStg.currentPlatform);
} else {
  // Entorno de Desarrollo
  await Firebase.initializeApp(options: DefaultFirebaseOptionsDev.currentPlatform);
  
  // BLOQUEO: Obligamos a que el SDK en vez de ir a la nube de tu proyecto personal, 
  // direccione el tráfico a tu computadora donde corren los emuladores.
  await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
  FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
}
```

---

## FASE 4: Onboarding (El primer día de un Desarrollador)

Cuando un nuevo programador entra al equipo, su flujo de trabajo desde cero para tener todo listo es:

1. **Obtener el código:**
   `git clone url-del-repo` (Bajar flutter y functions).
2. **Instalación:**
   Entrar a `functions` -> `npm install`
   Entrar a flutter -> `flutter pub get`
3. **Loguearse en la nube:**
   Correr `firebase login` e iniciar sesión con su correo personal.
4. **Enlazar el Backend:**
   Correr `firebase use --add`, elegir su proyecto basura personal y llamarlo `dev`.
5. **Enlazar el Frontend:**
   Correr `flutterfire configure` apuntando a su proyecto para obtener el `firebase_options_dev.dart` (Ya que esto está en el gitignore, él debe generar el suyo).
6. **Arrancar BD:**
   Abrir MongoDB Compass y conectar.
7. **¡Trabajar!:**
   Encender backend: `firebase emulators:start`
   Encender app: `flutter run` (por defecto usa DEV).
   
*¡Listo! Todo funciona en local, de manera segura y sin romper nada.*

---

## FASE 5: El Pase a Producción y GitHub Actions

### El Problema del Despliegue Manual
Hacer un paso a producción ejecutando `firebase use prod` y `firebase deploy` desde la computadora de una persona es **riesgoso**. 
Depende del internet de la persona, podría subir una versión incompleta o accidentalmente subir su `.env` local y apuntar la producción corporativa a un localhost rompiendo la app.

### La Mejor Solución: GitOps con GitHub Actions
**¿Qué es de manera sencilla?**
Piensa en GitHub Actions como un servidor o "un robot trabajador" que está siempre vigilando tu repositorio en GitHub. Tú le das instrucciones tipo receta de cocina: *"Si alguien fusiona código a la rama principal (MAIN), quiero que descargues el código tú mismo, instales librerías, y lo subas a Firebase por mí"*.

### Flujo Ideal (Ejemplo Visual)

1. **Tu día a día:** Creas una rama llamada `feature/login`, pruebas todo local en tus Emuladores. Si funciona, haces un *Pull Request* hacia Staging.
2. **Robot de Staging (Acción 1):** Tu compañero revisa el código, aprueba y se une a la rama `staging`. El robot de GitHub Actions detecta esto. Automáticamente inyecta las URL de la BD de `stg`, corre `firebase deploy --only functions --project stg`. En 2 minutos, el código está en la nube para que QA lo pruebe en el móvil con `flutter run --dart-define=ENV=stg`.
3. **El Lanzamiento a Producción (Acción 2):** Se programa un día de lanzamiento. Se hace un *Pull Request* de la rama `staging` hacia `main` (producción).
4. **Robot de Prod:** Al mezclarse en `main`, el robot despierta. Lee los secretos guardados en los "Settings" de tu repositorio de GitHub (nadie puede ver estos secretos, ni siquiera tú, son ciegos). Extrae la validación, compila, y ejecuta él mismo el despliegue a la nube de Prod, garantizando que el código subido es 100% puro e impoluto, igual al de `main`.

A partir de este momento, *ningún humano* sube código a producción manualmente. La terminal de los programadores solo sirve para conectarse a sus emuladores locales y jugar a salvo.
