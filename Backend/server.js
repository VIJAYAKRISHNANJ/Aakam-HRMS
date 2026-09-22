// Render auto-deploy verification
import express from "express";
import cors from "cors";
import "dotenv/config";

import pool from "./db.js";
import { authenticate, authorizeResource, verifyClientScope, verifyCompanyScope } from "./middleware/auth.middleware.js";

import dashboardRoutes from "./routes/dashboard.routes.js";
import employeeRoutes from "./routes/employees.routes.js";
import companyRoutes from "./routes/company.routes.js";
import branchRoutes from "./routes/branches.routes.js";
import departmentRoutes from "./routes/departments.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import recruitmentRoutes from "./routes/recruitment.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import performanceRoutes from "./routes/performance.routes.js";
import trainingRoutes from "./routes/training.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import exitsRoutes from "./routes/exits.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "Aakam HRMS Backend is running",
      database: "PostgreSQL connected",
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Backend is running, but PostgreSQL is not connected",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

const protectedResource = (path, resource, router) =>
  app.use(path, authenticate, verifyCompanyScope, verifyClientScope, authorizeResource(resource), router);

protectedResource("/api/dashboard", "dashboard", dashboardRoutes);

/*
|--------------------------------------------------------------------------
| Employees / Workforce
|--------------------------------------------------------------------------
*/

protectedResource("/api/employees", "employees", employeeRoutes);

/*
|--------------------------------------------------------------------------
| Company
|--------------------------------------------------------------------------
*/

protectedResource("/api/companies", "company", companyRoutes);

/*
|--------------------------------------------------------------------------
| Branches
|--------------------------------------------------------------------------
*/

protectedResource("/api/branches", "branches", branchRoutes);

/*
|--------------------------------------------------------------------------
| Departments
|--------------------------------------------------------------------------
*/

protectedResource("/api/departments", "departments", departmentRoutes);

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

protectedResource("/api/notifications", "notifications", notificationRoutes);

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
*/

app.use("/api/users", usersRoutes);

/*
|--------------------------------------------------------------------------
| Recruitment
|--------------------------------------------------------------------------
*/

protectedResource("/api/recruitment", "recruitment", recruitmentRoutes);

/*
|--------------------------------------------------------------------------
| Clients
|--------------------------------------------------------------------------
*/

protectedResource("/api/clients", "clients", clientsRoutes);

/*
|--------------------------------------------------------------------------
| Onboarding
|--------------------------------------------------------------------------
*/

protectedResource("/api/onboarding", "onboarding", onboardingRoutes);

/*
|--------------------------------------------------------------------------
| Payroll
|--------------------------------------------------------------------------
*/

protectedResource("/api/payroll", "payroll", payrollRoutes);

/*
|--------------------------------------------------------------------------
| Performance
|--------------------------------------------------------------------------
*/

protectedResource("/api/performance", "performance", performanceRoutes);

/*
|--------------------------------------------------------------------------
| Training
|--------------------------------------------------------------------------
*/

protectedResource("/api/training", "training", trainingRoutes);

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

protectedResource("/api/reports", "reports", reportsRoutes);

/*
|--------------------------------------------------------------------------
| Exit Management
|--------------------------------------------------------------------------
*/

protectedResource("/api/exits", "exits", exitsRoutes);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Aakam HRMS Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

startServer();
