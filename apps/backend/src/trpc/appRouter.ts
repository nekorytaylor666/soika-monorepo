import { router } from ".";
import { boardRouter } from "./router/boardRouter";
import { dealRouter } from "./router/dealRouter";
import { lotRouter } from "./router/lotRouter";
import { recommendedLotsRouter } from "./router/recommendedLotsRouter";
import { recommendedProductsRouter } from "./router/recommendedRouter";
import { scheduleRouter } from "./router/scheduleRouter";
import { userRouter } from "./router/userRouter";

export const appRouter = router({
  user: userRouter,
  board: boardRouter,
  deal: dealRouter,
  lot: lotRouter,
  recommendedProducts: recommendedProductsRouter,
  recommendedLots: recommendedLotsRouter,
  schedule: scheduleRouter,
});

export type AppRouter = typeof appRouter;
