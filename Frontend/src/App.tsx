import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";

import Workforce from "./pages/Workforce";

import AddEmployee from "./pages/AddEmployee";

import EditEmployee from "./pages/EditEmployee";

import EmployeeProfile from "./pages/EmployeeProfile";

import Company from "./pages/Company";

import AddCompany from "./pages/AddCompany";

import EditCompany from "./pages/EditCompany";

import Branches from "./pages/Branches";

import AddBranch from "./pages/AddBranch";

import EditBranch from "./pages/EditBranch";

import Department from "./pages/Department";

import AddDepartment from "./pages/AddDepartment";

import EditDepartment from "./pages/EditDepartment";

import Notifications from "./pages/Notifications";

function App() {
  return (
    <Routes>

      {/* =====================================================
          ROOT
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* =====================================================
          WORKFORCE
      ===================================================== */}

      <Route
        path="/workforce"
        element={<Workforce />}
      />

      <Route
        path="/workforce/employees/new"
        element={<AddEmployee />}
      />

      <Route
        path="/workforce/employees/:id/edit"
        element={<EditEmployee />}
      />

      <Route
        path="/workforce/employees/:id"
        element={<EmployeeProfile />}
      />

      {/* =====================================================
          COMPANY
      ===================================================== */}

      <Route
        path="/organization/company"
        element={<Company />}
      />

      <Route
        path="/organization/company/new"
        element={<AddCompany />}
      />

      <Route
        path="/organization/company/edit/:id"
        element={<EditCompany />}
      />

      {/* =====================================================
          BRANCH
      ===================================================== */}

      <Route
        path="/organization/branches"
        element={<Branches />}
      />

      <Route
        path="/organization/branches/new"
        element={<AddBranch />}
      />

      <Route
        path="/organization/branches/edit/:id"
        element={<EditBranch />}
      />

      {/* =====================================================
          DEPARTMENT
      ===================================================== */}

      <Route
        path="/organization/departments"
        element={<Department />}
      />

      <Route
        path="/organization/departments/new"
        element={<AddDepartment />}
      />

      <Route
        path="/organization/departments/edit/:id"
        element={<EditDepartment />}
      />

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Route
        path="/notifications"
        element={<Notifications />}
      />

    </Routes>
  );
}

export default App;