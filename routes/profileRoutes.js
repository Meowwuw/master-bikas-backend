import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Obtener perfil por ID de usuario
router.get('/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const [profile] = await pool.query('SELECT * FROM perfil WHERE user_id = ?', [userId]);

        if (profile.length === 0) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }

        res.status(200).json(profile[0]);
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil' });
    }
});


export default router;
