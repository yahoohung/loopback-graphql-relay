'use strict';

const graphql = require('graphql-server-express');
const gqlTools = require('graphql-tools');
const bodyParser = require('body-parser');

const { getType } = require('./types');

const { GraphQLSchema, GraphQLObjectType } = require('graphql');

const { nodeField } = require('./nodeDefinitions');

const getTypes = require('./ast');

module.exports = function(app, options) {
  const models = app.models();
  global.MODELS_FOR_GQL = models;







  const types = getTypes(models);

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        node: nodeField,
        viewer: {
          type: types.Viewer,
          args: {},
          resolve: (root, args, context) => ({ id: 'foo' })
        }
      }
    })
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
