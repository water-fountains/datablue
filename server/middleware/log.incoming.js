
function logIncomingRequests(logger) {
  return (req, res, next) => {
    // without custom serializers, we must be explicit
    logger.info(`incoming request: ${req.url}`);
    next();
  }
}

export default logIncomingRequests;