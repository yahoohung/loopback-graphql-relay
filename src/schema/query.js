'use strict';

const _ = require('lodash');

const {
	connectionArgs,
  connectionFromPromisedArray
} = require('graphql-relay');

const { GraphQLObjectType } = require('graphql');
const { getType, getConnection } = require('../types/type');
const { findAll } = require('../db');

/**
 * Generates Viewer query
 * @param {*} models
 */
function generateViewer(models) {

  const Viewer = {
    resolve: (root, args, context) => ({}),
    type: new GraphQLObjectType({
      name: 'Viewer',
      description: 'Viewer',
      // interfaces: () => [nodeDefinitions.nodeInterface],
      fields: () => {

        const fields = {};

        _.forEach(models, (model) => {

          if (!model.shared) {
            return;
          }

          fields[_.lowerFirst(model.pluralModelName)] = {
            args: Object.assign({
              where: {
                type: getType('JSON')
              },
            }, connectionArgs),
            type: getConnection(model.modelName),
            resolve: (obj, args, context) => {
              return connectionFromPromisedArray(findAll(model, obj, args, context), args);
            }
          };
        });

        return fields;
      }
    })
  };

  return Viewer;
}
module.exports = function(models) {
  return new GraphQLObjectType({
    name: 'Query',
    fields: {
      // node: getType('node'),
      viewer: generateViewer(models)
    }
  });
};
