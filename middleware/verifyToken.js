import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    console.log('verifyToken middleware invocado');

    const token = req.headers['Authorization'];
    console.log('Token recibido:', token);

    if (!token) {
        console.log('Middleware verifyToken invocado para:', req.method, req.originalUrl);
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);

        req.user = {
            ID_USER: decoded.id, 
            email: decoded.email,
        };

        next();
    } catch (error) {
        console.log('Error al verificar el token:', error.message);
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

export default verifyToken;
