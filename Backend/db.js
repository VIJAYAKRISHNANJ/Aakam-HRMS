import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

pool
  .query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      current_schema() AS current_schema,
      current_setting('search_path') AS search_path,
      inet_server_addr()::text AS server_address,
      inet_server_port() AS server_port,
      to_regclass('public.users')::text AS public_users,
      to_regclass('users')::text AS resolved_users,
      to_regclass(current_user || '.users')::text AS user_schema_users,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'company_id'
      ) AS public_users_company_id,
      EXISTS (
        SELECT 1
        FROM pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c
          ON c.oid = a.attrelid
        JOIN pg_catalog.pg_namespace n
          ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'users'
          AND a.attname = 'company_id'
          AND a.attnum > 0
          AND NOT a.attisdropped
      ) AS pg_catalog_users_company_id
  `)
  .then(({ rows }) => {
    console.log("Database connection diagnostic:", rows[0]);
  })
  .catch((error) => {
    console.error(
      "Database connection diagnostic failed:",
      error?.message || error
    );
  });

export default pool;