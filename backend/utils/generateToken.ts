import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dailyflow_secret_key_123';

export const generateToken = (id: number) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: number };
};
