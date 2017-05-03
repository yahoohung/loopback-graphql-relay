'use strict';

const _ = require('lodash');

const {
	connectionArgs
} = require('graphql-relay');

const { GraphQLObjectType } = require('graphql');
const { getType, getConnection } = require('../types/type');
const { findAll } = require('../db');
const { connectionFromPromisedArray } = require('../db/resolveConnection');
const getRemoteMethods = require('./utils/getRemoteMethods');

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
        order: {
          type: getType('JSON')
        },
      }, connectionArgs),
      type: getConnection(model.modelName),
      resolve: (obj, args, context) => connectionFromPromisedArray(findAll(model, obj, args, context), args, model)
    };
  });

  return fields;
}


function getMeField(accessToken) {
  if (accessToken) {
    return {
      me: {
        type: getType(accessToken.customUserModel),
        resolve: (obj, args, { app, req }) => {

          if (!req.headers.accesstoken) return null;


          return app.models[accessToken.customAccessTokenModel].findById(req.headers.accesstoken, { include: accessToken.relation }).then( (obj, err) => {
            const accessToken = obj.toJSON();
            const user = accessToken.user;
            if (!user) return Promise.reject('No user with this access token was found.');
            return Promise.resolve(user);
          });
        }
      }
    };
  }
  return {
    me: {
      type: getType('User'),
      resolve: (obj, args, { app, req }) => {

        if (!req.headers.accesstoken) return null;

        return app.models.User.findById(req.headers.accesstoken).then((user) => {
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
function generateViewer(models, accessToken) {

  const Viewer = {
    resolve: (root, args, context) => ({}),
    type: new GraphQLObjectType({
      name: 'Viewer',
      description: 'Viewer',
      // interfaces: () => [nodeDefinitions.nodeInterface],
      fields: () => Object.assign({},
          getMeField(accessToken),
          getRelatedModelFields(models)
        )
    })
  };

  return Viewer;
}


function generateModelFields(models) {

  const modelFields = {};
  _.forEach(models, (model) => {

    const fields = Object.assign({},
      getRemoteMethods(model, ['get', 'head'])
    );

    if (_.size(fields) === 0) {
      return;
    }

    modelFields[_.upperFirst(model.modelName)] = {
      resolve: (root, args, context) => ({}),
      type: new GraphQLObjectType({
        name: `${model.modelName}Queries`,
        description: model.modelName,
        fields
      })
    };

  });

  return modelFields;
}

module.exports = function(models, accessToken) {

  const fields = Object.assign({},
    {
      node: getType('node'),
      viewer: generateViewer(models, accessToken)
    },
    generateModelFields(models)
  );

  return new GraphQLObjectType({
    name: 'Query',
    fields
  });
};
