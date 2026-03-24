import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stationsRouter from "./stations";
import scheduleRouter from "./schedule";
import ticketsRouter from "./tickets";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stations", stationsRouter);
router.use("/schedule", scheduleRouter);
router.use("/tickets", ticketsRouter);

export default router;
