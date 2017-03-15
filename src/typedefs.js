'use strict';

const _ = require('lodash');

const {
	GraphQLObjectType,
	GraphQLEnumType,
	GraphQLID,
	GraphQLString,
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLInt
} = require('graphql');

const {
	globalIdField,
	connectionDefinitions,
	connectionFromArray,
	connectionFromPromisedArray
} = require('graphql-relay');

const CustomGraphQLDateType = require('graphql-custom-datetype');
const GraphQLJSON = require('graphql-type-json');

const execution = require('./execution');

const types = {};
let typeObjs = {};
let models = {};
const connectionTypes = {};

/**
 * Get or create connection object
 * @param {*} name
 */
const getConnection = (name) => {
  if (!connectionTypes[name]) {
    connectionTypes[name] = connectionDefinitions({ name, nodeType: getType(name) }).connectionType;
  }
  return connectionTypes[name];
};

/**
 * Dynamically generate type based on the definition in typeObjs
 * @param {*} name
 */
const generateType = (name) => {
  if (!types[name]) {
    const def = _.find(typeObjs, (o, n) => n === name);

    if (!def) {
      return null;
    }

    def.name = name;

    if (def.category === 'TYPE') {
      const fields = {};

      _.forEach(def.fields, (field, fieldName) => {

        if (field.hidden === true) {
          return;
        }

        if (field.relation === true) {
          // fields[name].type = getConnection(field.gqlType);
          return;
        }

        fields[fieldName] = { fieldName };

        // TODO: improve id check
        if (fieldName === 'id') {
          fields[fieldName] = globalIdField(name);
          return;
        }

        if (field.list) {
          fields[fieldName].type = getConnection(field.gqlType);
        } else {
          fields[fieldName].type = getType(field.gqlType);
        }

				// If no resolver available, add one
        if (!field.resolve) {
          fields[fieldName].resolve = (obj, args, context) => {

            const relation = (field.rel && field.rel.type) ? field.rel.type : null;

            if (field.scalar || relation === 'embedsOne') {
              return _.isNil(obj[fieldName]) ? null : obj[fieldName];
            }

            if (relation === 'embedsMany') {
              const array = _.isNil(obj[fieldName]) ? [] : obj[fieldName];
              return connectionFromArray(array, args);
            }

            if (field.list) {
              return connectionFromPromisedArray(execution.findAll(models[field.gqlType], obj, args, context), args);
            }

            return null;
          };
        }

        fields[fieldName] = Object.assign(field, fields[fieldName]);
      });

      def.fields = fields;

      types[name] = new GraphQLObjectType(def);
    } else if (def.category === 'ENUM') {
      const values = {};
      _.forEach(def.values, (val) => { values[val] = { value: val }; });
      def.values = values;

      types[name] = new GraphQLEnumType(def);
    }
  }
  return types[name];
};

/**
 * Get a type by name
 * @param {*} name
 */
const getType = (name) => {

  if (types[name]) {
    return types[name];
  }

  switch (name) {
    case 'ID':
      return GraphQLID;

    case 'String':
      return GraphQLString;

    case 'Boolean':
      return GraphQLBoolean;

    case 'Float':
      return GraphQLFloat;

    case 'Int':
      return GraphQLInt;

    case 'Date':
      return CustomGraphQLDateType;

    // case 'File':
    //   return FileType;

    // case 'GeoPoint':
    //   return GeoPointType;

    case 'Json':
    case 'JSON':
      return GraphQLJSON;

    // case 'Viewer':
    //   return require('./Viewer');

    default:

      if (typeObjs && typeObjs[name]) {
        return generateType(name);
      }
      return null;
  }
};

module.exports = function generateTypeDefs(_typeObjs, _models) {

  typeObjs = _typeObjs;
  models = {};

  _.forEach(_models, (model) =>  {
    models[model.modelName] = model;
  });

	// Create types from defs
  _.forEach(typeObjs, (def, name) => {
    getType(name);
  });

  return types;
};
