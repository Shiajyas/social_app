import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
  subscription: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
}

export const createAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '1d' });

export const createRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
