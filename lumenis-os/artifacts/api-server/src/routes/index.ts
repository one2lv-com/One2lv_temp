import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkpointRouter from "./checkpoint";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkpointRouter);
router.use(authRouter);

export default router;
