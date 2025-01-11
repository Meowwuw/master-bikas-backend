import express from "express";
import { createContactRequest } from "../controllers/contactController.js"; 

const router = express.Router();

router.post("/contact-request", createContactRequest);

export default router;
