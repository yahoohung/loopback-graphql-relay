const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLString = require('graphql').GraphQLString;

const Type = new GraphQLObjectType({
  name: 'File',
  description: 'A File',
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: obj => obj.name()
    },
    url: {
      type: GraphQLString,
      resolve: obj => obj.url()
    }
  })
});

module.exports = Type;
