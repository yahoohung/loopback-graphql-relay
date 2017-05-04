'use strict';

const _ = require('lodash');

const { getType } = require('../../types/type');
const { SCALARS } = require('../../types/generateTypeDefs');

const exchangeTypes = {
  any: 'JSON',
  Any: 'JSON',
  Number: 'Int',
  number: 'Int',
  Object: 'JSON',
  object: 'JSON'
};

/**
 * Checks if a given remote method allowed based on the allowed verbs
 * @param {*} method
 * @param {*} allowedVerbs
 */
function isRemoteMethodAllowed(method, allowedVerbs) {

  let httpArray = method.http;

  if (!_.isArray(method.http)) {
    httpArray = [method.http];
  }

  const results = httpArray.map((item) => {

    const verb = item.verb;

    if (allowedVerbs && !_.includes(allowedVerbs, verb)) {
      return false;
    }

    return true;
  });

  const result = _.includes(results, true);

  return result;
}

/**
 * Extracts query params from a remote method
 * @param {*} method
 */
function getRemoteMethodInput(method) {
  const acceptingParams = {};

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

  return acceptingParams;
}

/**
 * Extracts query output fields from a remote method
 * @param {*} method
 */
function getRemoteMethodOutput(method) {

  let returnType = 'JSON';

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

  return returnType;
}

/**
 * Returns query name for a remote method
 * @param {*} model
 * @param {*} method
 */
function getRemoteMethodQueryName(model, method) {
  return `${model.modelName}${_.upperFirst(method.name)}`;
}

module.exports = {
  exchangeTypes,
  isRemoteMethodAllowed,
  getRemoteMethodInput,
  getRemoteMethodOutput,
  getRemoteMethodQueryName
};
