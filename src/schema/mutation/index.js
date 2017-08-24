'use strict';

const _ = require('lodash');
const { GraphQLObjectType } = require('graphql');

const getRemoteMethods = require('./getRemoteMethodMutations');

module.exports = function(models, options) {

    const modelFields = {};
    _.forEach(models, (model) => {

        const fields = Object.assign({}, getRemoteMethods(model));

        if (_.size(fields) === 0) {
            return;
        }

        if (options.modelGroups) {
            modelFields[model.modelName] = {
                resolve: (root, args, context) => ({}),
                type: new GraphQLObjectType({
                    name: `${model.modelName}Mutations`,
                    description: model.modelName,
                    fields
                })
            };
        } else {
            for (let key in fields) {
                modelFields[key] = {
                    resolve: (root, args, context) => ({}),
                    type: new GraphQLObjectType({
                        name: key,
                        description: fields[key].description,
                        fields: fields[key].args
                    })
                };
            }
        }

    });

    return new GraphQLObjectType({
        name: 'Mutation',
        fields: modelFields
    });
};