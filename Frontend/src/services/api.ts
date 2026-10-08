import axios from "axios";

import {
  AUTH_TOKEN_KEY,
  clearAuthStorage,
} from "./authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const SELECTED_COMPANY_KEY =
  "aakam_hrms_selected_company_id";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        AUTH_TOKEN_KEY,
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * Super Administrator company context.
     *
     * The selected company ID is stored by
     * CompanyContext and automatically sent
     * with every API request.
     *
     * Normal company-scoped users do not need
     * this header because the backend derives
     * their company from users.company_id.
     */
    const selectedCompanyId =
      localStorage.getItem(
        SELECTED_COMPANY_KEY,
      );

    if (selectedCompanyId) {
      config.headers["x-company-id"] =
        selectedCompanyId;
    } else {
      /*
       * Make sure an old company header is not
       * accidentally reused by Axios.
       */
      delete config.headers["x-company-id"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401
    ) {
      clearAuthStorage();

      if (
        window.location.pathname !==
        "/login"
      ) {
        const currentPath =
          window.location.pathname +
          window.location.search;

        const loginUrl =
          `/login?returnUrl=${encodeURIComponent(
            currentPath,
          )}`;

        window.location.replace(
          loginUrl,
        );
      }
    }

    return Promise.reject(error);
  },
);

export default api;