import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors'; 
import paymentRoutes from './routes/paymentRoutes.js';
import registerRoutes from './routes/registerRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import authRoutes from './routes/authRoutes.js'; 
import userRoutes from './routes/userRoutes.js'; 
import recoverPasswordRoutes from './routes/recoverPasswordRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import profileRoutes from './routes/profileRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', paymentRoutes); 
app.use('/api/users', registerRoutes); 
app.use('/api/users', loginRoutes); 
app.use('/api/users', verifyRoutes); 
app.use('/api/auth', authRoutes);  
app.use('/api/users', userRoutes);
app.use('/api/users', recoverPasswordRoutes);
app.use('/api/users', commentRoutes);
app.use('/api/perfil', profileRoutes); 
app.use('/api', courseRoutes);



// Ruta raíz
app.get('/', (req, res) => {
  res.send('API de Pagos con Yape');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
