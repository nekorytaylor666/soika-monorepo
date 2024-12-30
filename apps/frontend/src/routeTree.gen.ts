/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as VerifyOtpImport } from './routes/verifyOtp'
import { Route as TestImport } from './routes/test'
import { Route as OnboardingImport } from './routes/onboarding'
import { Route as LoginImport } from './routes/login'
import { Route as DashboardRouteImport } from './routes/dashboard/route'
import { Route as DashboardTasksIndexImport } from './routes/dashboard/tasks/index'
import { Route as DashboardSchedulesIndexImport } from './routes/dashboard/schedules/index'
import { Route as DashboardLotsIndexImport } from './routes/dashboard/lots/index'
import { Route as DashboardBoardsIndexImport } from './routes/dashboard/boards/index'
import { Route as DashboardAnalyticsIndexImport } from './routes/dashboard/analytics/index'
import { Route as DashboardTasksTaskIdImport } from './routes/dashboard/tasks/$taskId'
import { Route as DashboardLotsLotIdImport } from './routes/dashboard/lots/$lotId'
import { Route as DashboardDealsDealIdImport } from './routes/dashboard/deals/$dealId'
import { Route as DashboardCandidateRecommendedIdImport } from './routes/dashboard/candidate/$recommendedId'
import { Route as DashboardBoardsBoardIdImport } from './routes/dashboard/boards/$boardId'
import { Route as DashboardRecommendationsRecommendedIdRouteImport } from './routes/dashboard/recommendations/$recommendedId/route'
import { Route as DashboardAnalyticsAgentIndexImport } from './routes/dashboard/analytics/agent/index'
import { Route as DashboardSchedulesResultsResultIdImport } from './routes/dashboard/schedules/results/$resultId'
import { Route as DashboardRecommendationsRecommendedIdLotIdImport } from './routes/dashboard/recommendations/$recommendedId/$lotId'
import { Route as DashboardAnalyticsKtruIdImport } from './routes/dashboard/analytics/ktru/$id'

// Create Virtual Routes

const KanbanLazyImport = createFileRoute('/kanban')()
const AboutLazyImport = createFileRoute('/about')()
const IndexLazyImport = createFileRoute('/')()
const DashboardIndexLazyImport = createFileRoute('/dashboard/')()

// Create/Update Routes

