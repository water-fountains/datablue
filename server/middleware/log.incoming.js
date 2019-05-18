
function logIncomingRequests(logger) {
  return (req, res, next) => {
    // without custom serializers, we must be explicit
    logger.info(`incoming request: ${req.url} Request id: ${req.id}`, 'Incoming request');
    next();
  }
}

export default logIncomingRequests;