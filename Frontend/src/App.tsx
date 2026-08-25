import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Workforce from "./pages/Workforce";
import AddEmployee from "./pages/AddEmployee";
import EmployeeProfile from "./pages/EmployeeProfile";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/workforce"
        element={<Workforce />}
      />

      <Route
        path="/workforce/employees/new"
        element={<AddEmployee />}
      />

      <Route
        path="/workforce/employees/:id"
        element={
          <EmployeeProfile />
        }
      />
    </Routes>
  );
}

export default App;
