const _ = require('lodash');

const {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType
} = require('graphql');

const { getType } = require('../types/type');

function resolveMaybeThunk(maybeThunk) {
  return typeof maybeThunk === 'function' ? maybeThunk() : maybeThunk;
}

function defaultGetPayload(obj) {
  return (obj.data) ? obj.data.toJSON() : null;
}

module.exports = function subscriptionWithPayload({
  name,
  model,
  subscribeAndGetPayload = defaultGetPayload
}) {
  const inputType = new GraphQLInputObjectType({
    name: `${name}SubscriptionInput`,
    fields: () => Object.assign({},
			// resolveMaybeThunk(inputFields),
      { options: { type: getType('JSON') } },
			{ create: { type: getType('Boolean') } },
			{ update: { type: getType('Boolean') } },
			{ remove: { type: getType('Boolean') } }
    )
  });

  const outputFields = {};
  outputFields[`${_.lowerCase(model.modelName)}`] = {
    type: getType(model.modelName),
    resolve: o => o
  };

  const outputType = new GraphQLObjectType({
    name: `${name}SubscriptionPayload`,
    fields: () => Object.assign({},
			resolveMaybeThunk(outputFields),
			{ where: { type: getType('JSON') } },
			{ type: { type: getType('String') } },
      { target: { type: getType('String') } },
			{ clientSubscriptionId: { type: getType('Int') } }
    )
  });

  return {
    type: outputType,
    args: {
      input: { type: new GraphQLNonNull(inputType) },
    },

    resolve(obj, { input }, context, info) {
      return Promise.resolve(subscribeAndGetPayload(obj.object, { input }, context, info))
				.then(payload => ({
          clientSubscriptionId: obj.subscriptionId,
          where: obj.object.where,
          type: obj.object.type,
          target: obj.object.target,
          object: payload })
				);
    }
  };
};
