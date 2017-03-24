'use strict';

const graphql = require('graphql-server-express');
const bodyParser = require('body-parser');
const { getSchema } = require('./schema/index');

const PubSub = require('./schema/subscription/pubsub');
const SubscriptionManager = require('./schema/subscription/subscriptionManager');
const subscriptionServer = require('./schema/subscription/server');

module.exports = function(app, options) {
  const models = app.models();
  const schema = getSchema(models);

  const graphiqlPath = options.graphiqlPath || '/graphiql';
  const path = options.path || '/graphql';

  app.use(path, bodyParser.json(), graphql.graphqlExpress(req => ({
    schema,
    context: {
      app,
      req
    }
  })));
  app.use(graphiqlPath, graphql.graphiqlExpress({
    endpointURL: path
  }));

  // Subscriptions
  const pubsub = new PubSub();

  const subscriptionManager = SubscriptionManager(models, schema, pubsub);

  subscriptionServer(subscriptionManager);

  // start a subscription (for testing)
  // subscriptionManager.subscribe({
  //   query: `
  //     subscription AuthorSubscription(
  //       $options: JSON
  //       $create: Boolean 
  //       $update: Boolean
  //       $remove: Boolean
  //     ) {
  //       Author(input: {
  //         options: $options
  //         create: $create 
  //         update: $update 
  //         remove: $remove
  //       }) {
  //         author {
  //           id first_name last_name
  //         }
  //         where type target clientSubscriptionId
  //       }
  //     }
  //   `,
  //   variables: {
  //     options: {},
  //     create: true,
  //     update: true,
  //     remove: true,
  //   },
  //   context: {},
  //   callback: (err, data) => {
  //     console.log('subs output', data);
  //   },
  // }).catch(err => console.log(`An error occured: ${err}`));

};
