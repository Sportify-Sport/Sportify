const getApiBaseUrl = () => {
    return process.env.NODE_ENV === 'development'
      ? 'https://localhost:7059' // Development (Local)
      : 'https://your-production-api.com'; // Production
  };
  
  export default getApiBaseUrl;
  