import jwt from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  roles: string[];
};

const secret = process.env.JWT_SECRET ?? 'change_this_secret';
const expiresIn = '2h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}
