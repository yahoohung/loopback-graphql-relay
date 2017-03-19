'use strict';

const graphql = require('graphql-server-express');
const gqlTools = require('graphql-tools');
const bodyParser = require('body-parser');
// const _ = require('lodash');
const { GraphQLSchema, GraphQLObjectType } = require('graphql');

const { getSchema } = require('./schema/index');


const ast = require('./ast');
const viewerAst = require('./viewerAst');
const resolvers = require('./resolvers');
const typeDefs = require('./typedefs');


const getTypes = require('./types');

module.exports = function(app, options) {
  const models = app.models();


  const queryDefObjs = getTypes(models);

  const schema = getSchema(models);

  // const types = ast(models);
  // types.Viewer = viewerAst(models);
  // types.node = {
  //   gqlType: 'node'
  // };

  // const typeDefObjs = typeDefs(types, models);

  // const schema = new GraphQLSchema({
  //   query: new GraphQLObjectType({
  //     name: 'Query',
  //     fields: {
  //       node: typeDefObjs.node,
  //       viewer: {
  //         type: typeDefObjs.Viewer,
  //         args: {},
  //         resolve: (root, args, context) => ({ id: 'foo' })
  //       }
  //     }
  //   })
  // });

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
