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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api', paymentRoutes);
console.log("Rutas montadas para /api/payments")
app.use('/api/users', registerRoutes); 
app.use('/api/users', loginRoutes); 
app.use('/api/users', verifyRoutes); 
app.use('/api/auth', authRoutes);  
app.use('/api/users', userRoutes);
app.use('/api/users', recoverPasswordRoutes);
app.use('/api/users', commentRoutes);
app.use('/api', profileRoutes); 
app.use('/api', questionRoutes); 
app.use('/api', courseRoutes);
app.use('/api', testimonialsRoutes);
app.use("/api", videoRoutes);
app.use("/api", addressRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor corriendo');
});

// Iniciar el servidor
app._router.stack.forEach(function (middleware) {
  if (middleware.route) { 
      console.log(`Ruta: ${middleware.route.path}`);
  } else if (middleware.name === 'router') { 
      middleware.handle.stack.forEach(function (handler) {
          if (handler.route) {
              console.log(`Ruta anidada: ${handler.route.path}`);
          }
      });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

