'use strict';

const _ = require('lodash');

const {
	connectionArgs
} = require('graphql-relay');

const { GraphQLObjectType } = require('graphql');
const { getType, getConnection } = require('../types/type');
const { findAllRelated } = require('../db');
const { connectionFromPromisedArray } = require('../db/resolveConnection');
const getRemoteMethods = require('./utils/getRemoteMethods');

/**
 *
 * @param {*} models
 */
function getRelatedModelFields(User) {
  const fields = {};
	
  _.forEach(User.relations, (relation) => {

		const model = relation.modelTo;

    fields[_.lowerFirst(relation.name)] = {
      args: Object.assign({
        where: {
          type: getType('JSON')
        },
        order: {
          type: getType('JSON')
        },
      }, connectionArgs),
      type: getConnection(model.modelName),
      resolve: (obj, args, context) => {
				
				if (!context.req.accessToken) return null;

				return getUserFromAccessToken(context.req.accessToken, User)
					.then(user => connectionFromPromisedArray(findAllRelated(User, user, relation.name, args, context), args, model));
			}
    };
  });

  return fields;
}

function getUserFromAccessToken(accessToken, UserModel) {

  if (!accessToken) return null;

	return UserModel.findById(accessToken.userId).then((user) => {
		if (!user) return Promise.reject('No user with this access token was found.');
		return Promise.resolve(user);
	});
}

function getMeField(accessToken) {
  if (accessToken) {
    return {
      me: {
        type: getType(accessToken.customUserModel),
        resolve: (obj, args, { app, req }) => {

          if (!req.accessToken) return null;


          return app.models[accessToken.customAccessTokenModel].findById(req.accessToken.id, { include: accessToken.relation }).then( (obj, err) => {
            if (!obj) return Promise.reject('Custom Access token not found');

            const accessToken = obj.toJSON();
            const user = accessToken.user;
            if (!user) return Promise.reject('No Account with this access token was found.');
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

        if (!req.accessToken) return null;

        return app.models.User.findById(req.accessToken).then((user) => {
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

	const User = _.find(models, model => model.modelName === 'Account');

  const Viewer = {
    resolve: (root, args, context) => ({}),
    type: new GraphQLObjectType({
      name: 'Viewer',
      description: 'Viewer',
      // interfaces: () => [nodeDefinitions.nodeInterface],
      fields: () => Object.assign({},
          getMeField(accessToken),
          getRelatedModelFields(User)
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
