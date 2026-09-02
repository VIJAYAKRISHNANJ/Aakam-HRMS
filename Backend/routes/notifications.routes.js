import express from "express";
import pool from "../db.js";

const router = express.Router();

const isValidId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

/*
|--------------------------------------------------------------------------
| GET ALL NOTIFICATIONS
|--------------------------------------------------------------------------
| GET /api/notifications
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          sender_name AS "senderName",
          recipient_type AS "recipientType",
          message,
          is_read AS "isRead",
          created_at AS "createdAt"
        FROM notifications
        ORDER BY created_at DESC, id DESC
      `,
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET UNREAD NOTIFICATION COUNT
|--------------------------------------------------------------------------
| GET /api/notifications/unread-count
|--------------------------------------------------------------------------
*/

router.get(
  "/unread-count",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT
            COUNT(*)::INTEGER AS count
          FROM notifications
          WHERE is_read = FALSE
        `,
      );

      res.json({
        success: true,
        data: {
          count: result.rows[0].count,
        },
      });
    } catch (error) {
      console.error(
        "Get unread notification count error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch unread notification count",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET NOTIFICATION BY ID
|--------------------------------------------------------------------------
| GET /api/notifications/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            sender_name AS "senderName",
            recipient_type AS "recipientType",
            message,
            is_read AS "isRead",
            created_at AS "createdAt"
          FROM notifications
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Get notification error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch notification",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| CREATE / SEND NOTIFICATION
|--------------------------------------------------------------------------
| POST /api/notifications
|--------------------------------------------------------------------------
|
| Body:
|
| {
|   "senderName": "Anita Kumar",
|   "recipientType": "ALL",
|   "message": "Tomorrow is a holiday."
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        senderName,
        recipientType = "ALL",
        message,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (
        !senderName ||
        typeof senderName !== "string" ||
        !senderName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Sender name is required",
        });
      }

      if (
        !message ||
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      if (
        recipientType !== "ALL" &&
        recipientType !== "SPECIFIC"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipient type",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Insert Notification
      |--------------------------------------------------------------------------
      */

      const result = await pool.query(
        `
          INSERT INTO notifications (
            sender_name,
            recipient_type,
            message
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            sender_name AS "senderName",
            recipient_type AS "recipientType",
            message,
            is_read AS "isRead",
            created_at AS "createdAt"
        `,
        [
          senderName.trim(),
          recipientType,
          message.trim(),
        ],
      );

      res.status(201).json({
        success: true,
        message:
          "Notification sent successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Create notification error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send notification",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| MARK ONE NOTIFICATION AS READ
|--------------------------------------------------------------------------
| PUT /api/notifications/:id/read
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/read",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await pool.query(
        `
          UPDATE notifications
          SET is_read = TRUE
          WHERE id = $1
          RETURNING
            id,
            sender_name AS "senderName",
            recipient_type AS "recipientType",
            message,
            is_read AS "isRead",
            created_at AS "createdAt"
        `,
        [req.params.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message:
          "Notification marked as read",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as read",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| MARK ALL NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
| PUT /api/notifications/read-all
|--------------------------------------------------------------------------
*/

router.put(
  "/read-all",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          UPDATE notifications
          SET is_read = TRUE
          WHERE is_read = FALSE
        `,
      );

      res.json({
        success: true,
        message:
          "All notifications marked as read",
        data: {
          updatedCount:
            result.rowCount,
        },
      });
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark all notifications as read",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
| DELETE /api/notifications/:id
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
      }

      const result = await pool.query(
        `
          DELETE FROM notifications
          WHERE id = $1
          RETURNING id
        `,
        [req.params.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message:
          "Notification deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification",
      });
    }
  },
);

export default router;