const getApiBaseUrl = () => {
  return __DEV__
    ? "https://localhost:7059" // Development (Local)
    : "https://proj.ruppin.ac.il/cgroup88/prod/api/"; // Production
};

export default getApiBaseUrl;
