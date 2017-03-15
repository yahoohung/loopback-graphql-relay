const _ = require('lodash');
const execution = require('./execution');
const { connectionArgs } = require('graphql-relay');


// building types for Viewer
module.exports = function abstractTypes(models) {

  const Viewer = {
    category: 'TYPE',
    name: 'Viewer',
    description: 'Viewer',
		// interfaces: () => [nodeDefinitions.nodeInterface],
    fields: {}
  };

  _.forEach(models, (model) => {

    if (!model.shared) {
      return;
    }

    Viewer.fields[_.lowerFirst(model.pluralModelName)] = {
      relation: true,
      // root: true,
      // name: model.modelName,
      args: connectionArgs,
			// gqlType: utils.connectionTypeName(model),
      gqlType: model.modelName,
      list: true
    };
  });

  return Viewer;
};
