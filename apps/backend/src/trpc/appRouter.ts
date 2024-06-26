import { router } from ".";
import { boardRouter } from "./router/boardRouter";
import { dealRouter } from "./router/dealRouter";
import { lotRouter } from "./router/lotRouter";
import { recommendedProductsRouter } from "./router/recommendedRouter";
import { tendersRouter } from "./router/tendersRouter";
import { userRouter } from "./router/userRouter";

export const appRouter = router({
  tenders: tendersRouter,
  user: userRouter,
  board: boardRouter,
  deal: dealRouter,
  lot: lotRouter,
  recommendedProducts: recommendedProductsRouter,
});

export type AppRouter = typeof appRouter;
