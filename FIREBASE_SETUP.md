# 🔥 Configuración de Firebase para Revelación de Género

## Pasos para configurar Firebase:

### 1. Crear proyecto en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto llamado "revelacion-genero"
3. Habilita Google Analytics (opcional)

### 2. Configurar Firestore Database
1. Ve a "Firestore Database" en el menú lateral
2. Crea una base de datos
3. Comienza en modo de prueba (test mode)
4. Selecciona una ubicación (recomendado: southamerica-east1)

### 3. Obtener credenciales
1. Ve a "Project Settings" (ícono de engranaje)
2. En la pestaña "General", baja hasta "Your apps"
3. Haz clic en "Add app" y selecciona el ícono web (</>)
4. Registra tu app con el nombre "revelacion-genero"
5. Copia las credenciales que aparecen

### 4. Configurar el archivo config.ts
Reemplaza los valores en `src/app/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-project-id.firebaseapp.com",
  projectId: "tu-project-id",
  storageBucket: "tu-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 5. Configurar Firestore Security Rules (Opcional)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura a todos, escritura solo para administradores
    match /configuration/{document} {
      allow read: if true;
      allow write: if false; // Cambiar según necesidades
    }
    
    match /votes/{document} {
      allow read, write: if true;
    }
  }
}
```

### 6. Estructura de datos inicial en Firestore

#### Colección: `configuration`
Documento ID: `app-settings`
```json
{
  "gender": "niño",
  "revealDate": "2025-09-25T19:20:00-03:00",
  "lastUpdated": "2025-09-29T10:00:00Z"
}
```

#### Colección: `votes`
Los votos se crean automáticamente por la aplicación.

### 7. Probar la conexión
Una vez configurado, ejecuta:
```bash
ionic serve
```

La aplicación debería conectarse automáticamente a Firebase y cargar la configuración.