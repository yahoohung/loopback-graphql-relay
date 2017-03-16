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

  if (model.getIdName && model.getIdName()) {
    selector.order = model.getIdName() + (end ? ' DESC' : ' ASC');
    if (begin) {
      selector.where[model.getIdName()] = selector[model.getIdName()] || {};
      selector.where[model.getIdName()].gt = begin;
    }
    if (end) {
      selector.where[model.getIdName()] = selector[model.getIdName()] || {};
      selector.where[model.getIdName()].lt = end;
    }
  }
  return selector;
}

function findOne(model, obj, args, context) {
  const id = obj ? obj[model.getIdName()] : args.id;
  return model.findById(id);
}

function getCount(model, obj, args, context) {
  return model.count(args.where);
}

function getFirst(model, obj, args) {
  return model.findOne({
    order: model.getIdName() + (args.before ? ' DESC' : ' ASC'),
    where: args.where
  })
        .then(res => res ? res.__data : {});
}

function getList(model, obj, args) {
  return model.find(buildSelector(model, args));
}

function findAll(model, obj, args, context) {
  return getList(model, obj, args);
}

function findRelated(rel, obj, args, context) {
  if (_.isArray(obj[rel.keyFrom])) {
    return Promise.resolve([]);
  }
  args.where = {
    [rel.keyTo]: obj[rel.keyFrom]
  };
  return findAll(rel.modelTo, obj, args, context);

}

function resolveConnection(model, obj, args, context) {
  return {
    [utils.connectionTypeName(model)]: {
      totalCount: (obj, args, context) => obj.count,

      edges: (obj, args, context) => _.map(obj.list, node => ({
        cursor: utils.idToCursor(node[model.getIdName()]),
        node
      })),

      [model.pluralModelName]: (obj, args, context) => obj.list,

      pageInfo: (obj, args, context) => {
        const pageInfo = {
          startCursor: null,
          endCursor: null,
          hasPreviousPage: false,
          hasNextPage: false
        };
        if (obj.count > 0) {
          pageInfo.startCursor = utils.idToCursor(obj.list[0][model.getIdName()]);
          pageInfo.endCursor = utils.idToCursor(obj.list[obj.list.length - 1][model.getIdName()]);
          pageInfo.hasNextPage = obj.list.length === obj.args.limit;
          pageInfo.hasPreviousPage = obj.list[0][model.getIdName()] !== obj.first[model.getIdName()].toString();
        }
        return pageInfo;
      }
    }
  };
}

module.exports = {
  findAll,
  findOne,
  findRelated,
  resolveConnection
};
