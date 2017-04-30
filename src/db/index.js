'use strict';

const _ = require('lodash');
const utils = require('./utils');
const waterfall = require('async/waterfall');

function buildSelector(model, args) {
  const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';

  const selector = {
    where: args.where || {}
  };

  const begin = utils.getId(args.after);
  const end = utils.getId(args.before);

  selector.skip = args.first - args.last || 0;
  selector.limit = args.last || args.first;
  selector.order = idName + (end ? ' DESC' : ' ASC');

  if (begin) {
    selector.where[idName] = selector[idName] || {};
    selector.where[idName].gt = begin;
  }
  if (end) {
    selector.where[idName] = selector[idName] || {};
    selector.where[idName].lt = end;
  }
  return selector;
}

function getCount(model, obj, args, context) {
  return model.count(args.where);
}

function getFirst(model, obj, args) {
  const idName = (model.getIdName && model.getIdName()) ? model.getIdName() : 'id';

  return model.findOne({
    order: idName + (args.before ? ' DESC' : ' ASC'),
    where: args.where
  })
  .then(res => (res || {}));
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

function findAllViaThrough(rel, obj, args, context) {
  const response = {
    args,
    count: undefined,
    first: undefined,
    list: undefined,
  };

  return new Promise((resolve, reject) => {
    waterfall([
      function(callback) {
        obj[`__count__${rel.name}`]({}, callback);
      },
      function(count, callback) {
        response.count = count;
        obj[`__findOne__${rel.name}`]({}, callback);
      },
      function(first, callback) {
        response.first = first;
        obj[`__get__${rel.name}`]({}, callback);
      }
    ], (err, list) => {

      if (err) {
        return reject(err);
      }
      response.list = list;
      return resolve(response);
    });

  });

  // return obj[`__count__${rel.name}`]()
  //   .then((count) => {
  //     response.count = count;
  //     return getFirst(rel.modelThrough, obj, args);
  //   });
  // return getCount(rel.modelThrough, obj, args, undefined)
  //   .then((count) => {
  //     response.count = count;
  //     return getFirst(rel.modelThrough, obj, args);
  //   })
  //   .then(first => first[_.camelCase(rel.modelTo.modelName)].getAsync())
  //   .then((first) => {
  //     response.first = first;
  //     return Promise.resolve(obj[rel.name]({}, (err, list) => {
  //       if (err) {
  //         return Promise.reject(err);
  //       }

  //       response.list = list;
  //       return response;
  //     }));
  //   });

}

function findRelatedMany(rel, obj, args, context) {
  if (_.isArray(obj[rel.keyFrom])) {
    return [];
  }
  args.where = {
    [rel.keyTo]: obj[rel.keyFrom],
  };

  if (rel.keyThrough) {
    return findAllViaThrough(rel, obj, args, context);
  }

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
