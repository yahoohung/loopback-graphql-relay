const _ = require('lodash');

const connectionDefinitions = require('graphql-relay').connectionDefinitions;

const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLID = require('graphql').GraphQLID;
const GraphQLString = require('graphql').GraphQLString;
const GraphQLBoolean = require('graphql').GraphQLBoolean;
const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLInt = require('graphql').GraphQLInt;

const globalIdField = require('graphql-relay').globalIdField;

const CustomGraphQLDateType = require('graphql-custom-datetype');
const GraphQLJSON = require('graphql-type-json');
const FileType = require('./File/FileType');
const GeoPointType = require('./GeoPoint/GeoPointType');

const ast = require('../ast');
const getModels = require('../getModels');
// const generateType = require('./generateType');
// const execution = require('../execution');

/**
 * Generates an graphql.js object type based on the name and definition
 * @param {*} name 
 * @param {*} typeDef 
 */
function generateType(name, typeDef) {

  // const model = _.find(getModels(), o => o.modelName === name);

  return new GraphQLObjectType({
    name,
    description: `${name} model`,
    fields: () => {

      const fields = {};

      _.forEach(typeDef.fields, (field, name) => {
        const f = {};

        if (field.hidden === true) {
          return;
        }

        // TODO: improve id check
        if (field.name === 'id') {
          fields[name] = globalIdField(name);
          return;
        }

        if (field.scalar === true) {
          f.type = getType(field.gqlType);

          if (f.type) {
            fields[name] = f;
          }
        }

      });

      return fields;
    }
  });
}

function getType(type, typeDefs) {

  switch (type) {
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

    case 'File':
      return FileType;

    case 'GeoPoint':
      return GeoPointType;

    case 'Json':
    case 'JSON':
      return GraphQLJSON;

    case 'Viewer':
      return require('./Viewer');

    default:

      if (typeDefs && typeDefs[type]) {
        return generateType(type, typeDefs[type]);
      }
      return null;
  }
}

// todo - find a cleaner way to do this? connectionDefinitions doesn't accept a thunk...
const connectionTypes = {};
const getConnection = (name, typeDefs) => {
  if (!connectionTypes[name]) {
    connectionTypes[name] = connectionDefinitions({ name, nodeType: getType(name, typeDefs) }).connectionType;
  }
  return connectionTypes[name];
};

function getModelTypes() {
  const models = getModels();
  const typeDefs = ast(models);

  const types = {};

  _.each(models, (model, name) => {
    const typeName = model.modelName;
    const fieldName = model.pluralModelName;

    types[fieldName] = getType(typeName, typeDefs);
  });

  return types;
}

module.exports = { getType, getConnection, getModelTypes };
