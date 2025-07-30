// sendResponse.service.js (ESM format)
const sendResponse = (
  res,
  statusCode,
  success,
  message,
  response,
  token = null
) => {
  const data = {
    success,
    message,
    response,
  };

  if (token) {
    data.token = token;
  }

  res.status(statusCode).json(data);
};

export default sendResponse;
