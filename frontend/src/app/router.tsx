import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AppLayout } from "@/layouts/AppLayout";
import { BookWorkspaceLayout } from "@/layouts/BookWorkspaceLayout";
import { BookWorkspaceOverviewPage } from "@/pages/BookWorkspaceOverviewPage";
import { BackstoriesPage } from "@/pages/BackstoriesPage";
import { BooksPage } from "@/pages/BooksPage";
import { ChaptersPage } from "@/pages/ChaptersPage";
import { CharactersPage } from "@/pages/CharactersPage";
import { EconomyPage } from "@/pages/EconomyPage";
import { ForeshadowsPage } from "@/pages/ForeshadowsPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { OutlinesPage } from "@/pages/OutlinesPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TimelinePage } from "@/pages/TimelinePage";
import { WorldMapsPage } from "@/pages/WorldMapsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "books", element: <BooksPage /> },
      {
        path: "books/:bookId",
        element: <BookWorkspaceLayout />,
        children: [
          { index: true, element: <BookWorkspaceOverviewPage /> },
          { path: "backstories", element: <BackstoriesPage /> },
          { path: "maps", element: <WorldMapsPage /> },
          { path: "timeline", element: <TimelinePage /> },
          { path: "economy", element: <EconomyPage /> },
          { path: "outlines", element: <OutlinesPage /> },
          { path: "characters", element: <CharactersPage /> },
          { path: "foreshadows", element: <ForeshadowsPage /> },
          { path: "chapters", element: <ChaptersPage /> }
        ]
      },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);
