const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const WS_PORT = 10005;

const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

module.exports = function(subscriptionManager) {
  websocketServer.listen(WS_PORT, () => console.log(
    `Websocket Server is now running on http://localhost:${WS_PORT}`
  ));

  const server = new SubscriptionServer(
    {
      // onConnect: (connectionParams) => {
      //   // Implement if you need to handle and manage connection
      // },
      subscriptionManager
    },
    {
      server: websocketServer,
      path: '/'
    });

  return server;
};
