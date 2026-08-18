# Getting Started

This is a new React Native project, bootstrapped using @react-native-community/cli, featuring TypeScript, Styled Components, and a Feature-Based + Clean Architecture.

✨ Features
⚛️ React Native 0.81+ with TypeScript

🎨 Styled Components for styling

🏗️ Feature-Based Architecture organized by functionality

🧹 Clean Architecture with separation of concerns

📱 React Navigation with stack and tab navigation

🎯 TypeScript with strict type checking

💅 Centralized theme system

🔧 Custom components (Button, Header, Icon)

📐 Responsive design with theme-based styling

## Getting Started
> Note: Make sure you have completed the Set Up Your Environment guide before proceeding.

## Step 1: Install Dependencies
First, install all required dependencies:

```bash
# Using npm
npm install

cd ios
pod install
cd ..
```
To start the Metro dev server, run the following command from the root of your React Native project:
```bash
# Using npx
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

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 2: Modify your app
Now that you have successfully run the app, let's make changes!

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

Project Structure
```bash
text
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

## Available Scripts
### Clean Metro cache
```sh
npm start -- --reset-cache
```
### Run TypeScript type check
```sh
npm run type-check
```
### Run linting
```sh
npm run lint
```
### Run tests
```sh
npm test
```
### Bump app version (iOS + Android)
Source of truth: `package.json` (`version` + `buildNumber`).

Run **before each store build / release**. The script increments the patch (and build), then syncs both platforms:

```sh
npm run version:bump
```

Example: `1.0.0` (build `1`) → `1.0.1` (build `2`).

| Field | package.json | iOS | Android |
| --- | --- | --- | --- |
| Marketing version | `version` | `MARKETING_VERSION` | `versionName` |
| Build number | `buildNumber` | `CURRENT_PROJECT_VERSION` | `versionCode` |

Other options:

```sh
# Align natives to package.json without incrementing
npm run version:sync

# Minor / major bumps
node scripts/bump-version.js --minor
node scripts/bump-version.js --major
```

The version is shown in the Profile screen (`Versión X.Y.Z · Build N`).

### Run Type Check Error
```sh
npm run type-check
``` 

## Architecture Overview
This boilerplate follows Clean Architecture principles:

**Domain Layer:** Business logic and entities

**Application Layer:** Use cases and services

**Infrastructure Layer:** External implementations

**Presentation Layer:** UI components and screens

Each feature is self-contained within the features/ directory, promoting modularity and scalability.

## Custom Components
The project includes several reusable components:

**Button:** Multiple variants **(primary, secondary, outline, text)**

**Header:** Custom navigation header with back button support

**Icon:** Cross-platform icon component using **react-native-vector-icons**

## Theme System
The project includes a centralized theme system:
```typescript
// Usage in components
import styled from 'styled-components/native';

const MyComponent = styled.View`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.medium}px;
`;
```
## Navigation
The app uses React Navigation with:

- Stack Navigator for screen transitions

- Type-safe navigation with custom hooks

## Custom header component

### Congratulations!
You've successfully run and modified your React Native App with TypeScript and Clean Architecture!

## Now what?
- Explore the feature-based structure in **src/features/**

- Add new features following the established architecture

- Customize the theme system in **src/shared/theme/**

- Check out the Integration guide if adding to an existing app

- Modify the navigation structure in **src/navigation/**

- Add new reusable components in **src/shared/components/**

## Troubleshooting
- Common Issues
- Module Resolution Errors

## Clear cache and reinstall
```bash
npx react-native start --reset-cache
rm -rf node_modules
npm install
```
iOS Pod Issues
```bash
cd ios && pod deintegrate && pod install && cd ..
```
TypeScript Errors
```bash
# Run type check
npm run type-check
```
## Styled Components Theme Issues
Check that src/shared/theme/styled.d.ts is properly configured.

### Dependency Issues
If you encounter dependency conflicts, try:

```bash
npm install --legacy-peer-deps
```
## Congratulations!

You've successfully run your App

## 
> Author: Luis Roberto Zamorano Tellez

> Date: September 2025
##

Happy Coding! 🚀