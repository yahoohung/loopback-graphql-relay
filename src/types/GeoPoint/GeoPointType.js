const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLFloat = require('graphql').GraphQLFloat;
const GraphQLNonNull = require('graphql').GraphQLNonNull;

const Type = new GraphQLObjectType({
  name: 'GeoPoint',
  description: 'A location',
  fields: () => ({
    lat: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lat
    },
    longitude: {
      lng: new GraphQLNonNull(GraphQLFloat),
      resolve: obj => obj.lng
    }
  })
});

module.exports = Type;
