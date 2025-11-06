// src/utils/axiosConfig.js

import axios from "axios";

const instance = axios.create({
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // You can add logic here to attach tokens, etc.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    // You can add logic here to handle responses
    return response;
  },
  (error) => {
    // You can add logic here to handle errors
    return Promise.reject(error);
  }
);

export default instance;
