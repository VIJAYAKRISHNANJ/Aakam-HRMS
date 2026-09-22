import axios from "axios";
import {
  AUTH_TOKEN_KEY,
  clearAuthStorage,
} from "./authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      AUTH_TOKEN_KEY,
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
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