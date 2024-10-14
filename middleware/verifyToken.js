import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    // Log para ver si el middleware está siendo llamado
    console.log('verifyToken middleware invocado');

    // Obtener el token del header de autorización
    const token = req.headers['authorization'];
    
    // Log para ver qué token se está recibiendo
    console.log('Token recibido:', token);

    // Verificar si el token existe
    if (!token) {
        console.log('No se proporcionó un token');
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        // Verificar el token con el JWT_SECRET
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        
        // Log para ver qué información se decodificó del token
        console.log('Token decodificado:', decoded);

        // Guardar la info del usuario en la solicitud
        req.user = decoded;
        
        // Pasar al siguiente middleware o ruta
        next();
    } catch (error) {
        // Log para ver si hubo un error en la verificación del token
        console.log('Error al verificar el token:', error.message);
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

export default verifyToken;
