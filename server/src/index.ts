import express, { response } from "express";
import aiRouter from "./routes/ai_task_routes.js";
import cors from "cors";
import { clerkAuth } from "./middleware/auth.middleware.js";
import authRouter from "./routes/auth.routes.js";

const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
}));
app.use(express.json());
app.use(clerkAuth);

const PORT = 8080;

app.use("/api", aiRouter);
app.use("/api", authRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on Port ${PORT}`);
})