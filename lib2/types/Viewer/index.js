// import _ from 'lodash';
// import Models from '../../index';
const _ = require('lodash');

const GraphQLObjectType = require('graphql').GraphQLObjectType;
const globalIdField = require('graphql-relay').globalIdField;

const { getType, getConnection } = require('../../types');
const nodeDefinitions = require('../../nodeDefinitions');


const ast = require('../../ast');
const getModels = require('../../getModels');
const execution = require('../../execution');

const fields = Object.assign({});

const SchemaType = new GraphQLObjectType({
  name: 'Viewer',
  description: 'Viewer',
  interfaces: () => [nodeDefinitions.nodeInterface],
  fields: () => {
    const models = getModels();
    const typeDefs = ast(models);

    const types = {
      id: globalIdField('User')
    };

    _.each(models, (model, name) => {
      const typeName = model.modelName;
      const fieldName = _.lowerFirst(model.pluralModelName);

      if (!model.shared) {
        return;
      }

      types[fieldName] = {
        type: getConnection(typeName, typeDefs),
        resolver: (root, args, context) => {
          return execution.findAll(model, root, args, context);
        }
      };
    });

    return types;
  },
  // resolver: (root, args, context) => {
  //   return null;
  // }
});



module.exports = SchemaType;
