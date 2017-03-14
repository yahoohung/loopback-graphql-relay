'use strict';

const graphql = require('graphql-server-express');
const gqlTools = require('graphql-tools');
const bodyParser = require('body-parser');
// const _ = require('lodash');
const { GraphQLSchema, GraphQLObjectType } = require('graphql');

const ast = require('./ast');
const viewerAst = require('./viewerAst');
const resolvers = require('./resolvers');
const typeDefs = require('./typedefs');

module.exports = function(app, options) {
  const models = app.models();
  const types = ast(models);
  types.Viewer = viewerAst(models);
  const typeDefObjs = typeDefs(types, models);

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        // node: nodeField,
        viewer: {
          type: typeDefObjs.Viewer,
          args: {},
          resolve: (root, args, context) => {
            return { id: 'foo' };
          }
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
