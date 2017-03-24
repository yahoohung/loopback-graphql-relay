const createServer = require('http').createServer;
const Server = require('subscriptions-transport-ws').SubscriptionServer;

const WS_PORT = 10005;

const httpServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

module.exports = function(subscriptionManager) {
  httpServer.listen(WS_PORT, () => console.log(`Graphql Subscription Server is now running on port ${WS_PORT}`));

  const server = new Server({ subscriptionManager }, httpServer);

  return server;
};
