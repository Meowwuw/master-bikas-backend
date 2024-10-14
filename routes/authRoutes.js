import express from 'express';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/logout', verifyToken, (req, res) => {
    console.log(`Usuario con ID ${req.user.id} ha cerrado sesión exitosamente`);
    res.status(200).json({ message: 'Cierre de sesión exitoso' });
});

export default router;
