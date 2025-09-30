# 🎉 Revelación de Género - Gender Reveal App

Una aplicación interactiva para revelaciones de género con cuenta regresiva, sistema de votaciones en tiempo real y efectos visuales impactantes.

Desarrollada con [Ionic Angular](https://ionicframework.com/docs/angular/overview) y [Firebase](https://firebase.google.com/) para funcionalidad en tiempo real.

## ✨ Características Principales

- **Cuenta Regresiva Dinámica**: Timer configurable desde Firebase hasta el momento de la revelación
- **Sistema de Votaciones**: Los invitados pueden votar "Niño" o "Niña" con restricciones por dispositivo
- **Revelación Automática**: Cambio automático de interfaz cuando llega el momento
- **Datos en Tiempo Real**: Toda la configuración y votaciones sincronizadas con Firebase
- **Interfaz Glassmorphism**: Diseño moderno con efectos de cristal y animaciones
- **Multiplataforma**: Funciona en iOS, Android y web

## 🛠️ Tecnologías Utilizadas

* **Framework**: [Angular](https://angular.io) + [Ionic Framework](https://ionicframework.com)
* **Backend**: [Firebase Firestore](https://firebase.google.com/products/firestore) para datos en tiempo real
* **UI Components**: 
  * Componentes Ionic personalizados con efectos glassmorphism
  * Animaciones CSS3 y transiciones suaves
  * Diseño responsive para todos los dispositivos
* **Servicios**:
  * `CountdownService`: Manejo de la cuenta regresiva con sincronización de Firebase
  * `VotingService`: Sistema de votaciones con restricciones por dispositivo
  * `ConfigurationService`: Gestión centralizada de configuración desde Firebase
* **Runtime**: [Capacitor](https://capacitor.ionicframework.com) para aplicaciones nativas

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Chana367/revelacion-genero.git
   cd revelacion-genero
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Firebase**:
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Crear el archivo `src/app/firebase/config.ts` con tu configuración
   - Configurar Firestore con las colecciones necesarias

4. **Ejecutar la aplicación**:
   ```bash
   ionic serve
   ```

## Project Structure
* Tab2 (Photos) (`src/app/tab2/`): Photo Gallery UI and basic logic.
* PhotoService (`src/app/services/photo.service.ts`): Logic encapsulating Capacitor APIs, including Camera, Filesystem, and Preferences.

## How to Run

> Note: It's highly recommended to follow along with the [tutorial guide](https://ionicframework.com/docs/angular/your-first-app), which goes into more depth, but this is the fastest way to run the app. 

0) Install Ionic if needed: `npm install -g @ionic/cli`.
1) Clone this repository.
2) In a terminal, change directory into the repo: `cd photo-gallery-capacitor-ng`.
3) Install all packages: `npm install`.
4) Run on the web: `ionic serve`.
5) Run on iOS or Android: See [here](https://ionicframework.com/docs/building/running).
