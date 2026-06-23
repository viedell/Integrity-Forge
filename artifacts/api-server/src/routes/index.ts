import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assignmentsRouter from "./assignments";
import submissionsRouter from "./submissions";
import disputesRouter from "./disputes";
import templatesRouter from "./templates";
import analysisRouter from "./analysis";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assignmentsRouter);
router.use(submissionsRouter);
router.use(disputesRouter);
router.use(templatesRouter);
router.use(analysisRouter);
router.use(statsRouter);

export default router;
