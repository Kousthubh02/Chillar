// config.ts
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BACKEND_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined in environment variables');
}

export default {
  BACKEND_URL,
};
