const GraphQLInputObjectType = require('graphql').GraphQLInputObjectType;
const GraphQLNonNull = require('graphql').GraphQLNonNull;
const GraphQLObjectType = require('graphql').GraphQLObjectType;
const GraphQLString = require('graphql').GraphQLString;
const GraphQLBoolean = require('graphql').GraphQLBoolean;
const GraphQLInt = require('graphql').GraphQLInt;

function resolveMaybeThunk(maybeThunk) {
  return typeof maybeThunk === 'function' ? maybeThunk() : maybeThunk;
}

function defaultGetPayload(obj) {
  return obj;
}

module.exports = function subscriptionWithPayload({
  name,
  inputFields,
  outputFields,
  subscribeAndGetPayload = defaultGetPayload
}) {
  const inputType = new GraphQLInputObjectType({
    name: `${name}Input`,
    fields: () => Object.assign({},
			resolveMaybeThunk(inputFields),
			{ create: { type: GraphQLBoolean } },
			{ update: { type: GraphQLBoolean } },
			{ enter: { type: GraphQLBoolean } },
			{ leave: { type: GraphQLBoolean } },
			{ delete: { type: GraphQLBoolean } }
    )
  });

  const outputType = new GraphQLObjectType({
    name: `${name}Payload`,
    fields: () => Object.assign({},
			resolveMaybeThunk(outputFields),
			{ event: { type: GraphQLString } },
			{ clientSubscriptionId: { type: GraphQLInt } }
    )
  });

  return {
    type: outputType,
    args: {
      input: { type: new GraphQLNonNull(inputType) },
    },

    resolve(obj, { input }, context, info) {
      return Promise.resolve(subscribeAndGetPayload(obj.object, { input }, context, info))
				.then(payload => ({ clientSubscriptionId: obj.subscriptionId, event: obj.event, object: payload })
				);
    }
  };
};
