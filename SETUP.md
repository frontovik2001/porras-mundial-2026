# Porras Mundial 2026 — Setup

## 1. Instalar Node.js

Descarga Node.js LTS (v20) desde https://nodejs.org y reinicia la terminal.

## 2. Instalar dependencias

```bash
cd C:\Users\pein2\Documents\porras-mundial-2026
npm install
```

## 3. Configurar Firebase

1. Ve a https://console.firebase.google.com y crea un proyecto
2. Activa **Authentication** → Sign-in providers → Email/Password y Google
3. Activa **Firestore Database** en modo producción
4. En Firestore → Reglas, pega:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /predictions/{predId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

5. En Configuración del proyecto → Tus apps → Agrega app Web
6. Copia los valores de `firebaseConfig` a `.env.local`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## 4. Configurar Google Sign-In (opcional)

1. Ve a Google Cloud Console → APIs → Credenciales
2. Crea OAuth 2.0 Client IDs para Android, iOS y Web
3. Agrega los client IDs a `.env.local`

## 5. Correr la app

```bash
npx expo start
```

Escanea el QR con **Expo Go** (Android/iOS) o presiona `a` para Android emulator.

## 6. Verificar grupos del mundial

Revisa `constants/matches.ts` — los grupos usan los equipos del sorteo real de diciembre 2024.
Actualiza si hay algún error en la asignación de equipos.

## Estructura del proyecto

```
app/
  (auth)/login.tsx        # Login email + Google
  (auth)/register.tsx     # Registro
  (tabs)/index.tsx        # Partidos (72 grupos + eliminatoria)
  (tabs)/grupos.tsx       # Mis grupos privados
  (tabs)/ranking.tsx      # Leaderboard del grupo
  (tabs)/perfil.tsx       # Perfil y estadísticas
  grupo/[id].tsx          # Detalle de grupo
  grupo/crear.tsx         # Crear grupo
  grupo/unirse.tsx        # Unirse con código
  partido/[id].tsx        # Hacer predicción

constants/matches.ts      # 72 partidos de grupo + eliminatoria
lib/scoring.ts            # 5 pts exacto, 2 pts resultado, 0 fallo
hooks/usePredictions.ts   # CRUD de predicciones (Firestore + offline)
hooks/useGroup.ts         # Crear/unirse a grupos
contexts/AuthContext.tsx  # Firebase Auth (email + Google)
```
