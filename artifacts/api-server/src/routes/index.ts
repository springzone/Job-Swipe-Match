import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import jobsRouter from "./jobs";
import swipesRouter from "./swipes";
import matchesRouter from "./matches";
import applicationsRouter from "./applications";
import statsRouter from "./stats";
import employerRouter from "./employer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(jobsRouter);
router.use(swipesRouter);
router.use(matchesRouter);
router.use(applicationsRouter);
router.use(statsRouter);
router.use(employerRouter);

export default router;
