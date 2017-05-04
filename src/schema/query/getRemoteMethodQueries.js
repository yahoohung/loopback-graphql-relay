'use strict';

const _ = require('lodash');

const promisify = require('promisify-node');

const utils = require('../utils');

const allowedVerbs = ['get', 'head'];

module.exports = function getRemoteMethodQueries(model) {
  const hooks = {};

  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().forEach((method) => {
      if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {

        if (!utils.isRemoteMethodAllowed(method, allowedVerbs)) {
          return;
        }

        const acceptingParams = utils.getRemoteMethodInput(method);
        const type = utils.getRemoteMethodOutput(method);
        const hookName = utils.getRemoteMethodQueryName(model, method);

        hooks[hookName] = {
          name: hookName,
          description: method.description,
          meta: { relation: true },
          args: acceptingParams,
          type,
          resolve: (__, args, context, info) => {
            const params = [];

            _.forEach(acceptingParams, (param, name) => {
              params.push(args[name]);
            });
            const wrap = promisify(model[method.name]);
            return wrap.apply(model, params);
          }
        };
      }
    });
  }

  return hooks;
};
