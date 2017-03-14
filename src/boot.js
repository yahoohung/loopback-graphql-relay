'use strict';

const graphql = require('graphql-server-express');
const gqlTools = require('graphql-tools');
const bodyParser = require('body-parser');
// const _ = require('lodash');

const ast = require('./ast');
const resolvers = require('./resolvers');
const typeDefs = require('./typedefs');

module.exports = function(app, options) {
  const models = app.models();
  const types = ast(models);
  const typeDefObjs = typeDefs(types);

  const schema = gqlTools.makeExecutableSchema({
    typeDefs: typeDefObjs,
    resolvers: resolvers(models),
    resolverValidationOptions: {
      requireResolversForAllFields: false
    }
  });

  const graphiqlPath = options.graphiqlPath || '/graphiql';
  const path = options.path || '/graphql';

  app.use(path, bodyParser.json(), graphql.graphqlExpress(req => ({
    schema,
    context: req
  })));
  app.use(graphiqlPath, graphql.graphiqlExpress({
    endpointURL: path
  }));
};
