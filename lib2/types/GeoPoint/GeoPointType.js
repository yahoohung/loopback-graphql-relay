const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLNonNull = require('graphql').GraphQLNonNull;

const Type = new GraphQLObjectType({
  name: 'GeoPoint',
  description: 'A location',
  fields: () => ({
    latitude: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.latitude
    },
    longitude: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.longitude
    }
  })
});

module.exports = Type;
