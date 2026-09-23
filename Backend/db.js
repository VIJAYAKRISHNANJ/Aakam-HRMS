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
      to_regclass('public.users') AS public_users,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'company_id'
      ) AS users_company_id
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