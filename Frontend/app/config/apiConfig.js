const getApiBaseUrl = () => {
  return __DEV__
    ? "https://localhost:7059" // Development (Local)
    : "https://your-production-api.com"; // Production
};

export default getApiBaseUrl;
