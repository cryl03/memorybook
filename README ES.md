# Primeros pasos

Este es un nuevo proyecto de React Native, iniciado con @react-native-community/cli, que incluye TypeScript, componentes con estilo y una arquitectura limpia y basada en Features.

✨ Características
⚛️ React Native 0.81+ con TypeScript

🎨 Componentes con estilo para el estilo

🏗️ Arquitectura basada en características organizada por funcionalidad

🧹 Arquitectura limpia con separación de tareas

📱 Navegación de React con navegación por pila y pestañas

🎯 TypeScript con verificación de tipos estricta

💅 Sistema de temas centralizado

🔧 Componentes personalizados (botón, encabezado, icono)

📐 Diseño responsivo con estilo basado en temas

## Primeros pasos
> Nota: Asegúrate de haber completado la guía "Configura tu entorno" antes de continuar.

## Paso 1: Instalar dependencias
Primero, instala todas las dependencias necesarias:

```bash
# Usando npm
npm install

cd ios
pod install
cd ..
```
Para iniciar el servidor de desarrollo Metro, ejecuta el siguiente comando desde la raíz de tu proyecto React Native:
```bash
# Usando npx
npx react-native start
```
## Android
```sh
npx react-native run-android
```
## iOS
```sh
npx react-native run-ios
```

Si todo está configurado correctamente, deberías ver tu nueva aplicación ejecutándose en el emulador de Android, el simulador de iOS o en tu dispositivo conectado.

Esta es una forma de ejecutar tu aplicación; también puedes compilarla directamente desde Android Studio o Xcode.

## Paso 2: Modifica tu aplicación
Ahora que has ejecutado la aplicación correctamente, ¡hagamos los cambios!

Si desea forzar la recarga, por ejemplo, para restablecer el estado de su aplicación, puede realizar una recarga completa:

Estructura del proyecto
```bash
src/
├── core/                # Cross-cutting concerns
│   ├── domain/          # Entities and interfaces
│   ├── application/     # Use cases
│   └── infrastructure/  # Concrete implementations
├── features/            # Functionality by feature
│   ├── home/            # Home feature
│   ├── profile/         # Profile feature
│   └── settings/        # Settings feature
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── BottomTabNavigator.tsx
│   └── types.ts
├── shared/              # Shared resources
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom hooks
│   ├── theme/           # Design system
│   └── utils/           # Utilities
└── app.tsx              # App entry point
```

## Scripts disponibles
### Limpiar la caché de Metro
```sh
npm start -- --reset-cache
```
### Ejecutar la comprobación de tipos de TypeScript
```sh
npm run type-check
```
### Ejecutar el análisis de linting
```sh
npm run lint
```
### Ejecutar Pruebas
```sh
npm test
```
### Error de comprobación de tipo en ejecución
```sh
npm run type-check
```

## Resumen de la arquitectura
Este texto estándar sigue los principios de la arquitectura limpia:

**Capa de dominio:** Lógica de negocio y entidades

**Capa de aplicación:** Casos de uso y servicios

**Capa de infraestructura:** Implementaciones externas

**Capa de presentación:** Componentes y pantallas de la interfaz de usuario

Cada función está integrada en el directorio features/, lo que promueve la modularidad y la escalabilidad.

## Componentes personalizados
El proyecto incluye varios componentes reutilizables:

**Button:** Múltiples variantes **(primary, secondary, outline, text)**

**Header:** Encabezado de navegación personalizado con botón de retroceso

**Icon:** Componente de ícono multiplataforma que utiliza **react-native-vector-icons**

## Sistema de temas
El proyecto incluye un sistema de temas centralizado:
```typescript
// Uso en componentes
import styled from 'styled-components/native';

const MyComponent = styled.View`
background-color: ${({ theme }) => theme.colors.primary};
padding: ${({ theme }) => theme.spacing.medium}px;
`;
```
## Navegación
La aplicación usa React Navigation con:

- Navegador de pila para transiciones de pantalla

- Navegación segura con ganchos personalizados

## Componente de encabezado personalizado

### ¡Felicitaciones!
¡Has ejecutado y modificado correctamente tu aplicación React Native con TypeScript y una arquitectura limpia!

## ¿Y ahora qué?
- Explora la estructura basada en funciones en **src/features/**

- Añade nuevas funciones siguiendo la arquitectura establecida

- Personaliza el sistema de temas en **src/shared/theme/**

- Consulta la guía de integración si lo añades a una aplicación existente

- Modifica la estructura de navegación en **src/navigation/**

- Añade nuevos componentes reutilizables en **src/shared/components/**

## Solución de problemas
- Problemas comunes
- Errores de resolución de módulos

## Borrar caché y reinstalar
```bash
npx react-native start --reset-cache
rm -rf node_modules
npm install
```
Problemas con pods de iOS
```bash
cd ios && pod deintegrate && pod install && cd ..
```
Errores de TypeScript
```bash
# Ejecutar comprobación de tipo
npm run type-check
```
## Problemas con temas de componentes con estilo
Comprueba que **src/shared/theme/styled.d.ts** está configurado correctamente.

### Problemas de dependencias
Si encuentras conflictos de dependencias, prueba:

```bash
npm install --legacy-peer-deps
```
## ¡Felicidades!

Tu aplicación se ha ejecutado correctamente.

##
> Autor: Luis Roberto Zamorano Tellez

> Fecha: Septiembre de 2025
##

¡Que disfrutes programando! 🚀