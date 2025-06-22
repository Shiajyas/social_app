import cors from 'cors';

const corsMiddleware = cors({
  origin:['https://social-app-ten-nu.vercel.app', 
         'http://localhost:3001',
        'http://192.168.1.7:3001',] ,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204, 
  maxAge: 1728000, 
});

export default corsMiddleware;
