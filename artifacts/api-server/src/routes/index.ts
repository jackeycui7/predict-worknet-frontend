import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedRouter from "./feed";
import marketsRouter from "./markets";
import leaderboardRouter from "./leaderboard";
import agentsRouter from "./agents";
import epochsRouter from "./epochs";
import highlightsRouter from "./highlights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(feedRouter);
router.use(marketsRouter);
router.use(leaderboardRouter);
router.use(agentsRouter);
router.use(epochsRouter);
router.use(highlightsRouter);

export default router;
