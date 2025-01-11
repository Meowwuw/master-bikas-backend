import express from "express";
import { getVideos } from "../controllers/videoController.js";

const router = express.Router();

// Ruta para obtener todos los videos
router.get("/videos", getVideos);

export default router;
