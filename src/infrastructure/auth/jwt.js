import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET ?? 'change_this_secret';
const expiresIn = '2h';
export function signToken(payload) {
    return jwt.sign(payload, secret, { expiresIn });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, secret);
    }
    catch {
        return null;
    }
}
