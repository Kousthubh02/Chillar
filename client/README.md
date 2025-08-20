# Chillar Client

## Overview
Chillar Client is a React Native mobile application built with Expo for managing financial transactions and events.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Kousthubh02/Chillar.git
cd chillar/client
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Environment Setup:
```bash
cp .env.example .env
```
Edit `.env` file with your configuration:
- Set `EXPO_PUBLIC_API_URL` to your backend URL
- Configure other environment variables as needed

## Development

1. Start the development server:
```bash
npx expo start
```

2. Run on specific platform:
```bash
# For Android
npx expo start --android

# For iOS
npx expo start --ios

# For web
npx expo start --web
```

## Building for Production

1. Configure EAS Build:
```bash
eas build:configure
```

2. Create a production build:
```bash
# For Android
eas build --platform android

# For iOS
eas build --platform ios
```

## Features
- User Authentication with MPIN
- OTP-based Password Reset
- Transaction Management
- Event Tracking
- Secure API Communications
- Offline Data Support
- Push Notifications

## Project Structure
```
client/
├── app/                 # Main application code
│   ├── components/     # React components
│   ├── utils/         # Utility functions
│   └── config.tsx     # App configuration
├── assets/            # Static assets
└── .env.example      # Environment variables template
```

## Security Features
- Secure token management
- API request encryption
- Environment variable protection
- Input validation
- Error handling
- Session management

## Troubleshooting
1. Metro bundler issues:
```bash
npx expo start --clear
```

2. Dependencies issues:
```bash
rm -rf node_modules
npm install
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

