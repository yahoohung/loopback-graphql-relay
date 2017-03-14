'use strict';

const _ = require('lodash');
const utils = require('./utils');
const execution = require('./execution');

const connectionArgs = require('graphql-relay').connectionArgs;

const connectionDefinitions = require('graphql-relay').connectionDefinitions;

const { GraphQLObjectType, GraphQLEnumType } = require('graphql');
const GraphQLID = require('graphql').GraphQLID;
const GraphQLString = require('graphql').GraphQLString;
const GraphQLBoolean = require('graphql').GraphQLBoolean;
const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLInt = require('graphql').GraphQLInt;

const globalIdField = require('graphql-relay').globalIdField;

const CustomGraphQLDateType = require('graphql-custom-datetype');
const GraphQLJSON = require('graphql-type-json');
// const FileType = require('./File/FileType');
const GeoPointType = require('./types/GeoPoint/GeoPointType');

const nodeDefinitions = require('./nodeDefinitions');


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

const types = {};
const typeDefs = {};

const exchangeTypes = {
  any: GraphQLJSON,
  Any: GraphQLJSON,
  Number: GraphQLInt,
  number: GraphQLInt,
  Object: GraphQLJSON,
  object: GraphQLJSON,
  GeoPoint: GeoPointType
};

const SCALARS = {
  any: GraphQLJSON,
  number: GraphQLFloat,
  string: GraphQLString,
  boolean: GraphQLBoolean,
  objectid: GraphQLID,
  date: CustomGraphQLDateType,
  object: GraphQLJSON,
  now: CustomGraphQLDateType,
  guid: GraphQLID,
  uuid: GraphQLID,
  uuidv4: GraphQLID
};

const PAGINATION = 'where: JSON, after: String, first: Int, before: String, last: Int';
const IDPARAMS = 'id: ID!';

// todo - find a cleaner way to do this? connectionDefinitions doesn't accept a thunk...
const connectionTypes = {};
const getConnection = (name) => {
  if (!connectionTypes[name]) {
    connectionTypes[name] = connectionDefinitions({ name, nodeType: getType(name) }).connectionType;
  }
  return connectionTypes[name];
};


const getType = (name) => {
  if (!types[name]) {
    const def = _.find(typeDefs, o => o.name === name);

    if (!def) {
      return null;
    }

    if (def.category === 'TYPE') {
      const fields = {};

      _.forEach(def._fields, (field, name) => {

        if (field.hidden === true) {
          return;
        }

        if (field.relation === true) {
          // fields[name].type = getConnection(field.gqlType);
          return;
        }

        fields[name] = field;

        // TODO: improve id check
        if (name === 'id') {
          fields[name] = globalIdField(name);
          return;
        }

        if (field.gqlType && !field.type) {
          fields[name].type = field.gqlType;
        }

        if (_.isString(field.type)) {
          fields[name].type = (field.list) ? getConnection(field.type) : getType(field.type);
        }

      });

      def.fields = fields;

      types[name] = new GraphQLObjectType(def);
    } else if (def.category === 'ENUM') {
      types[name] = new GraphQLEnumType(def);
    }
  }
  return types[name];
};


function getScalar(type) {
  return SCALARS[type.toLowerCase().trim()];
}

function toTypes(union) {
  return _.map(union, type => getScalar(type) ? getScalar(type) : type);
}

function mapProperty(model, property, modelName, propertyName) {
  if (property.deprecated) {
    return;
  }
  typeDefs[modelName]._fields[propertyName] = {
    required: property.required,
    hidden: model.definition.settings.hidden && model.definition.settings.hidden.indexOf(propertyName) !== -1
  };
  const currentProperty = typeDefs[modelName]._fields[propertyName];

  const typeName = `${modelName}_${propertyName}`;
  let propertyType = property.type;

  if (propertyType.name === 'Array') { // JSON Array
    currentProperty.list = true;
    currentProperty.gqlType = 'JSON';
    currentProperty.scalar = true;
    return;
  }

  if (_.isArray(property.type)) {
    currentProperty.list = true;
    propertyType = property.type[0];
  }

  let scalar = getScalar(propertyType.name);
  if (property.defaultFn) {
    scalar = getScalar(property.defaultFn);
  }
  if (scalar) {
    currentProperty.scalar = true;
    currentProperty.gqlType = scalar;
    if (property.enum) { // enum has a dedicated type but no input type is required

      const values = {};
      _.forEach(property.enum, (val) => { values[val] = { value: val }; });

      typeDefs[typeName] = {
        values,
        name: typeName,
        category: 'ENUM'
      };
      currentProperty.gqlType = typeName;
    }
  }

  if (propertyType.name === 'ModelConstructor' && property.defaultFn !== 'now') {
    currentProperty.gqlType = propertyType.modelName;
    const union = propertyType.modelName.split('|');
        // type is a union
    if (union.length > 1) { // union type
      typeDefs[typeName] = { // creating a new union type
        category: 'UNION',
        name: typeName,
        values: toTypes(union)
      };
    } else if (propertyType.settings && propertyType.settings.anonymous && propertyType.definition) {
      currentProperty.gqlType = typeName;
      typeDefs[typeName] = {
        category: 'TYPE',
        name: typeName,
        input: true,
        _fields: {}
      }; // creating a new type
      _.forEach(propertyType.definition.properties, (p, key) => {
        mapProperty(propertyType, p, typeName, key);
      });
    }
  }
}

