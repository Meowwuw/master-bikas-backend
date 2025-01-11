import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ error: "No se proporcionó un token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token recibido:", token);
    console.log("Datos decodificados:", decoded);

    req.user = decoded; 
    next(); 
  } catch (error) {
    console.error("Token inválido o expirado:", error);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
