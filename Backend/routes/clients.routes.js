import express from "express";
import pool from "../db.js";

const router = express.Router();

const CLIENT_STATUSES = ["ACTIVE", "INACTIVE"];

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const mapClient = (client) => ({
  id: Number(client.id),
  clientCode: client.client_code,
  clientName: client.client_name,
  contactPerson: client.contact_person,
  email: client.email,
  phone: client.phone,
  address: client.address,
  city: client.city,
  state: client.state,
  country: client.country,
  status: client.status,
  createdAt: client.created_at,
  updatedAt: client.updated_at,
});

const validateClient = (
  {
    clientCode,
    clientName,
    contactPerson,
    email,
    phone,
    address,
    city,
    state,
    country,
    status,
  },
  partial = false,
) => {
  if (!partial || clientCode !== undefined) {
    if (typeof clientCode !== "string" || !clientCode.trim()) {
      return "Client code is required";
    }
  }

  if (!partial || clientName !== undefined) {
    if (typeof clientName !== "string" || !clientName.trim()) {
      return "Client name is required";
    }
  }

  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return "Invalid email address";
    }
  }

  const optionalTextFields = {
    contactPerson,
    phone,
    address,
    city,
    state,
    country,
  };

  for (const [field, value] of Object.entries(optionalTextFields)) {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return `${field} must be a string`;
    }
  }

  if (!partial || status !== undefined) {
    if (
      typeof status !== "string" ||
      !CLIENT_STATUSES.includes(status.toUpperCase())
    ) {
      return "Invalid client status";
    }
  }

  return null;
};

const getClient = async (id) => {
  const result = await pool.query(
    `
      SELECT
        id,
        client_code,
        client_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        status,
        created_at,
        updated_at
      FROM clients
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );

  return result.rows[0];
};

/*
|--------------------------------------------------------------------------
| GET /api/clients
|--------------------------------------------------------------------------
| Get all clients
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const values = [];
    const conditions = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`
        (
          c.client_code ILIKE $${values.length}
          OR c.client_name ILIKE $${values.length}
          OR COALESCE(c.contact_person, '') ILIKE $${values.length}
          OR COALESCE(c.email, '') ILIKE $${values.length}
          OR COALESCE(c.phone, '') ILIKE $${values.length}
        )
      `);
    }

    if (status) {
      const normalizedStatus = status.toString().toUpperCase();

      if (!CLIENT_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client status",
        });
      }

      values.push(normalizedStatus);
      conditions.push(`c.status = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT
          c.id,
          c.client_code,
          c.client_name,
          c.contact_person,
          c.email,
          c.phone,
          c.address,
          c.city,
          c.state,
          c.country,
          c.status,
          c.created_at,
          c.updated_at
        FROM clients c
        ${whereClause}
        ORDER BY c.created_at DESC, c.id DESC;
      `,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(mapClient),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Client list error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load clients",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/clients/:id
|--------------------------------------------------------------------------
| Get a single client
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const client = await getClient(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.json({
      success: true,
      data: mapClient(client),
    });
  } catch (error) {
    console.error("Client profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load client",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/clients
|--------------------------------------------------------------------------
| Create a client
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      clientCode,
      clientName,
      contactPerson = null,
      email = null,
      phone = null,
      address = null,
      city = null,
      state = null,
      country = "India",
      status = "ACTIVE",
    } = req.body;

    const validationError = validateClient({
      clientCode,
      clientName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      status,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result = await pool.query(
      `
        INSERT INTO clients (
          client_code,
          client_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          client_code,
          client_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          status,
          created_at,
          updated_at;
      `,
      [
        clientCode.trim(),
        clientName.trim(),
        contactPerson?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        address?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        country?.trim() || "India",
        status.toUpperCase(),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: mapClient(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Client code already exists",
      });
    }

    console.error("Create client error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create client",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/clients/:id
|--------------------------------------------------------------------------
| Update a client
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const existingClient = await getClient(req.params.id);

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const {
      clientCode,
      clientName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      status,
    } = req.body;

    const validationError = validateClient(
      {
        clientCode,
        clientName,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        country,
        status,
      },
      true,
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (clientCode !== undefined) addUpdate("client_code", clientCode.trim());
    if (clientName !== undefined) addUpdate("client_name", clientName.trim());
    if (contactPerson !== undefined)
      addUpdate("contact_person", contactPerson?.trim() || null);
    if (email !== undefined) addUpdate("email", email?.trim() || null);
    if (phone !== undefined) addUpdate("phone", phone?.trim() || null);
    if (address !== undefined) addUpdate("address", address?.trim() || null);
    if (city !== undefined) addUpdate("city", city?.trim() || null);
    if (state !== undefined) addUpdate("state", state?.trim() || null);
    if (country !== undefined) addUpdate("country", country?.trim() || "India");
    if (status !== undefined) addUpdate("status", status.toUpperCase());

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(req.params.id);

    const result = await pool.query(
      `
        UPDATE clients
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING
          id,
          client_code,
          client_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          status,
          created_at,
          updated_at;
      `,
      values,
    );

    res.json({
      success: true,
      message: "Client updated successfully",
      data: mapClient(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Client code already exists",
      });
    }

    console.error("Update client error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update client",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /api/clients/:id
|--------------------------------------------------------------------------
| Delete a client
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM clients WHERE id = $1 RETURNING id;",
      [req.params.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Delete client error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete client",
    });
  }
});

export default router;
