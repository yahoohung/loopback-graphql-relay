'use strict';

const _ = require('lodash');

const { GraphQLObjectType } = require('graphql');
const { getType } = require('../../types/type');
const getRemoteMethodQueries = require('./getRemoteMethodQueries');
const generateViewer = require('./viewer');

function generateModelFields(models, modelGroups) {

    const modelFields = {};
    _.forEach(models, (model) => {

        const fields = Object.assign({},
            getRemoteMethodQueries(model)
        );

        if (_.size(fields) === 0) {
            return;
        }

        if (modelGroups) {
            modelFields[model.modelName] = {
                resolve: (root, args, context) => ({}),
                type: new GraphQLObjectType({
                    name: `${model.modelName}Queries`,
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

    return modelFields;
}

module.exports = function(models, options) {
    const fields = !options.viewer ? Object.assign({}, {
            node: getType('node')
        },
        generateModelFields(models, options.modelGroups)
    ) : Object.assign({}, {
            node: getType('node'),
            viewer: generateViewer(models, options)
        },
        generateModelFields(models, options.modelGroups)
    );


    return new GraphQLObjectType({
        name: 'Query',
        fields
    });
};