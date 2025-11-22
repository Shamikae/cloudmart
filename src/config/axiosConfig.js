// src/config/axiosConfig.js

import axios from "axios";

const instance = axios.create({
  timeout: 50000,
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toUpperCase();

    // ❗ VERY IMPORTANT:
    // Only add JSON headers to POST/PUT/DELETE
    // Never add them to GET (avoids OPTIONS preflight)
    if (method !== "GET") {
      config.headers = {
        ...(config.headers || {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (unchanged)
instance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default instance;