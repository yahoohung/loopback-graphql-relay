'use strict';

const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');

function getSchema(models) {
  return new GraphQLSchema({
    query: getQuery(models)
  });
}

module.exports = {
  getSchema
};
