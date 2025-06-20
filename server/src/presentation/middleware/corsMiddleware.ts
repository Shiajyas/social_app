import cors from 'cors';

const corsMiddleware = cors({
  origin: "https://social-app-ten-nu.vercel.app",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Requested-With',
  ],
  optionsSuccessStatus: 200,
});

export default corsMiddleware;
