'use strict';

const _ = require('lodash');

const {
  mutationWithClientMutationId
} = require('graphql-relay');

const promisify = require('promisify-node');

const utils = require('../utils');
const { getType } = require('../../types/type');

const allowedVerbs = ['post', 'del', 'put', 'patch', 'all'];

module.exports = function getRemoteMethodMutations(model) {
  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {
      if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {

        if (!utils.isRemoteMethodAllowed(method, allowedVerbs)) {
          return;
        }

        const acceptingParams = utils.getRemoteMethodInput(method);
        const returnType = utils.getRemoteMethodOutput(method);
        const hookName = utils.getRemoteMethodQueryName(model, method);

        const type = getType(`${utils.exchangeTypes[returnType] || returnType}`) || getType('JSON');

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
};
