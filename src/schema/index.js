'use strict';

const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');
const getMutation = require('./mutation');

function getSchema(models) {
  return new GraphQLSchema({
    query: getQuery(models),
    mutation: getMutation(models),
  });
}

module.exports = {
  getSchema
};
