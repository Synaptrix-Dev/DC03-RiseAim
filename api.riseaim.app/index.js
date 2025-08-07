import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import connectToDB from "./src/database/connection.js";
import asyncHandler from "./src/services/asyncHandler.service.js";

import mobileAppRoutes from "./src/router/ma/index.js";

import dotenv from "dotenv";

// Recreate __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: "./config.env" });

const server = express();

server.use(express.static(path.join(__dirname, "public")));
server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  })
);


server.use(express.json({ limit: "50mb" }));
server.use(express.urlencoded({ limit: "50mb", extended: true }));

server.use("/ma", mobileAppRoutes);

server.get(
  "/",
  asyncHandler(async (req, res, next) => {
    res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
  })
);

const PORT = process.env.PORT || 8001;

connectToDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(
        ` ==============🌐 Server Listening Port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
  });
