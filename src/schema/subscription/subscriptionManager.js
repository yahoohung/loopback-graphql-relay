const SubscriptionManager = require('graphql-subscriptions').SubscriptionManager;
const _ = require('lodash');

const convertObjToQuery = require('../parseHelpers').convertObjToQuery;

module.exports = function(schema, pubsub) {
  return new SubscriptionManager({
    schema,
    pubsub,

    // setupFunctions maps from subscription name to a map of channel names and their filter functions
    // in this case it will subscribe to the commentAddedChannel and re-run the subscription query
    // every time a new comment is posted whose repository name matches args.repoFullName.
    setupFunctions: {
      assetSubscription: (options, args) => ({
        asset: {
          // filter: comment => comment.repository_name === args.repoFullName,
          channelOptions: getOptions('Asset', args)
        }
      }),
    },
  });
};

function getOptions(modelName, args) {
  const basicOpts = {
    create: (!_.isNil(args.input.create)) ? args.input.create : false,
    update: (!_.isNil(args.input.update)) ? args.input.update : false,
    enter: (!_.isNil(args.input.enter)) ? args.input.enter : false,
    leave: (!_.isNil(args.input.leave)) ? args.input.leave : false,
    delete: (!_.isNil(args.input.delete)) ? args.input.delete : false,
  };

  // const Object = Parse.Object.extend(modelName);
  // const query = new Parse.Query(Object);

  // convertObjToQuery(modelName, args.input, query);

  // basicOpts.Query = query;
  // basicOpts.type = modelName;

  return basicOpts;
}
