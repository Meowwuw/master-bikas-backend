import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import prizeRoutes from "./routes/prizeRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import attemptsRoutes from "./routes/attemptsRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import testimonialRoutes from "./routes/testimonialsRoutes.js";
import adressRoutes from "./routes/addressRoutes.js";
import customQuestionRoutes from "./routes/customQuestionRoutes.js";
import paymentProofRoutes from "./routes/paymentProofRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import weeklyQuestionsRoutes from "./routes/weeklyQuestionsRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bienvenido al backend de master-bikas");
});

// Rutas
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", prizeRoutes);
app.use("/api", courseRoutes);
app.use("/api", attemptsRoutes);
app.use("/api", paymentsRoutes);
app.use("/api", testimonialRoutes);
app.use("/api", adressRoutes);
app.use("/api", customQuestionRoutes);
app.use("/api", paymentProofRoutes);
app.use("/api", questionRoutes);
app.use("/api", weeklyQuestionsRoutes)
app.use("/api", contactRoutes);
app.use("/api", videoRoutes);


// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
