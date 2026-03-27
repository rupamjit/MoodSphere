// middleware/doctorAuth.js

import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

export const protectDoctor = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await Doctor.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Doctor not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};