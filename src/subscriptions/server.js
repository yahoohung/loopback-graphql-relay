const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');


module.exports = function(app, subscriptionManager, opts) {

  const subscriptionOpts = opts.subscriptionServer || {};

  const disable = subscriptionOpts.disable || false;

  if (disable === true) {
    return;
  }

  const WS_PORT = subscriptionOpts.port || 5000;
  const options = subscriptionOpts.options || {};
  const socketOptions = subscriptionOpts.socketOptions || {};

  const websocketServer = createServer((request, response) => {
    response.writeHead(404);
    response.end();
  });

  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on http://localhost:${WS_PORT}`
  ));

  const server = new SubscriptionServer(
      Object.assign({}, {
        // onConnect: ({ accessToken }) => {
        //   return new Promise((resolve, reject) => {
        //     app.loopback.AccessToken.findById(accessToken, (err, token) => {
        //       if (err) {
        //         reject(err);
        //       }

        //       if (!token) {
        //         reject(new Error('Access denied!'));
        //       }

        //       return resolve({ accessToken: token });
        //     });
        //   });

        // },
        subscriptionManager
      }, options),
      Object.assign({}, {
        server: websocketServer,
        path: '/'
      }, socketOptions)
    );

  return server;
};
