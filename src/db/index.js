'use strict';

const _ = require('lodash');
const utils = require('./utils');

function buildSelector(model, args) {
  const selector = {
    where: args.where || {}
  };

  const begin = utils.getId(args.after);
  const end = utils.getId(args.before);

  selector.skip = args.first - args.last || 0;
  selector.limit = args.last || args.first;
  selector.order = model.getIdName() + (end ? ' DESC' : ' ASC');

  if (begin) {
    selector.where[model.getIdName()] = selector[model.getIdName()] || {};
    selector.where[model.getIdName()].gt = begin;
  }
  if (end) {
    selector.where[model.getIdName()] = selector[model.getIdName()] || {};
    selector.where[model.getIdName()].lt = end;
  }
  return selector;
}

function getCount(model, obj, args, context) {
  return model.count(args.where);
}

function getFirst(model, obj, args) {
  return model.findOne({
    order: model.getIdName() + (args.before ? ' DESC' : ' ASC'),
    where: args.where
  })
  .then(res => (res ? res.__data : {}));
}

function findOne(model, obj, args, context) {
  const id = obj ? obj[model.getIdName()] : args.id;
  return model.findById(id);
}

function getList(model, obj, args) {
  return model.find(buildSelector(model, args));
}

function findAll(model, obj, args, context) {
  const response = {
    args,
    count: undefined,
    first: undefined,
    list: undefined,
  };
  return getCount(model, obj, args, undefined)
    .then((count) => {
      response.count = count;
      return getFirst(model, obj, args);
    })
    .then((first) => {
      response.first = first;
      return getList(model, obj, args);
    })
    .then((list) => {
      response.list = list;
      return response;
    });
}

function findRelatedMany(rel, obj, args, context) {
  if (_.isArray(obj[rel.keyFrom])) {
    return [];
  }
  args.where = {
    [rel.keyTo]: obj[rel.keyFrom],
  };
  return findAll(rel.modelTo, obj, args, context);

  // if (_.isArray(obj[rel.keyFrom])) {
  //   return Promise.resolve([]);
  // }

  // return obj[rel.name](args).then();
}

function findRelatedOne(rel, obj, args, context) {
  if (_.isArray(obj[rel.keyFrom])) {
    return Promise.resolve([]);
  }
  args = {
    [rel.keyTo]: obj[rel.keyFrom]
  };
  return findOne(rel.modelTo, null, args, context);
}

module.exports = {
  findAll,
  findOne,
  findRelatedMany,
  findRelatedOne
};
