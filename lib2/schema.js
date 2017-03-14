const _ = require('lodash');
const utils = require('./utils');
const execution = require('./execution');

/** * Loopback Types - GraphQL types
        any - JSON
        Array - [JSON]
        Boolean = boolean
        Buffer - not supported
        Date - Date (custom scalar)
        GeoPoint - not supported
        null - not supported
        Number = float
        Object = JSON (custom scalar)
        String - string
    ***/

const exchangeTypes = {
  any: 'JSON',
  Any: 'JSON',
  Number: 'Int',
  number: 'Int',
  Object: 'JSON',
  object: 'JSON'
};

const SCALARS = {
  any: 'JSON',
  number: 'Float',
  string: 'String',
  boolean: 'Boolean',
  objectid: 'ID',
  date: 'Date',
  object: 'JSON',
  now: 'Date',
  guid: 'ID',
  uuid: 'ID',
  uuidv4: 'ID'
};

const types = {};

function mapRoot(model) {
  types.Query.fields[utils.pluralModelName(model)] = {
    relation: true,
    root: true,
    args: PAGINATION,
    gqlType: utils.connectionTypeName(model),
    type: getConnection(typeName, typeDefs),
    resolver: (robjoot, args, context) => execution.findAll(model, root, args, context)
  };

  types.Mutation.fields[`save${utils.singularModelName(model)}`] = {
    relation: true,
    args: `obj: ${utils.singularModelName(model)}Input!`,
    gqlType: utils.singularModelName(model),
    resolver: (context, args) => model.upsert(args.obj)
  };

  types.Mutation.fields[`delete${utils.singularModelName(model)}`] = {
    relation: true,
    args: IDPARAMS,
    gqlType: ` ${utils.singularModelName(model)}`,
    resolver: (context, args) => model.findById(args.id)
                .then(instance => instance.destroy())
  };
  addRemoteHooks(model);
}


module.exports = function abstractTypes(models) {

  types.Query = {
    category: 'TYPE',
    fields: {}
  };
  types.Mutation = {
    category: 'TYPE',
    fields: {}
  };

  _.forEach(models, (model) => {
    console.log(model.modelName);
    if (model.shared) {
      mapRoot(model);
    }
    types[utils.singularModelName(model)] = {
      category: 'TYPE',
      input: true,
      fields: {}
    };
    if (model.definition) {
      _.forEach(model.definition.properties, (property, key) => {
        mapProperty(model, property, utils.singularModelName(model), key);
      });
    }

    // mapConnection(model);
    _.forEach(utils.sharedRelations(model), (rel) => {
      mapRelation(rel, utils.singularModelName(model), rel.name);
      // mapConnection(rel.modelTo);
    });
  });
  return types;
};
