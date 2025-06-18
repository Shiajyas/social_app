import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../../core/domain/interfaces/IUser';
import { AdminRepository } from '../../data/repositories/AdminRepository';

interface DecodedToken {
  id: string;
  role: string;
}

export class adminAuthMiddleware {
  static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = req.cookies.adminToken;

      if (!token) {
        res.status(401).json({ msg: 'Token is missing' });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
      ) as DecodedToken;

      if (!decoded || decoded.role !== 'admin') {
        res.status(401).json({ msg: 'Invalid token or role' });
        return;
      }

      console.log("🔹 Decoded Token:", decoded);

      const adminRepo = new AdminRepository();
      const user = await adminRepo.findById(decoded.id);

      if (!user) {
        res.status(404).json({ msg: 'Admin not found' });
        return;
      }

      // Attach to request
      (req as Request & { user?: any }).user = user;
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

export default adminAuthMiddleware;
