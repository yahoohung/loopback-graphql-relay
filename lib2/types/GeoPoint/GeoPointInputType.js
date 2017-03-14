const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLNonNull = require('graphql').GraphQLNonNull;
const GraphQLInputObjectType = require('graphql').GraphQLInputObjectType;

const InputType = new GraphQLInputObjectType({
  name: 'GeoPointInput',
  fields: {
    latitude: { type: new GraphQLNonNull(GraphQLFloat) },
    longitude: { type: new GraphQLNonNull(GraphQLFloat) }
  }
});

module.exports = InputType;
