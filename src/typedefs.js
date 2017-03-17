'use strict';

const _ = require('lodash');

const {
	GraphQLObjectType,
	GraphQLEnumType,
	GraphQLList,
	GraphQLID,
	GraphQLString,
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLInt
} = require('graphql');

const {
	globalIdField,
	fromGlobalId,
	nodeDefinitions: relayNodeDefinitions,
	connectionArgs: relayConnectionArgs,
	connectionDefinitions,
	connectionFromPromisedArray
} = require('graphql-relay');

const CustomGraphQLDateType = require('graphql-custom-datetype');
const GraphQLJSON = require('graphql-type-json');

const execution = require('./execution');
const types = {};
let typeObjs = {};
let models = {};
let nodeDefinitions = {};
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

    const idField = _.find(def.fields, (f, i) => i === 'id');
    if (idField) {
      def.interfaces = [nodeDefinitions.nodeInterface];
    }

    if (def.category === 'TYPE') {

      def._fields = Object.assign({}, def.fields);
      def.fields = null;

      def.fields = () => {
        const fields = {};

        _.forEach(def._fields, (field, fieldName) => {

          if (field.hidden === true) {
            return;
          }

          fields[fieldName] = { fieldName };

					// TODO: improve id check
          if (fieldName === 'id') {
            fields[fieldName] = globalIdField(name);
            return;
          }

          if (field.relation === true) {
            fields[fieldName].args = connectionArgs;
            fields[fieldName].type = getConnection(field.gqlType);
          } else if (field.list) {
						// fields[fieldName].type = getConnection(field.gqlType);
            fields[fieldName].type = new GraphQLList(getType(field.gqlType));
          } else {
            fields[fieldName].type = getType(field.gqlType);
          }

					// If no resolver available, add one
          if (_.isNil(field.resolver)) {
            fields[fieldName].resolve = (obj, args, context) => {

              if (field.relation) {
                return connectionFromPromisedArray(execution.findAll(models[field.gqlType], obj, args, context), args);
              }

              return _.isNil(obj[fieldName]) ? null : obj[fieldName];
            };
          } else {
            fields[fieldName].resolve = field.resolver;
          }

          // if (field.gqlType === 'node') {
          //   fields[fieldName] = fields[fieldName].type;
          // }

          fields[fieldName] = Object.assign(field, fields[fieldName]);
        });

        return fields;
      };

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

function generateNodeDefinitions(models) {
  let typeName;

  nodeDefinitions = relayNodeDefinitions(
    (globalId, context, { rootValue }) => {
      const { type, id } = fromGlobalId(globalId);
      typeName = type;
      return models[type].findById(id);
    },
    obj => getType(typeName)
  );
}

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

    case 'node':
      types[name] = nodeDefinitions.nodeField;
      return types[name];

    default:

      if (typeObjs && typeObjs[name]) {
        return generateType(name);
      }
      return null;
  }
};

const connectionArgs = Object.assign({
  where: { type: getType('JSON') },
}, relayConnectionArgs);

module.exports = function generateTypeDefs(_typeObjs, _models) {

  typeObjs = _typeObjs;
  models = {};

  generateNodeDefinitions(models);

  _.forEach(_models, (model) =>  {
    models[model.modelName] = model;
  });

	// Create types from defs
  _.forEach(typeObjs, (def, name) => {
    getType(name);
  });

  return types;
};
