import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

router.get("/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM employees
          WHERE employment_status = 'ACTIVE'
        ) AS total_employees,

        (
          SELECT COUNT(*)
          FROM employees
          WHERE employment_status = 'ACTIVE'
          AND joining_date >= DATE_TRUNC('month', CURRENT_DATE)
          AND joining_date < DATE_TRUNC('month', CURRENT_DATE)
            + INTERVAL '1 month'
        ) AS new_joiners,

        (
          SELECT COUNT(*)
          FROM job_positions
          WHERE status = 'OPEN'
        ) AS open_positions,

        (
          SELECT COUNT(*)
          FROM leave_requests
          WHERE status = 'PENDING'
        ) AS pending_leave;
    `);

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        totalEmployees: Number(row.total_employees),
        newJoiners: Number(row.new_joiners),
        openPositions: Number(row.open_positions),
        pendingLeave: Number(row.pending_leave),
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
    });
  }
});

/* =========================================================
   HEADCOUNT GROWTH
========================================================= */

router.get("/headcount", async (req, res) => {
  try {
    const query = `
      WITH months AS (
        SELECT
          generate_series(
            DATE '2026-01-01',
            DATE '2026-12-01',
            INTERVAL '1 month'
          ) AS month_start
      )

      SELECT
        TO_CHAR(m.month_start, 'Mon') AS month,
        COUNT(e.id) AS total

      FROM months m

      LEFT JOIN employees e
        ON e.joining_date <= (
          m.month_start
          + INTERVAL '1 month'
          - INTERVAL '1 day'
        )
        AND e.employment_status = 'ACTIVE'

      GROUP BY m.month_start
      ORDER BY m.month_start;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        month: row.month,
        total: Number(row.total),
      })),
    });
  } catch (error) {
    console.error("Headcount error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load headcount data",
    });
  }
});

/* =========================================================
   DEPARTMENT DISTRIBUTION
========================================================= */

router.get("/departments", async (req, res) => {
  try {
    const query = `
      SELECT
        d.id,
        d.name,
        COUNT(e.id) AS employee_count

      FROM departments d

      LEFT JOIN employees e
        ON e.department_id = d.id
        AND e.employment_status = 'ACTIVE'

      GROUP BY d.id, d.name
      ORDER BY d.id;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        value: Number(row.employee_count),
      })),
    });
  } catch (error) {
    console.error("Department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load department data",
    });
  }
});

/* =========================================================
   ATTENDANCE
========================================================= */

router.get("/attendance", async (req, res) => {
  try {
    const query = `
      SELECT
        attendance_date AS date,

        COUNT(*) AS total,

        COUNT(*) FILTER (
          WHERE status = 'PRESENT'
        ) AS present,

        COUNT(*) FILTER (
          WHERE status = 'ABSENT'
        ) AS absent,

        COUNT(*) FILTER (
          WHERE status = 'PRESENT'
          AND check_in <= TIME '09:15'
        ) AS on_time,

        COUNT(*) FILTER (
          WHERE status = 'PRESENT'
          AND check_in > TIME '09:15'
        ) AS late

      FROM attendance_records

      WHERE attendance_date = (
        SELECT MAX(attendance_date)
        FROM attendance_records
      )

      GROUP BY attendance_date;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          date: null,
          attendanceRate: 0,
          total: 0,
          present: 0,
          absent: 0,
          onTime: 0,
          late: 0,
        },
      });
    }

    const row = result.rows[0];

    const total = Number(row.total);
    const present = Number(row.present);

    const attendanceRate =
      total > 0
        ? Math.round((present / total) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        date: row.date,
        attendanceRate,
        total,
        present,
        absent: Number(row.absent),
        onTime: Number(row.on_time),
        late: Number(row.late),
      },
    });
  } catch (error) {
    console.error("Attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load attendance data",
    });
  }
});

/* =========================================================
   RECENT HR ACTIVITY
   ONLY 6 ACTIVITIES
========================================================= */

router.get("/activity", async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM (

        /* -----------------------------------------------
           NEW EMPLOYEE
        ----------------------------------------------- */

        SELECT
          'EMPLOYEE' AS activity_type,

          'New employee joined' AS title,

          CONCAT(
            e.first_name,
            ' ',
            e.last_name,
            ' joined the organization'
          ) AS description,

          e.joining_date::timestamp AS activity_time

        FROM employees e


        UNION ALL


        /* -----------------------------------------------
           LEAVE REQUEST
        ----------------------------------------------- */

        SELECT
          'LEAVE' AS activity_type,

          'Leave request submitted' AS title,

          CONCAT(
            e.first_name,
            ' ',
            e.last_name,
            ' requested ',
            lr.leave_type,
            ' leave'
          ) AS description,

          lr.created_at AS activity_time

        FROM leave_requests lr

        JOIN employees e
          ON e.id = lr.employee_id


        UNION ALL


        /* -----------------------------------------------
           CANDIDATE
        ----------------------------------------------- */

        SELECT
          'CANDIDATE' AS activity_type,

          'Candidate added' AS title,

          CONCAT(
            c.name,
            ' entered the recruitment pipeline'
          ) AS description,

          c.created_at AS activity_time

        FROM candidates c


        UNION ALL


        /* -----------------------------------------------
           PAYROLL
        ----------------------------------------------- */

        SELECT
          'PAYROLL' AS activity_type,

          'Payroll processing started' AS title,

          CONCAT(
            'Payroll for ',
            TO_CHAR(pr.payroll_month, 'Month YYYY'),
            ' is ',
            LOWER(pr.status)
          ) AS description,

          pr.created_at AS activity_time

        FROM payroll_runs pr

      ) AS activities

      ORDER BY activity_time DESC

      LIMIT 6;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        activityType: row.activity_type,
        title: row.title,
        description: row.description,
        activityTime: row.activity_time,
      })),
    });
  } catch (error) {
    console.error("Activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load recent activity",
    });
  }
});

