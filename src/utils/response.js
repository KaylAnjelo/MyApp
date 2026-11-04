const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message, statusCode = 500, errorData = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errorData && { error: errorData }),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError
};