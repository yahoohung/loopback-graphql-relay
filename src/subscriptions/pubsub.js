// const PubSub = require('graphql-subscriptions').PubSub;
const _ = require('lodash');

class PubSub {

  constructor() {
    this.subscriptions = {};
    this.subIdCounter = 0;

    this.onUpdateMessage = this.onMessage.bind(this);
  }

  publish(triggerName, payload) { // eslint-disable-line class-methods-use-this
    return true;
  }

  subscribe(triggerName, onMessage, options) {

    const me = this;

    // Subscription ID
    const subId = this.getSubscriptionId(options.clientSubscriptionId || _.random(1, 99999));

    // Check Type
    const { model } = options;

    if (_.isNil(model)) {
      return Promise.reject(new Error('No related model found for this subscription'));
    }

    const { create, update, remove: rmv } = options;

    // Stream
    model.createChangeStream((err, stream) => {
      // changes.pipe(es.stringify()).pipe(process.stdout);

      // Listeners
      stream.on('data', (data) => {

        switch (data.type) {
          case 'create':
            if (create) {
              me.onUpdateMessage(subId, 'create', data);
            }
            break;

          case 'update':
            if (update) {
              me.onUpdateMessage(subId, 'update', data);
            }
            break;

          case 'remove':
            if (rmv) {
              me.onUpdateMessage(subId, 'remove', data);
            }
            break;

          default:
            break;
        }
      });

      stream.on('end', () => this.unsubscribe(subId));
      stream.on('error', () => this.unsubscribe(subId));

      this.subscriptions[subId] = [stream, onMessage];
    });

    // Packup
    return Promise.resolve(subId);
  }

  unsubscribe(subId) {
    this.subscriptions[subId][0].destroy();
    delete this.subscriptions[subId];
  }

  getSubscriptionId(id) {
    if (!this.subscriptions[id]) {
      return id;
    }

    return this.getSubscriptionId(id + 1);
  }

  onMessage(subId, event, object) {
    const payload = {
      subscriptionId: subId,
      event,
      object
    };

    try {
      this.subscriptions[subId][1](payload);
      // logger.info('subscription sent', payload);
    } catch (e) {
      // logger.info(new Error('An error occured while try to broadcast subscription.'));
    }
  }
}

module.exports = PubSub;
