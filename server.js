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
import testimonialsRoutes from './routes/testimonialsRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import addressRoutes from "./routes/addressRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import awardsRoutes from "./routes/awardsRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  exposedHeaders: ['Authorization'],
}));

// Rutas
app.use('/api/protected', authRoutes);
app.use('/api/protected', userRoutes);
app.use('/api/protected', commentRoutes);
app.use('/api/protected', profileRoutes);
app.use('/api/protected', questionRoutes);
app.use('/api/protected', courseRoutes);
app.use('/api/protected', awardsRoutes);

// Rutas públicas
app.use('/api', contactRoutes);
app.use('/api', registerRoutes);
app.use('/api', loginRoutes);
app.use('/api', verifyRoutes);
app.use('/api', testimonialsRoutes);
app.use('/api', videoRoutes);
app.use('/api', addressRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor corriendo');
});



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});