function mapRelation(rel, modelName, relName) {
  typeDefs[modelName]._fields[relName] = {
    relation: true,
    embed: rel.embed,
    gqlType: rel.modelTo,
    args: PAGINATION,
    resolver: (obj, args, context) => execution.findRelated(rel, obj, args, context)
  };
}

function addRemoteHooks(model) {
  if (model.sharedClass && model.sharedClass.methods) {
    model.sharedClass.methods().map((method) => {
      if (method.name.indexOf('Stream') === -1 && method.name.indexOf('invoke') === -1) {
        let acceptingParams = '',
          returnType = GraphQLJSON;
        method.accepts.map((param) => {
          let paramType = '';
          if (typeof param.type === 'object') {
            paramType = GraphQLJSON;
          } else if (!SCALARS[param.type.toLowerCase()]) {
            paramType = `${param.type}Input`;
          } else {
            paramType = _.upperFirst(param.type);
          }
          if (param.arg) {
            acceptingParams += `${param.arg}: ${exchangeTypes[paramType] || paramType} `;
          }
        });
        if (method.returns && method.returns[0]) {
          if (!SCALARS[method.returns[0].type] && typeof method.returns[0].type !== 'object') {
            returnType = `${method.returns[0].type}`;
          } else {
            returnType = `${_.upperFirst(method.returns[0].type)}`;
            if (typeof method.returns[0].type === 'object') {
              returnType = GraphQLJSON;
            }
          }
        }
        typeDefs.Mutation._fields[`${method.name}${utils.singularModelName(model)}`] = {
          relation: true,
          args: acceptingParams,
          gqlType: `${exchangeTypes[returnType] || returnType}`
        };
      }
    });
  }
}

function mapRoot(model) {
  typeDefs.Viewer._fields[utils.pluralModelName(model)] = {
    // relation: true,
    // root: true,
    // name: model.modelName,
    args: connectionArgs,
    // gqlType: utils.connectionTypeName(model),
    type: model.modelName,
    list: true,
    resolver: (obj, args, context) => {
      execution.findAll(model, obj, args, context);
    }
  };

  typeDefs.Mutation._fields[`save${utils.singularModelName(model)}`] = {
    relation: true,
    args: `obj: ${utils.singularModelName(model)}Input!`,
    gqlType: utils.singularModelName(model),
    resolver: (context, args) => model.upsert(args.obj)
  };

  typeDefs.Mutation._fields[`delete${utils.singularModelName(model)}`] = {
    relation: true,
    args: IDPARAMS,
    gqlType: ` ${utils.singularModelName(model)}`,
    resolver: (context, args) => model.findById(args.id)
                .then(instance => instance.destroy())
  };
  addRemoteHooks(model);
}

// building types for all models and relationships
module.exports = function abstractTypes(models) {
    // building all models types & relationships


  // Build definition objects
  typeDefs.Viewer = {
    category: 'TYPE',
    name: 'Viewer',
    description: 'Viewer',
    // interfaces: () => [nodeDefinitions.nodeInterface],
    _fields: {}
  };
  typeDefs.Query = {
    category: 'TYPE',
    name: 'Query',
    _fields: {}
  };
  typeDefs.Mutation = {
    category: 'TYPE',
    name: 'Mutation',
    _fields: {}
  };

  _.forEach(models, (model) => {

    typeDefs[utils.singularModelName(model)] = {
      category: 'TYPE',
      input: true,
      description: `${model.modelName} model`,
      name: model.modelName,
      // interfaces: [nodeDefinitions.nodeInterface],
      _fields: {}
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


    if (model.shared) {
      mapRoot(model);
    }
  });

  // Create types from defs
  _.forEach(typeDefs, (def, name) => {
    getType(name);
  });

  return types;
};
