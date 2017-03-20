'use strict';

const { GraphQLSchema } = require('graphql');
const getQuery = require('./query');
const getMutation = require('./mutation');
const getTypes = require('../types');

function getSchema(models) {

  getTypes(models);

  return new GraphQLSchema({
    query: getQuery(models),
    mutation: getMutation(models),
  });
}

module.exports = {
  getSchema
};
