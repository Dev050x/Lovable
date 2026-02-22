import express, { response } from "express";
import aiRouter from "./routes/ai_task_routes.js";

const app = express();
app.use(express.json());

const PORT = 3000;

app.use("/api", aiRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on Port ${PORT}`);
})

