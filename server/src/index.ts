import express, { response } from "express";
import aiRouter from "./routes/ai_task_routes.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;

app.use("/api", aiRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on Port ${PORT}`);
})

