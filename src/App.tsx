import { Navigate, Route, Routes } from "react-router-dom";
import { Layout, ProfileGate } from "./components/Layout";
import { LandingPage, LobbyPage, WelcomePage } from "./pages/EntrancePages";
import { TaskFormPage, TaskListPage } from "./pages/TaskPages";
import { AreaPage, ReservationsPage, SpacesPage } from "./pages/SpacePages";
import {
  ActiveFocusPage,
  AnalyticsPage,
  FocusHistoryPage,
  SipStatsPage,
  StartFocusPage,
} from "./pages/FocusPages";
import { CheckoutPage, MenuPage, OrdersPage } from "./pages/MenuPages";
import {
  StudyDrinkPage,
  StudySizePage,
  StudyLabelPage,
  StudyTaskPage,
} from "./pages/StudyEntryPages";
import { PageNavigation } from "./state/SessionNavigation";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="welcome" element={<WelcomePage />} />
        <Route element={<ProfileGate />}>
          <Route path="study/drink" element={<StudyDrinkPage />} />
          <Route path="study/size" element={<StudySizePage />} />
          <Route path="study/label" element={<StudyLabelPage />} />
          <Route path="study/task" element={<StudyTaskPage />} />
          <Route path="cafe" element={<LobbyPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="spaces/:id" element={<AreaPage />} />
          <Route path="tasks" element={<TaskListPage />} />
          <Route path="tasks/new" element={<TaskFormPage />} />
          <Route path="tasks/:id/edit" element={<TaskFormPage />} />
          <Route path="focus" element={<StartFocusPage />} />
          <Route path="focus/:id" element={<ActiveFocusPage />} />
          <Route path="history" element={<FocusHistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="sip-stats" element={<SipStatsPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="order-summary" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route
            path="orders/:id"
            element={<Navigate to="/orders" replace />}
          />
          <Route path="reservations" element={<ReservationsPage />} />
        </Route>
        <Route
          path="*"
          element={
            <section className="page narrow">
              <PageNavigation to="/cafe" label="Back to Cafe" preferSession />
              <h1>That corner isn’t here.</h1>
              <p>The page may have moved.</p>
            </section>
          }
        />
      </Route>
    </Routes>
  );
}
