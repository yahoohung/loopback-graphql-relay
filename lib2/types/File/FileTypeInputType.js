const GraphQLString = require('graphql').GraphQLString;
const GraphQLNonNull = require('graphql').GraphQLNonNull;
const GraphQLInputObjectType = require('graphql').GraphQLInputObjectType;

const InputType = new GraphQLInputObjectType({
  name: 'FileInput',
  fields: {
    base64: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: GraphQLString }
  }
});

module.exports = InputType;
