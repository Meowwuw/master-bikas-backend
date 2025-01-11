import express from "express";
import { getTestimonials } from "../controllers/testimonialsController.js";

const router = express.Router();

// Ruta para obtener todos los testimonios
router.get("/testimonials", getTestimonials);

export default router;
