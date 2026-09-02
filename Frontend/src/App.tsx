import { Navigate, Route, Routes } from "react-router-dom";

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

import BranchProfile from "./pages/BranchProfile";

import Department from "./pages/Department";

import AddDepartment from "./pages/AddDepartment";

import EditDepartment from "./pages/EditDepartment";

import DepartmentProfile from "./pages/DepartmentProfile";

import Notifications from "./pages/Notifications";

import Recruitment from "./pages/Recruitment";

import JobPositions from "./pages/JobPositions";

import JobPositionDetails from "./pages/JobPositionDetails";

import Candidates from "./pages/Candidates";

import CandidateProfile from "./pages/CandidateProfile";

import {
  AddCandidate,
  AddJobPosition,
  EditCandidate,
  EditJobPosition,
} from "./pages/RecruitmentForms";

import Clients from "./pages/Clients";

import AddClient from "./pages/AddClient";

import EditClient from "./pages/EditClient";

import ClientProfile from "./pages/ClientProfile";

import Onboarding from "./pages/Onboarding";

import AddOnboarding from "./pages/AddOnboarding";

import EditOnboarding from "./pages/EditOnboarding";

import OnboardingProfile from "./pages/OnboardingProfile";

import Payroll from "./pages/Payroll";

import AddPayroll from "./pages/AddPayroll";

import EditPayroll from "./pages/EditPayroll";

import PayrollDetails from "./pages/PayrollDetails";

import Performance from "./pages/Performance";

import AddPerformance from "./pages/AddPerformance";

import EditPerformance from "./pages/EditPerformance";

import PerformanceDetails from "./pages/PerformanceDetails";

import Training from "./pages/Training";

import AddTraining from "./pages/AddTraining";

import EditTraining from "./pages/EditTraining";

import TrainingDetails from "./pages/TrainingDetails";

import Reports from "./pages/Reports";

import Exits from "./pages/Exits";

import AddExit from "./pages/AddExit";

import EditExit from "./pages/EditExit";

import ExitDetails from "./pages/ExitDetails";

/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

import Settings from "./pages/Settings";

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

      <Route
        path="/organization/branches/:id"
        element={<BranchProfile />}
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

      <Route
        path="/organization/departments/:id"
        element={<DepartmentProfile />}
      />

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Route
        path="/notifications"
        element={<Notifications />}
      />

      {/* =====================================================
          SETTINGS
      ===================================================== */}

      <Route
        path="/settings"
        element={<Settings />}
      />

      {/* =====================================================
          ONBOARDING
      ===================================================== */}

      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      <Route
        path="/onboarding/new"
        element={<AddOnboarding />}
      />

      <Route
        path="/onboarding/edit/:id"
        element={<EditOnboarding />}
      />

      <Route
        path="/onboarding/:id"
        element={<OnboardingProfile />}
      />

      {/* =====================================================
          PAYROLL
      ===================================================== */}

      <Route
        path="/payroll"
        element={<Payroll />}
      />

      <Route
        path="/payroll/new"
        element={<AddPayroll />}
      />

      <Route
        path="/payroll/edit/:id"
        element={<EditPayroll />}
      />

      <Route
        path="/payroll/:id"
        element={<PayrollDetails />}
      />

      {/* =====================================================
          PERFORMANCE
      ===================================================== */}

      <Route
        path="/performance"
        element={<Performance />}
      />

      <Route
        path="/performance/new"
        element={<AddPerformance />}
      />

      <Route
        path="/performance/edit/:id"
        element={<EditPerformance />}
      />

      <Route
        path="/performance/:id"
        element={<PerformanceDetails />}
      />

      {/* =====================================================
          TRAINING
      ===================================================== */}

      <Route
        path="/training"
        element={<Training />}
      />

      <Route
        path="/training/new"
        element={<AddTraining />}
      />

      <Route
        path="/training/edit/:id"
        element={<EditTraining />}
      />

      <Route
        path="/training/:id"
        element={<TrainingDetails />}
      />

      {/* =====================================================
          REPORTS
      ===================================================== */}

      <Route
        path="/reports"
        element={<Reports />}
      />

      {/* =====================================================
          EXITS
      ===================================================== */}

      <Route
        path="/exits"
        element={<Exits />}
      />

      <Route
        path="/exits/new"
        element={<AddExit />}
      />

      <Route
        path="/exits/edit/:id"
        element={<EditExit />}
      />

      <Route
        path="/exits/:id"
        element={<ExitDetails />}
      />

      {/* =====================================================
          CLIENTS
      ===================================================== */}

      <Route
        path="/clients"
        element={<Clients />}
      />

      <Route
        path="/clients/new"
        element={<AddClient />}
      />

      <Route
        path="/clients/edit/:id"
        element={<EditClient />}
      />

      <Route
        path="/clients/:id"
        element={<ClientProfile />}
      />

      {/* =====================================================
          RECRUITMENT
      ===================================================== */}

      <Route
        path="/recruitment"
        element={<Recruitment />}
      />

      <Route
        path="/recruitment/jobs"
        element={<JobPositions />}
      />

      <Route
        path="/recruitment/jobs/new"
        element={<AddJobPosition />}
      />

      <Route
        path="/recruitment/jobs/edit/:id"
        element={<EditJobPosition />}
      />

      <Route
        path="/recruitment/jobs/:id"
        element={<JobPositionDetails />}
      />

      <Route
        path="/recruitment/candidates"
        element={<Candidates />}
      />

      <Route
        path="/recruitment/candidates/new"
        element={<AddCandidate />}
      />

      <Route
        path="/recruitment/candidates/edit/:id"
        element={<EditCandidate />}
      />

      <Route
        path="/recruitment/candidates/:id"
        element={<CandidateProfile />}
      />

    </Routes>
  );
}

export default App;