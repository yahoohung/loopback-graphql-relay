'use strict';

module.exports = function() {

};
'use strict';

const _ = require('lodash');

const {
	connectionArgs,
  connectionFromPromisedArray,
  mutationWithClientMutationId
} = require('graphql-relay');

const { GraphQLObjectType } = require('graphql');
const { getType, getConnection } = require('../types/type');
const { findAll } = require('../db');


function saveAndDeleteMethods(models) {
  const fields = {};

  _.forEach(models, (model) => {

    if (!model.shared) {
      return;
    }

    const saveFieldName = `save${model.modelName}`;
    const deleteFieldName = `delete${model.modelName}`;
    const InputModelName = `${model.modelName}Input`;

    fields[saveFieldName] = mutationWithClientMutationId({
      name: saveFieldName,
      inputFields: {
        obj: {
          type: getType(InputModelName)
        },
      },
      outputFields: {
        obj: {
          type: getType(model.modelName),
          resolve: o => o
        },
      },
      mutateAndGetPayload: ({ obj }) => model.upsert(Object.assign({}, obj))
    });

    fields[deleteFieldName] = mutationWithClientMutationId({
      name: deleteFieldName,
      inputFields: {
        obj: {
          type: getType(InputModelName)
        },
      },
      mutateAndGetPayload: ({ obj }) => model.findById(obj.id).then(instance => instance.destroy())
    });
  });

  return fields;
}

module.exports = function(models) {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: Object.assign(
      saveAndDeleteMethods(models)
    )
  });
};
