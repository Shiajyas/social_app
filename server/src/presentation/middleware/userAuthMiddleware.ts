import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../core/domain/models/UserModel';
import { IUser } from '../../core/domain/interfaces/IUser';
import { AdminRepository } from '../../data/repositories/AdminRepository';

interface DecodedToken {
  id: string;
  role: string;
}

export class userAuthMiddleware {
  static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract token from Authorization header
      const token = req.cookies.userToken;
      // console.log("🔹 Received UserToken:", req.cookies);
      // console.log("🔹 Received Cookies:", JSON.stringify(req.cookies, null, 2));
      if (!token) {
        res.status(401).json({ msg: 'Token is missing' });
        return;
      }
      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
      ) as DecodedToken;
      // console.log("🔹 Decoded Token:", decoded);

      if (!decoded) {
        res.status(401).json({ msg: 'Invalid token' });
        return;
      }

      // Find user by ID
      const user =await User.findById(decoded.id)

      // console.log("🔹 Found User:", user);
      if (!user) {
        res.status(404).json({ msg: 'User not found' });
        return;
      }

      // Attach user to request object
      (req as Request & { user?: IUser }).user = user;
      next();
    } catch (err: any) {
      console.error('🚨 JWT Verification Error:', err.message);

      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ msg: 'Token has expired' });
        return;
      }

      res.status(500).json({ msg: 'Internal server error' });
    }
  }
}

export default userAuthMiddleware;
