import './common/env';
import Server from './common/server';
import routes from './routes';

// Unhandled errors are handled here
// todo: put this in another file
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandled Rejection', error.message);
  console.log('unhandled Rejection trace', error.stack);
});

export default new Server()
  .router(routes)
  .listen(process.env.PORT);
