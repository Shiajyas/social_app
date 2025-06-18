import { IUser } from '../core/domain/interfaces/IUser';


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}


declare module 'express-session' {
  interface Session {
    user?: IUser;
  }
}

export {};