const KanbanLazyRoute = KanbanLazyImport.update({
  id: '/kanban',
  path: '/kanban',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/kanban.lazy').then((d) => d.Route))

const AboutLazyRoute = AboutLazyImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/about.lazy').then((d) => d.Route))

const VerifyOtpRoute = VerifyOtpImport.update({
  id: '/verifyOtp',
  path: '/verifyOtp',
  getParentRoute: () => rootRoute,
} as any)

const TestRoute = TestImport.update({
  id: '/test',
  path: '/test',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingRoute = OnboardingImport.update({
  id: '/onboarding',
  path: '/onboarding',
  getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const DashboardRouteRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRoute,
} as any)

const IndexLazyRoute = IndexLazyImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const DashboardIndexLazyRoute = DashboardIndexLazyImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => DashboardRouteRoute,
} as any).lazy(() =>
  import('./routes/dashboard/index.lazy').then((d) => d.Route),
)

const DashboardTasksIndexRoute = DashboardTasksIndexImport.update({
  id: '/tasks/',
  path: '/tasks/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardSchedulesIndexRoute = DashboardSchedulesIndexImport.update({
  id: '/schedules/',
  path: '/schedules/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardLotsIndexRoute = DashboardLotsIndexImport.update({
  id: '/lots/',
  path: '/lots/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardBoardsIndexRoute = DashboardBoardsIndexImport.update({
  id: '/boards/',
  path: '/boards/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardAnalyticsIndexRoute = DashboardAnalyticsIndexImport.update({
  id: '/analytics/',
  path: '/analytics/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardTasksTaskIdRoute = DashboardTasksTaskIdImport.update({
  id: '/tasks/$taskId',
  path: '/tasks/$taskId',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardLotsLotIdRoute = DashboardLotsLotIdImport.update({
  id: '/lots/$lotId',
  path: '/lots/$lotId',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardDealsDealIdRoute = DashboardDealsDealIdImport.update({
  id: '/deals/$dealId',
  path: '/deals/$dealId',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardCandidateRecommendedIdRoute =
  DashboardCandidateRecommendedIdImport.update({
    id: '/candidate/$recommendedId',
    path: '/candidate/$recommendedId',
    getParentRoute: () => DashboardRouteRoute,
  } as any)

const DashboardBoardsBoardIdRoute = DashboardBoardsBoardIdImport.update({
  id: '/boards/$boardId',
  path: '/boards/$boardId',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardRecommendationsRecommendedIdRouteRoute =
  DashboardRecommendationsRecommendedIdRouteImport.update({
    id: '/recommendations/$recommendedId',
    path: '/recommendations/$recommendedId',
    getParentRoute: () => DashboardRouteRoute,
  } as any)

const DashboardAnalyticsAgentIndexRoute =
  DashboardAnalyticsAgentIndexImport.update({
    id: '/analytics/agent/',
    path: '/analytics/agent/',
    getParentRoute: () => DashboardRouteRoute,
  } as any)

const DashboardSchedulesResultsResultIdRoute =
  DashboardSchedulesResultsResultIdImport.update({
    id: '/schedules/results/$resultId',
    path: '/schedules/results/$resultId',
    getParentRoute: () => DashboardRouteRoute,
  } as any)

const DashboardRecommendationsRecommendedIdLotIdRoute =
  DashboardRecommendationsRecommendedIdLotIdImport.update({
    id: '/$lotId',
    path: '/$lotId',
    getParentRoute: () => DashboardRecommendationsRecommendedIdRouteRoute,
  } as any)

const DashboardAnalyticsKtruIdRoute = DashboardAnalyticsKtruIdImport.update({
  id: '/analytics/ktru/$id',
  path: '/analytics/ktru/$id',
  getParentRoute: () => DashboardRouteRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardRouteImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/onboarding': {
      id: '/onboarding'
      path: '/onboarding'
      fullPath: '/onboarding'
      preLoaderRoute: typeof OnboardingImport
      parentRoute: typeof rootRoute
    }
    '/test': {
      id: '/test'
      path: '/test'
      fullPath: '/test'
      preLoaderRoute: typeof TestImport
      parentRoute: typeof rootRoute
    }
    '/verifyOtp': {
      id: '/verifyOtp'
      path: '/verifyOtp'
      fullPath: '/verifyOtp'
      preLoaderRoute: typeof VerifyOtpImport
      parentRoute: typeof rootRoute
    }
    '/about': {
      id: '/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof AboutLazyImport
      parentRoute: typeof rootRoute
    }
    '/kanban': {
      id: '/kanban'
      path: '/kanban'
      fullPath: '/kanban'
      preLoaderRoute: typeof KanbanLazyImport
      parentRoute: typeof rootRoute
    }
    '/dashboard/': {
      id: '/dashboard/'
      path: '/'
      fullPath: '/dashboard/'
      preLoaderRoute: typeof DashboardIndexLazyImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/recommendations/$recommendedId': {
      id: '/dashboard/recommendations/$recommendedId'
      path: '/recommendations/$recommendedId'
      fullPath: '/dashboard/recommendations/$recommendedId'
      preLoaderRoute: typeof DashboardRecommendationsRecommendedIdRouteImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/boards/$boardId': {
      id: '/dashboard/boards/$boardId'
      path: '/boards/$boardId'
      fullPath: '/dashboard/boards/$boardId'
      preLoaderRoute: typeof DashboardBoardsBoardIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/candidate/$recommendedId': {
      id: '/dashboard/candidate/$recommendedId'
      path: '/candidate/$recommendedId'
      fullPath: '/dashboard/candidate/$recommendedId'
      preLoaderRoute: typeof DashboardCandidateRecommendedIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/deals/$dealId': {
      id: '/dashboard/deals/$dealId'
      path: '/deals/$dealId'
      fullPath: '/dashboard/deals/$dealId'
      preLoaderRoute: typeof DashboardDealsDealIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/lots/$lotId': {
      id: '/dashboard/lots/$lotId'
      path: '/lots/$lotId'
      fullPath: '/dashboard/lots/$lotId'
      preLoaderRoute: typeof DashboardLotsLotIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/tasks/$taskId': {
      id: '/dashboard/tasks/$taskId'
      path: '/tasks/$taskId'
      fullPath: '/dashboard/tasks/$taskId'
      preLoaderRoute: typeof DashboardTasksTaskIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/analytics/': {
      id: '/dashboard/analytics/'
      path: '/analytics'
      fullPath: '/dashboard/analytics'
      preLoaderRoute: typeof DashboardAnalyticsIndexImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/boards/': {
      id: '/dashboard/boards/'
      path: '/boards'
      fullPath: '/dashboard/boards'
      preLoaderRoute: typeof DashboardBoardsIndexImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/lots/': {
      id: '/dashboard/lots/'
      path: '/lots'
      fullPath: '/dashboard/lots'
      preLoaderRoute: typeof DashboardLotsIndexImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/schedules/': {
      id: '/dashboard/schedules/'
      path: '/schedules'
      fullPath: '/dashboard/schedules'
      preLoaderRoute: typeof DashboardSchedulesIndexImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/tasks/': {
      id: '/dashboard/tasks/'
      path: '/tasks'
      fullPath: '/dashboard/tasks'
      preLoaderRoute: typeof DashboardTasksIndexImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/analytics/ktru/$id': {
      id: '/dashboard/analytics/ktru/$id'
      path: '/analytics/ktru/$id'
      fullPath: '/dashboard/analytics/ktru/$id'
      preLoaderRoute: typeof DashboardAnalyticsKtruIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/recommendations/$recommendedId/$lotId': {
      id: '/dashboard/recommendations/$recommendedId/$lotId'
      path: '/$lotId'
      fullPath: '/dashboard/recommendations/$recommendedId/$lotId'
      preLoaderRoute: typeof DashboardRecommendationsRecommendedIdLotIdImport
      parentRoute: typeof DashboardRecommendationsRecommendedIdRouteImport
    }
    '/dashboard/schedules/results/$resultId': {
      id: '/dashboard/schedules/results/$resultId'
      path: '/schedules/results/$resultId'
      fullPath: '/dashboard/schedules/results/$resultId'
      preLoaderRoute: typeof DashboardSchedulesResultsResultIdImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/analytics/agent/': {
      id: '/dashboard/analytics/agent/'
      path: '/analytics/agent'
      fullPath: '/dashboard/analytics/agent'
      preLoaderRoute: typeof DashboardAnalyticsAgentIndexImport
      parentRoute: typeof DashboardRouteImport
    }
  }
}

// Create and export the route tree

interface DashboardRecommendationsRecommendedIdRouteRouteChildren {
  DashboardRecommendationsRecommendedIdLotIdRoute: typeof DashboardRecommendationsRecommendedIdLotIdRoute
}

const DashboardRecommendationsRecommendedIdRouteRouteChildren: DashboardRecommendationsRecommendedIdRouteRouteChildren =
  {
    DashboardRecommendationsRecommendedIdLotIdRoute:
      DashboardRecommendationsRecommendedIdLotIdRoute,
  }

const DashboardRecommendationsRecommendedIdRouteRouteWithChildren =
  DashboardRecommendationsRecommendedIdRouteRoute._addFileChildren(
    DashboardRecommendationsRecommendedIdRouteRouteChildren,
  )

interface DashboardRouteRouteChildren {
  DashboardIndexLazyRoute: typeof DashboardIndexLazyRoute
  DashboardRecommendationsRecommendedIdRouteRoute: typeof DashboardRecommendationsRecommendedIdRouteRouteWithChildren
  DashboardBoardsBoardIdRoute: typeof DashboardBoardsBoardIdRoute
  DashboardCandidateRecommendedIdRoute: typeof DashboardCandidateRecommendedIdRoute
  DashboardDealsDealIdRoute: typeof DashboardDealsDealIdRoute
  DashboardLotsLotIdRoute: typeof DashboardLotsLotIdRoute
  DashboardTasksTaskIdRoute: typeof DashboardTasksTaskIdRoute
  DashboardAnalyticsIndexRoute: typeof DashboardAnalyticsIndexRoute
  DashboardBoardsIndexRoute: typeof DashboardBoardsIndexRoute
  DashboardLotsIndexRoute: typeof DashboardLotsIndexRoute
  DashboardSchedulesIndexRoute: typeof DashboardSchedulesIndexRoute
  DashboardTasksIndexRoute: typeof DashboardTasksIndexRoute
  DashboardAnalyticsKtruIdRoute: typeof DashboardAnalyticsKtruIdRoute
  DashboardSchedulesResultsResultIdRoute: typeof DashboardSchedulesResultsResultIdRoute
  DashboardAnalyticsAgentIndexRoute: typeof DashboardAnalyticsAgentIndexRoute
}

const DashboardRouteRouteChildren: DashboardRouteRouteChildren = {
  DashboardIndexLazyRoute: DashboardIndexLazyRoute,
  DashboardRecommendationsRecommendedIdRouteRoute:
    DashboardRecommendationsRecommendedIdRouteRouteWithChildren,
  DashboardBoardsBoardIdRoute: DashboardBoardsBoardIdRoute,
  DashboardCandidateRecommendedIdRoute: DashboardCandidateRecommendedIdRoute,
  DashboardDealsDealIdRoute: DashboardDealsDealIdRoute,
  DashboardLotsLotIdRoute: DashboardLotsLotIdRoute,
  DashboardTasksTaskIdRoute: DashboardTasksTaskIdRoute,
  DashboardAnalyticsIndexRoute: DashboardAnalyticsIndexRoute,
  DashboardBoardsIndexRoute: DashboardBoardsIndexRoute,
  DashboardLotsIndexRoute: DashboardLotsIndexRoute,
  DashboardSchedulesIndexRoute: DashboardSchedulesIndexRoute,
  DashboardTasksIndexRoute: DashboardTasksIndexRoute,
  DashboardAnalyticsKtruIdRoute: DashboardAnalyticsKtruIdRoute,
  DashboardSchedulesResultsResultIdRoute:
    DashboardSchedulesResultsResultIdRoute,
  DashboardAnalyticsAgentIndexRoute: DashboardAnalyticsAgentIndexRoute,
}

const DashboardRouteRouteWithChildren = DashboardRouteRoute._addFileChildren(
  DashboardRouteRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/dashboard': typeof DashboardRouteRouteWithChildren
  '/login': typeof LoginRoute
  '/onboarding': typeof OnboardingRoute
  '/test': typeof TestRoute
  '/verifyOtp': typeof VerifyOtpRoute
  '/about': typeof AboutLazyRoute
  '/kanban': typeof KanbanLazyRoute
  '/dashboard/': typeof DashboardIndexLazyRoute
  '/dashboard/recommendations/$recommendedId': typeof DashboardRecommendationsRecommendedIdRouteRouteWithChildren
  '/dashboard/boards/$boardId': typeof DashboardBoardsBoardIdRoute
  '/dashboard/candidate/$recommendedId': typeof DashboardCandidateRecommendedIdRoute
  '/dashboard/deals/$dealId': typeof DashboardDealsDealIdRoute
  '/dashboard/lots/$lotId': typeof DashboardLotsLotIdRoute
  '/dashboard/tasks/$taskId': typeof DashboardTasksTaskIdRoute
  '/dashboard/analytics': typeof DashboardAnalyticsIndexRoute
  '/dashboard/boards': typeof DashboardBoardsIndexRoute
  '/dashboard/lots': typeof DashboardLotsIndexRoute
  '/dashboard/schedules': typeof DashboardSchedulesIndexRoute
  '/dashboard/tasks': typeof DashboardTasksIndexRoute
  '/dashboard/analytics/ktru/$id': typeof DashboardAnalyticsKtruIdRoute
  '/dashboard/recommendations/$recommendedId/$lotId': typeof DashboardRecommendationsRecommendedIdLotIdRoute
  '/dashboard/schedules/results/$resultId': typeof DashboardSchedulesResultsResultIdRoute
  '/dashboard/analytics/agent': typeof DashboardAnalyticsAgentIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/login': typeof LoginRoute
  '/onboarding': typeof OnboardingRoute
  '/test': typeof TestRoute
  '/verifyOtp': typeof VerifyOtpRoute
  '/about': typeof AboutLazyRoute
  '/kanban': typeof KanbanLazyRoute
  '/dashboard': typeof DashboardIndexLazyRoute
  '/dashboard/recommendations/$recommendedId': typeof DashboardRecommendationsRecommendedIdRouteRouteWithChildren
  '/dashboard/boards/$boardId': typeof DashboardBoardsBoardIdRoute
  '/dashboard/candidate/$recommendedId': typeof DashboardCandidateRecommendedIdRoute
  '/dashboard/deals/$dealId': typeof DashboardDealsDealIdRoute
  '/dashboard/lots/$lotId': typeof DashboardLotsLotIdRoute
  '/dashboard/tasks/$taskId': typeof DashboardTasksTaskIdRoute
  '/dashboard/analytics': typeof DashboardAnalyticsIndexRoute
  '/dashboard/boards': typeof DashboardBoardsIndexRoute
  '/dashboard/lots': typeof DashboardLotsIndexRoute
  '/dashboard/schedules': typeof DashboardSchedulesIndexRoute
  '/dashboard/tasks': typeof DashboardTasksIndexRoute
  '/dashboard/analytics/ktru/$id': typeof DashboardAnalyticsKtruIdRoute
  '/dashboard/recommendations/$recommendedId/$lotId': typeof DashboardRecommendationsRecommendedIdLotIdRoute
  '/dashboard/schedules/results/$resultId': typeof DashboardSchedulesResultsResultIdRoute
  '/dashboard/analytics/agent': typeof DashboardAnalyticsAgentIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/dashboard': typeof DashboardRouteRouteWithChildren
  '/login': typeof LoginRoute
  '/onboarding': typeof OnboardingRoute
  '/test': typeof TestRoute
  '/verifyOtp': typeof VerifyOtpRoute
  '/about': typeof AboutLazyRoute
  '/kanban': typeof KanbanLazyRoute
  '/dashboard/': typeof DashboardIndexLazyRoute
  '/dashboard/recommendations/$recommendedId': typeof DashboardRecommendationsRecommendedIdRouteRouteWithChildren
  '/dashboard/boards/$boardId': typeof DashboardBoardsBoardIdRoute
  '/dashboard/candidate/$recommendedId': typeof DashboardCandidateRecommendedIdRoute
  '/dashboard/deals/$dealId': typeof DashboardDealsDealIdRoute
  '/dashboard/lots/$lotId': typeof DashboardLotsLotIdRoute
  '/dashboard/tasks/$taskId': typeof DashboardTasksTaskIdRoute
  '/dashboard/analytics/': typeof DashboardAnalyticsIndexRoute
  '/dashboard/boards/': typeof DashboardBoardsIndexRoute
  '/dashboard/lots/': typeof DashboardLotsIndexRoute
  '/dashboard/schedules/': typeof DashboardSchedulesIndexRoute
  '/dashboard/tasks/': typeof DashboardTasksIndexRoute
  '/dashboard/analytics/ktru/$id': typeof DashboardAnalyticsKtruIdRoute
  '/dashboard/recommendations/$recommendedId/$lotId': typeof DashboardRecommendationsRecommendedIdLotIdRoute
  '/dashboard/schedules/results/$resultId': typeof DashboardSchedulesResultsResultIdRoute
  '/dashboard/analytics/agent/': typeof DashboardAnalyticsAgentIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/dashboard'
    | '/login'
    | '/onboarding'
    | '/test'
    | '/verifyOtp'
    | '/about'
    | '/kanban'
    | '/dashboard/'
    | '/dashboard/recommendations/$recommendedId'
    | '/dashboard/boards/$boardId'
    | '/dashboard/candidate/$recommendedId'
    | '/dashboard/deals/$dealId'
    | '/dashboard/lots/$lotId'
    | '/dashboard/tasks/$taskId'
    | '/dashboard/analytics'
    | '/dashboard/boards'
    | '/dashboard/lots'
    | '/dashboard/schedules'
    | '/dashboard/tasks'
    | '/dashboard/analytics/ktru/$id'
    | '/dashboard/recommendations/$recommendedId/$lotId'
    | '/dashboard/schedules/results/$resultId'
    | '/dashboard/analytics/agent'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/login'
    | '/onboarding'
    | '/test'
    | '/verifyOtp'
    | '/about'
    | '/kanban'
    | '/dashboard'
    | '/dashboard/recommendations/$recommendedId'
    | '/dashboard/boards/$boardId'
    | '/dashboard/candidate/$recommendedId'
    | '/dashboard/deals/$dealId'
    | '/dashboard/lots/$lotId'
    | '/dashboard/tasks/$taskId'
    | '/dashboard/analytics'
    | '/dashboard/boards'
    | '/dashboard/lots'
    | '/dashboard/schedules'
    | '/dashboard/tasks'
    | '/dashboard/analytics/ktru/$id'
    | '/dashboard/recommendations/$recommendedId/$lotId'
    | '/dashboard/schedules/results/$resultId'
    | '/dashboard/analytics/agent'
  id:
    | '__root__'
    | '/'
    | '/dashboard'
    | '/login'
    | '/onboarding'
    | '/test'
    | '/verifyOtp'
    | '/about'
    | '/kanban'
    | '/dashboard/'
    | '/dashboard/recommendations/$recommendedId'
    | '/dashboard/boards/$boardId'
    | '/dashboard/candidate/$recommendedId'
    | '/dashboard/deals/$dealId'
    | '/dashboard/lots/$lotId'
    | '/dashboard/tasks/$taskId'
    | '/dashboard/analytics/'
    | '/dashboard/boards/'
    | '/dashboard/lots/'
    | '/dashboard/schedules/'
    | '/dashboard/tasks/'
    | '/dashboard/analytics/ktru/$id'
    | '/dashboard/recommendations/$recommendedId/$lotId'
    | '/dashboard/schedules/results/$resultId'
    | '/dashboard/analytics/agent/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  DashboardRouteRoute: typeof DashboardRouteRouteWithChildren
  LoginRoute: typeof LoginRoute
  OnboardingRoute: typeof OnboardingRoute
  TestRoute: typeof TestRoute
  VerifyOtpRoute: typeof VerifyOtpRoute
  AboutLazyRoute: typeof AboutLazyRoute
  KanbanLazyRoute: typeof KanbanLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  DashboardRouteRoute: DashboardRouteRouteWithChildren,
  LoginRoute: LoginRoute,
  OnboardingRoute: OnboardingRoute,
  TestRoute: TestRoute,
  VerifyOtpRoute: VerifyOtpRoute,
  AboutLazyRoute: AboutLazyRoute,
  KanbanLazyRoute: KanbanLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/dashboard",
        "/login",
        "/onboarding",
        "/test",
        "/verifyOtp",
        "/about",
        "/kanban"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/dashboard": {
      "filePath": "dashboard/route.tsx",
      "children": [
        "/dashboard/",
        "/dashboard/recommendations/$recommendedId",
        "/dashboard/boards/$boardId",
        "/dashboard/candidate/$recommendedId",
        "/dashboard/deals/$dealId",
        "/dashboard/lots/$lotId",
        "/dashboard/tasks/$taskId",
        "/dashboard/analytics/",
        "/dashboard/boards/",
        "/dashboard/lots/",
        "/dashboard/schedules/",
        "/dashboard/tasks/",
        "/dashboard/analytics/ktru/$id",
        "/dashboard/schedules/results/$resultId",
        "/dashboard/analytics/agent/"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/onboarding": {
      "filePath": "onboarding.tsx"
    },
    "/test": {
      "filePath": "test.tsx"
    },
    "/verifyOtp": {
      "filePath": "verifyOtp.tsx"
    },
    "/about": {
      "filePath": "about.lazy.tsx"
    },
    "/kanban": {
      "filePath": "kanban.lazy.tsx"
    },
    "/dashboard/": {
      "filePath": "dashboard/index.lazy.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/recommendations/$recommendedId": {
      "filePath": "dashboard/recommendations/$recommendedId/route.tsx",
      "parent": "/dashboard",
      "children": [
        "/dashboard/recommendations/$recommendedId/$lotId"
      ]
    },
    "/dashboard/boards/$boardId": {
      "filePath": "dashboard/boards/$boardId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/candidate/$recommendedId": {
      "filePath": "dashboard/candidate/$recommendedId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/deals/$dealId": {
      "filePath": "dashboard/deals/$dealId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/lots/$lotId": {
      "filePath": "dashboard/lots/$lotId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/tasks/$taskId": {
      "filePath": "dashboard/tasks/$taskId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/analytics/": {
      "filePath": "dashboard/analytics/index.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/boards/": {
      "filePath": "dashboard/boards/index.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/lots/": {
      "filePath": "dashboard/lots/index.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/schedules/": {
      "filePath": "dashboard/schedules/index.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/tasks/": {
      "filePath": "dashboard/tasks/index.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/analytics/ktru/$id": {
      "filePath": "dashboard/analytics/ktru/$id.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/recommendations/$recommendedId/$lotId": {
      "filePath": "dashboard/recommendations/$recommendedId/$lotId.tsx",
      "parent": "/dashboard/recommendations/$recommendedId"
    },
    "/dashboard/schedules/results/$resultId": {
      "filePath": "dashboard/schedules/results/$resultId.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/analytics/agent/": {
      "filePath": "dashboard/analytics/agent/index.tsx",
      "parent": "/dashboard"
    }
  }
}
ROUTE_MANIFEST_END */
