const _ = require('lodash');

const { GraphQLObjectType } = require('graphql');
const { globalIdField } = require('graphql-relay');
const getType = require('./index.js');
const execution = require('../execution');
const getModels = require('../getModels');

function generateType(name, typeDef) {

  const model = _.find(getModels(), o => o.modelName === name);

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
    },
    resolver: (root, args, context) => execution.findAll(model, root, args, context)
  });
}

module.exports = generateType;
