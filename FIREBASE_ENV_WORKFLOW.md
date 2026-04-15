# Guía de Gestión de Entornos Múltiples: Firebase & Flutter

Esta guía documenta el flujo de trabajo estándar para manejar múltiples proyectos de Firebase (como el entorno de desarrollo personal y el entorno de producción de la empresa) integrados con una aplicación Flutter y Cloud Functions.

## 1. Visión General de Entornos

Para mantener un ciclo de desarrollo seguro y limpio, es indispensable trabajar como mínimo con dos entornos:
- **`prod` (Producción de la Empresa):** Recibe únicamente código estable, probado y aprobado.
- **`dev` (Desarrollo Personal):** Actúa como el entorno de pruebas individual de cada desarrollador donde se puede modificar, romper y probar sin afectar la base de datos principal.

---

## 2. Configuración en la Terminal (Autenticación)

Firebase CLI es el centro de control de tu configuración. El CLI asocia los accesos a una sesión activa en tu computadora.

### Comandos clave de sesión:
- **Añadir una cuenta nueva (ej. cuenta de la empresa):**
  ```bash
  firebase login:add
  ```
- **Ver las sesiones iniciadas y cuál está activa:**
  ```bash
  firebase login:list
  ```
  *(La cuenta con un `✔` en la columna "Current" es la que se usará para los despliegues de Cloud Functions y la recolección de proyectos de FlutterFire).*
- **Cerrar sesión:**
  ```bash
  firebase logout
  ```

---

## 3. Flujo de Trabajo del Backend (Cloud Functions)

> **⚠️ Importante:** Todos los comandos que empiecen con `firebase...` se deben ejecutar en la raíz del proyecto backend (donde se ubica el archivo `firebase.json`).

### Vincular Proyectos Locales
Un mismo repositorio local puede apuntar a varios proyectos de la nube utilizando el sistema de alias de Firebase CLI. Configúralo así cuando incorpores un entorno nuevo:

```bash
# Agregar tu proyecto personal de pruebas
firebase use --add
# Seleccionar proyecto personal -> Alias: "dev"

# Agregar el proyecto de la empresa
firebase use --add
# Seleccionar proyecto corporativo -> Alias: "prod"
```

### El Día a Día (Desarrollando)
Para asegurarte de estar trabajando sobre tu entorno de desarrollo antes de ejecutar emuladores o subir cambios:

```bash
firebase use dev
firebase emulators:start    # Levantar entorno local
firebase deploy             # Desplegar a la nube personal
```

### Desplegar a Producción (Empresa)
```bash
firebase use prod
firebase deploy --only functions
```

---

## 4. Flujo de Trabajo del Frontend (FlutterFire)

> **⚠️ Importante:** El comando de configuración de Firebase en Flutter (`flutterfire`) se conecta al Firebase CLI para saber quién está autenticado y qué proyectos existen. Este comando **siempre se debe ejecutar en la raíz del proyecto Flutter** (donde está el `pubspec.yaml`).

### Problema Inicial
El archivo tradicional `firebase_options.dart` apunta a un único entorno y subirlo a Git puede sobrescribir los accesos de otros miembros del equipo.

### Solución: Generación para Múltiples Entornos
`flutterfire configure` puede ejecutarse **todas las veces que sea necesario** para mapear los distintos proyectos, generando un archivo dedicado por entorno:

**1. Generar credenciales de Producción:**
```bash
flutterfire configure --project=ID-PROYECTO-PROD --out=lib/firebase_options_prod.dart
```

**2. Generar credenciales de Desarrollo (Tu proyecto personal):**
```bash
flutterfire configure --project=ID-TU-PROYECTO-DEV --out=lib/firebase_options_dev.dart
```
> *💡 Tip: Es buena práctica añadir el archivo `firebase_options_dev.dart` al `.gitignore`. De esta forma, cada desarrollador generará y usará localmente las credenciales que apuntan a su propia base de prueba, sin crear conflictos de código.*

### Cómo consumir las distintas opciones en Flutter
Para alternar automáticamente entre entornos según la necesidad, utiliza `--dart-define` y una lógica condicional en tu `main.dart`:

```dart
import 'firebase_options_dev.dart';
import 'firebase_options_prod.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  const environment = String.fromEnvironment('ENV', defaultValue: 'dev');

  if (environment == 'prod') {
    // Si lanzas o compilas con --dart-define=ENV=prod
    await Firebase.initializeApp(options: DefaultFirebaseOptionsProd.currentPlatform);
  } else {
    // Si simplemente corres el proyecto de forma normal
    await Firebase.initializeApp(options: DefaultFirebaseOptionsDev.currentPlatform);
  }
  
  runApp(MyApp());
}
```

### Comandos de Ejecución y Compilación
* **A diario (Desarrollo):** `flutter run` *(tomará `dev` por defecto)*
* **Compilar para QA o Producción:**
  `flutter build apk --dart-define=ENV=prod`