/* =========================================================
   QUICK INSIGHTS + UPCOMING ACTIONS
========================================================= */

router.get("/insights", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT

        /* -----------------------------------------------
           RECRUITMENT
        ----------------------------------------------- */

        (
          SELECT COUNT(*)
          FROM candidates
        ) AS candidate_count,


        /* -----------------------------------------------
           OPEN POSITIONS
        ----------------------------------------------- */

        (
          SELECT COUNT(*)
          FROM job_positions
          WHERE status = 'OPEN'
        ) AS open_position_count,


        /* -----------------------------------------------
           TOTAL OPENINGS
        ----------------------------------------------- */

        (
          SELECT COALESCE(SUM(openings), 0)
          FROM job_positions
          WHERE status = 'OPEN'
        ) AS total_openings,


        /* -----------------------------------------------
           PENDING LEAVE
        ----------------------------------------------- */

        (
          SELECT COUNT(*)
          FROM leave_requests
          WHERE status = 'PENDING'
        ) AS pending_leave_count,


        /* -----------------------------------------------
           PAYROLL APPROVALS
        ----------------------------------------------- */

        (
          SELECT COALESCE(SUM(pending_approvals), 0)
          FROM payroll_runs
          WHERE status IN ('PROCESSING', 'PENDING')
        ) AS pending_payroll_approvals,


        /* -----------------------------------------------
           ACTIVE EMPLOYEES
        ----------------------------------------------- */

        (
          SELECT COUNT(*)
          FROM employees
          WHERE employment_status = 'ACTIVE'
        ) AS active_employee_count,


        /* -----------------------------------------------
           ATTENDANCE EXCEPTIONS
           
           An exception is:
           1. ABSENT employee
           OR
           2. PRESENT employee who checked in after 09:15
        ----------------------------------------------- */

        (
          SELECT COUNT(*)
          FROM attendance_records
          WHERE attendance_date = (
            SELECT MAX(attendance_date)
            FROM attendance_records
          )
          AND (
            status = 'ABSENT'
            OR (
              status = 'PRESENT'
              AND check_in > TIME '09:15'
            )
          )
        ) AS attendance_exception_count;
    `);

    const row = result.rows[0];

    const candidateCount =
      Number(row.candidate_count);

    const openPositionCount =
      Number(row.open_position_count);

    const totalOpenings =
      Number(row.total_openings);

    const pendingLeaveCount =
      Number(row.pending_leave_count);

    const pendingPayrollApprovals =
      Number(row.pending_payroll_approvals);

    const activeEmployeeCount =
      Number(row.active_employee_count);

    const attendanceExceptionCount =
      Number(row.attendance_exception_count);

    res.json({
      success: true,

      data: {
        /* =================================================
           QUICK INSIGHTS
        ================================================= */

        insights: [
          {
            title: "Recruitment pipeline",

            value: `${candidateCount} candidates in pipeline`,

            detail: `${openPositionCount} open positions currently available`,
          },

          {
            title: "Workforce overview",

            value: `${activeEmployeeCount} active employees`,

            detail: `${totalOpenings} openings across current job positions`,
          },

          {
            title: "Payroll readiness",

            value: `${pendingPayrollApprovals} approvals pending`,

            detail:
              "Pending payroll approvals requiring attention",
          },
        ],

        /* =================================================
           UPCOMING ACTIONS
           
           ALL 5 ARE NOW DATABASE-BACKED
        ================================================= */

        actions: [
          {
            title:
              "Approve pending leave requests",

            count:
              pendingLeaveCount,

            description:
              `${pendingLeaveCount} pending leave request${
                pendingLeaveCount === 1
                  ? ""
                  : "s"
              }`,
          },

          {
            title:
              "Review recruitment pipeline",

            count:
              candidateCount,

            description:
              `${candidateCount} candidate${
                candidateCount === 1
                  ? ""
                  : "s"
              } currently in the pipeline`,
          },

          {
            title:
              "Review payroll approvals",

            count:
              pendingPayrollApprovals,

            description:
              `${pendingPayrollApprovals} payroll approval${
                pendingPayrollApprovals === 1
                  ? ""
                  : "s"
              } pending`,
          },

          {
            title:
              "Review open positions",

            count:
              totalOpenings,

            description:
              `${totalOpenings} opening${
                totalOpenings === 1
                  ? ""
                  : "s"
              } across ${openPositionCount} position${
                openPositionCount === 1
                  ? ""
                  : "s"
              }`,
          },

          {
            title:
              "Review attendance exceptions",

            count:
              attendanceExceptionCount,

            description:
              `${attendanceExceptionCount} attendance exception${
                attendanceExceptionCount === 1
                  ? ""
                  : "s"
              } need attention`,
          },
        ],
      },
    });
  } catch (error) {
    console.error(
      "Dashboard insights error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard insights",
    });
  }
});

/* =========================================================
   EXPORT
========================================================= */

export default router;