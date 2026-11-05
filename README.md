# Suki

Suki is a React Native mobile app with a Node.js/Express backend.

## Requirements

- Node.js 22.13.0+, 24.3.0+, or 26+ (npm is included)
- Android Studio with the Android SDK and an emulator, or a connected Android device
- JDK 17 for Android builds
- For iOS builds: macOS, Xcode, Ruby, and CocoaPods

Follow the [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment) for platform-specific Android or iOS setup.

## Install and run the mobile app

From the repository root:

```sh
npm ci
npm run start:metro
```

In another terminal, build and launch on Android:

```sh
npm run android
```

On macOS, install the iOS native dependencies once (and again after native dependency changes), then launch the app:

```sh
bundle install
bundle exec pod install
npm run ios
```

## Run the backend (optional)

Copy `.env.example` to `.env`, add your Supabase project URL and key, then start the API:

```sh
Copy-Item .env.example .env
npm run dev
```

The backend listens on port `3001` by default. `npm start` starts the backend without the development file watcher. See [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md) for database and Supabase setup.

## Tests

```sh
npm test
```

## Project layout

```text
android/                  Android native project
ios/                      iOS native project
assets/                   Images and other React Native assets
config/                   App and backend configuration
docs/                     Setup guides, schema, and project documentation
src/
  components/             Shared UI components
  features/
    customer/screens/     Customer app screens
    vendor/screens/       Vendor app screens
  backend/                Express API, routes, and controllers
  services/               App API services
  styles/                 Shared theme
  utils/                  Shared helpers
  index.js                React Native entry point
tests/                    Jest tests
```

The root `index.js`, `App.js`, and `server.js` are compatibility entry points for the React Native CLI and existing backend commands. New application code belongs under `src/`.
