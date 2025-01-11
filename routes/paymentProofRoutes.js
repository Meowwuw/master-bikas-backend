import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadPaymentProof } from "../controllers/paymentProofController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

// Ruta para subir el comprobante de pago
router.post(
  "/upload-payment-proof",
  verifyToken,
  upload.single("file"),
  uploadPaymentProof
);

export default router;
