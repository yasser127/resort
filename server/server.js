
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import servicesRoute from "./routes/serviceRoute.js";
import roomsRoute from "./routes/roomsRoute.js";
import path from "path";
import reviewsRoute from "./routes/reviewRoutes.js";

dotenv.config();

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


app.use("/auth", authRoutes);
app.use("/services", servicesRoute);
app.use("/rooms", roomsRoute);
app.use("/reviews", reviewsRoute)


app.get("/", (req, res) => res.json({ ok: true }));



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
