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

  const saveFieldName = `save${model.modelName}`;
  const deleteFieldName = `delete${model.modelName}`;
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

function addRemoteHooks(model) {

  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {

      if (!method.shared) {
        return;
      }

      if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {

        const acceptingParams = {};
        let returnTypeName = 'obj';
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
            if (_.isArray(method.returns[0].type)) {
              returnType = method.returns[0].type[0];
            } else if (typeof method.returns[0].type === 'object') {

              const keys = _.keys(method.returns[0].type);
              const values = _.values(method.returns[0].type);

              if (values[0].type && typeof values[0].type === 'string') {
                returnType = values[0].type;
                returnTypeName = keys[0];
              } else {
                returnType = 'JSON';
              }
            }
          }
        }

        const hookName = `${method.name}${model.modelName}`;
        const type = getType(`${exchangeTypes[returnType] || returnType}`) || getType('JSON');

        hooks[hookName] = mutationWithClientMutationId({
          name: hookName,
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

  const fields = {};
  _.forEach(models, (model) => {
    Object.assign(
      fields,
      saveAndDeleteMethods(model),
      addRemoteHooks(model)
    );
  });

  return new GraphQLObjectType({
    name: 'Mutation',
    fields
  });
};
