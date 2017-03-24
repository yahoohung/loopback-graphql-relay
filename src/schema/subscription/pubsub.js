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

    // Subscription ID
    const subId = this.subIdCounter = this.subIdCounter + 1;

    // Check Type
    const { type } = options;

    if (_.isNil(type)) {
      return Promise.reject(new Error('No object type'));
    }

    // Parse Query
    const query = options.Query;
    const subscription = query.subscribe();

    // Listeners
    const { create, update, enter, leave, delete: del } = options;

    if (create) {
      subscription.addListener('create', o => this.onUpdateMessage(subId, 'create', o));
    }

    if (update) {
      subscription.addListener('update', o => this.onUpdateMessage(subId, 'update', o));
    }

    if (enter) {
      subscription.addListener('enter', o => this.onUpdateMessage(subId, 'enter', o));
    }

    if (leave) {
      subscription.addListener('leave', o => this.onUpdateMessage(subId, 'leave', o));
    }

    if (del) {
      subscription.addListener('delete', o => this.onUpdateMessage(subId, 'delete', o));
    }

    subscription.on('close', () => this.unsubscribe(subId));

    // Packup
    this.subscriptions[subId] = [subscription, onMessage];
    return Promise.resolve(subId);
  }

  unsubscribe(subId) {
    this.subscriptions[subId][0].unsubscribe();
    delete this.subscriptions[subId];
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
