
function logIncomingRequests(logger) {
  return (req, res, next) => {
    // without custom serializers, we must be explicit
    if(req.url !== '/json' && req.url !== '/json/version'){
      logger.info(`log.incoming.js: logIncomingRequests: ${req.url}`);
    }
    next();
  }
}

export default logIncomingRequests;