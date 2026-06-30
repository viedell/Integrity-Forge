import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assignmentsRouter from "./assignments";
import submissionsRouter from "./submissions";
import disputesRouter from "./disputes";
import templatesRouter from "./templates";
import analysisRouter from "./analysis";
import statsRouter from "./stats";
import meRouter from "./me";
import usersRouter from "./users";
import gapAnalysesRouter from "./gap_analyses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(usersRouter);
router.use(assignmentsRouter);
router.use(submissionsRouter);
router.use(disputesRouter);
router.use(templatesRouter);
router.use(analysisRouter);
router.use(statsRouter);
router.use(gapAnalysesRouter);

export default router;
