import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import axios from "axios";

import {
  BrowserRouter,
} from "react-router-dom";

import "./index.css";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

// All existing services share Axios. Attach the current credential at the
// transport boundary so protected endpoints cannot accidentally be called
// anonymously. Authorization remains enforced by the backend.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("aakam_hrms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("aakam_hrms_token");
      localStorage.removeItem("aakam_hrms_user");
      localStorage.removeItem("aakam_hrms_roles");
      localStorage.removeItem("aakam_hrms_permissions");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

createRoot(
  document.getElementById(
    "root",
  )!,
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
