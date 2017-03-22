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
 *
 * @param {*} models
 */
function getRelatedModelFields(models) {
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
      resolve: (obj, args, context) => connectionFromPromisedArray(findAll(model, obj, args, context), args)
    };
  });

  return fields;
}


function getMeField() {
  return {
    me: {
      type: getType('User'),
      resolve: (obj, args, { app, req }) => {

        if (!req.accessToken) return null;

        return app.models.User.findById(req.accessToken.userId).then((user) => {
          user = user.toJSON();
          if (!user) return Promise.reject('No user with this access token was found.');
          return Promise.resolve(user);
        });
      }
    }
  };
}

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
      fields: () => Object.assign({},
          getMeField(),
          getRelatedModelFields(models)
        )
    })
  };

  return Viewer;
}
module.exports = function(models) {
  return new GraphQLObjectType({
    name: 'Query',
    fields: {
      node: getType('node'),
      viewer: generateViewer(models)
    }
  });
};
