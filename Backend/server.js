import express from "express";
import cors from "cors";
import "dotenv/config";

import pool from "./db.js";

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

app.use("/api/dashboard", dashboardRoutes);

/*
|--------------------------------------------------------------------------
| Employees / Workforce
|--------------------------------------------------------------------------
*/

app.use("/api/employees", employeeRoutes);

/*
|--------------------------------------------------------------------------
| Company
|--------------------------------------------------------------------------
*/

app.use("/api/companies", companyRoutes);

/*
|--------------------------------------------------------------------------
| Branches
|--------------------------------------------------------------------------
*/

app.use("/api/branches", branchRoutes);

/*
|--------------------------------------------------------------------------
| Departments
|--------------------------------------------------------------------------
*/

app.use("/api/departments", departmentRoutes);

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

app.use("/api/notifications", notificationRoutes);

/*
|--------------------------------------------------------------------------
| Recruitment
|--------------------------------------------------------------------------
*/

app.use("/api/recruitment", recruitmentRoutes);

/*
|--------------------------------------------------------------------------
| Clients
|--------------------------------------------------------------------------
*/

app.use("/api/clients", clientsRoutes);

/*
|--------------------------------------------------------------------------
| Onboarding
|--------------------------------------------------------------------------
*/

app.use("/api/onboarding", onboardingRoutes);

/*
|--------------------------------------------------------------------------
| Payroll
|--------------------------------------------------------------------------
*/

app.use("/api/payroll", payrollRoutes);

/*
|--------------------------------------------------------------------------
| Performance
|--------------------------------------------------------------------------
*/

app.use("/api/performance", performanceRoutes);

/*
|--------------------------------------------------------------------------
| Training
|--------------------------------------------------------------------------
*/

app.use("/api/training", trainingRoutes);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`Aakam HRMS Backend running on http://localhost:${PORT}`);
});
