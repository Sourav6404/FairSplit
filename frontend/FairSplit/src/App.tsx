import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider";
import { AppLayout } from "./components/layout/AppLayout";

import { Onboarding } from "./pages/Onboarding";
import { FeatureIntro } from "./pages/FeatureIntro";
import { Auth } from "./pages/Auth";

import { Dashboard } from "./pages/Dashboard";
import { Groups } from "./pages/Groups";
import { GroupDetails } from "./pages/GroupDetails";
import { AddExpense } from "./pages/AddExpense";
import { Summary } from "./pages/Summary";
import { Notifications } from "./pages/Notifications";
import { ImportFlow } from "./pages/ImportFlow";
import { Expenses } from "./pages/Expenses";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="fairsplit-theme">
      <Router>
        <Routes>
          {/* Public Routes without Layout */}
          <Route path="/" element={<Onboarding />} />
          <Route path="/intro" element={<FeatureIntro />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes with Layout (assuming protected for now) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupDetails />} />
            <Route path="/groups/:id/add-expense" element={<AddExpense />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/import/*" element={<ImportFlow />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
