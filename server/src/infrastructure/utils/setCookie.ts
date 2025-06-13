import { Response } from 'express';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  } = {},
) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: options.maxAge ?? 7 * 24 * 60 * 60 * 1000, // 1 week expiration
  });
};
