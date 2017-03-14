const fromGlobalId = require('graphql-relay').fromGlobalId;
const nodeDefinitions = require('graphql-relay').nodeDefinitions;

const getType = require('./types').getType;
const getModels = require('./getModels');

module.exports = nodeDefinitions(
    (globalId, context, { rootValue }) => {
      const { type, id } = fromGlobalId(globalId);
      return;
    },
    (obj) => {
      const name = obj.modelName;
      // console.log(`nodeDefinitions  ${name} type found`, getType(name));
      return getType(name);
    }
  );
