'use strict';

const _ = require('lodash');

const {
  mutationWithClientMutationId
} = require('graphql-relay');

const { GraphQLObjectType } = require('graphql');
const promisify = require('promisify-node');

const { getType } = require('../types/type');
const { SCALARS } = require('../types/generateTypeDefs');

const exchangeTypes = {
  any: 'JSON',
  Any: 'JSON',
  Number: 'Int',
  number: 'Int',
  Object: 'JSON',
  object: 'JSON'
};

/**
 * Create basic save and delete methods for all shared models
 * @param {*} model
 */
function saveAndDeleteMethods(model) {
  const fields = {};

  if (!model.shared) {
    return;
  }

  const saveFieldName = `${_.lowerFirst(model.modelName)}Save`;
  const deleteFieldName = `${_.lowerFirst(model.modelName)}Delete`;
  const InputModelName = `${model.modelName}Input`;

  fields[saveFieldName] = mutationWithClientMutationId({
    name: saveFieldName,
    inputFields: {
      obj: {
        type: getType(InputModelName)
      },
    },
    outputFields: {
      obj: {
        type: getType(model.modelName),
        resolve: o => o
      },
    },
    mutateAndGetPayload: ({ obj }) => model.upsert(Object.assign({}, obj))
  });

  fields[deleteFieldName] = mutationWithClientMutationId({
    name: deleteFieldName,
    inputFields: {
      obj: {
        type: getType(InputModelName)
      },
    },
    mutateAndGetPayload: ({ obj }) => model.findById(obj.id).then(instance => instance.destroy())
  });

  return fields;
}

function addRemoteHooks(model, allowedVerbs) {

  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {
      if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {

        const verb = method.http.verb;

        if (allowedVerbs && !_.includes(allowedVerbs, verb)) {
          return;
        }

        const acceptingParams = {};
        let returnType = 'JSON';

        method.accepts.forEach((param) => {
          let paramType = '';
          if (typeof param.type === 'object') {
            paramType = 'JSON';
          } else if (!SCALARS[param.type.toLowerCase()]) {
            paramType = `${param.type}Input`;
          } else {
            paramType = _.upperFirst(param.type);
          }
          if (param.arg) {
            acceptingParams[param.arg] = {
              type: getType(exchangeTypes[paramType] || paramType)
            };
          }
        });
        if (method.returns && method.returns[0]) {
          if (!SCALARS[method.returns[0].type] && typeof method.returns[0].type !== 'object') {
            returnType = `${method.returns[0].type}`;
          } else {
            returnType = `${_.upperFirst(method.returns[0].type)}`;
            if (typeof method.returns[0].type === 'object') {
              returnType = 'JSON';
            }
          }
        }

        const hookName = `${_.lowerFirst(model.modelName)}${_.upperFirst(method.name)}`;
        const type = getType(`${exchangeTypes[returnType] || returnType}`) || getType('JSON');

        hooks[hookName] = mutationWithClientMutationId({
          name: hookName,
          description: method.description,
          meta: { relation: true },
          inputFields: acceptingParams,
          outputFields: {
            obj: {
              type,
              resolve: o => o.obj
            },
          },
          mutateAndGetPayload: (args) => {
            const params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });
            const wrap = promisify(model[method.name]);
            return wrap.apply(model, params).then(data => ({ obj: data }));
          }
        });
      }
    });
  }

  return hooks;
}

module.exports = function(models) {

  const modelFields = {};
  _.forEach(models, (model) => {

    const fields = Object.assign({},
      addRemoteHooks(model, ['post', 'delete', 'put', 'patch']),
      saveAndDeleteMethods(model)
    );

    if (_.size(fields) === 0) {
      return;
    }

    modelFields[model.modelName] = {
      resolve: (root, args, context) => ({}),
      type: new GraphQLObjectType({
        name: `${model.modelName}Mutations`,
        description: model.modelName,
        fields
      })
    };

  });

  return new GraphQLObjectType({
    name: 'Mutation',
    fields: modelFields
  });
};
