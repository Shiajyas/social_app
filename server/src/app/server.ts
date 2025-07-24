import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import session from "express-session";
import morgan from "morgan";
import corsMiddleware from "../presentation/middleware/corsMiddleware";
import userAuthRoutes from "../presentation/routes/users/userAuthRoutes";
import adminAuthRoutes from "../presentation/routes/admin/adminRoutes";
import notificationRoutes from "../presentation/routes/users/notificationRoutes";
import postRoutes from "../presentation/routes/users/postRoutes";
import { userRoutes } from "../presentation/routes/users/userRoutes";
import { errorHandler } from "../presentation/middleware/errorHandler";
import http from "http";
import cookieParser from "cookie-parser";
import redis from "../infrastructure/utils/redisClient";


// === SocketIO Chat/Call ===
import { initializeSocket } from "../infrastructure/socket/SocketServer";



export class App {
  public app: Application;
  private port: number;
  private server: http.Server;

  constructor(port: number) {
    this.app = express();
    this.port = port;

    // Main server
    this.server = http.createServer(this.app);

    // Media server (runs on a separate port or can be attached to same app with a different path)

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketServers();
  }

  private initializeMiddlewares(): void {
    this.app.use(corsMiddleware);
//  this.app.options('*', corsMiddleware); 


    this.app.use(bodyParser.json({ limit: "50mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    this.app.use(cookieParser());
    this.app.use(morgan("dev"));
    this.app.use(errorHandler)

    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secure-random-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000,
        },
      })
    );
  }

  private initializeRoutes(): void {

        this.app.get('/health/redis', async (req: Request, res: Response) => {
      console.log('🔁 /health/redis hit');
      try {
        const pong = await redis.ping();
        console.log('✅ Redis ping:', pong);
        res.json({ status: 'ok', redis: pong });
      } catch (error) {        
        console.error('❌ Redis health check failed', error);
        res.status(500).json({ status: 'error', message: 'Redis not reachable' });
      }
    });
  

    this.app.get("/test", (req, res) => {
      res.status(200).json({ message: "GET route is working!" });
    });

    

    this.app.use("/api", userAuthRoutes);
    this.app.use("/api/admin", adminAuthRoutes);
    this.app.use("/api/users", userRoutes());
    this.app.use("/api/users/notification", notificationRoutes);
    this.app.use("/api/users/posts", postRoutes);
  }

  private async initializeSocketServers(): Promise<void> {
    // 1. Initialize standard chat/call socket
    initializeSocket(this.server);

  

  }



  //write the start method

public start(): void {
  this.server.listen(this.port, '0.0.0.0', () => {
    console.log(`Main server running on http://0.0.0.0:${this.port}`);
  });
}

}

export default App;