import cors from 'cors';

const corsMiddleware = cors({
  origin: 'https://social-app-ten-nu.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204, // For legacy browsers
  maxAge: 1728000, // Preflight cache (20 days)
});

export default corsMiddleware;
