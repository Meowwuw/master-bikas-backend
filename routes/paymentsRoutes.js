import express from "express";
import {
  registerPayment,
  getPayments,
  updatePayment,
  deletePayment,
  checkPaymentStatus,
  checkPaymentStatusByQuestion,
  getPaidAnswers
} from "../controllers/paymentsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Registrar un pago
router.post("/payments", verifyToken, registerPayment);

// Obtener todos los pagos
router.get("/payments", verifyToken, getPayments);

// Actualizar un pago
router.put("/payments/:id", verifyToken, updatePayment);

// Ruta para eliminar un pago
router.delete("/payments/:id", verifyToken, deletePayment);

// Verificar estado del último pago
router.get("/check-payment-status", verifyToken, checkPaymentStatus);

// Verificar estado del pago por pregunta
router.get("/check-payment-status/:questionId", verifyToken, checkPaymentStatusByQuestion);

// Obtener respuestas pagadas
router.get("/paid-answers", verifyToken, getPaidAnswers);

export default router;
