'use strict';

const expect = require('chai').expect;
const chai = require('chai')
    .use(require('chai-http'));
const server = require('../server/server');
const gql = require('graphql-tag');
const Promise = require('bluebird');
const cpx = require('cpx');

describe('query', () => {

  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));

  describe('Geo Type', () => {
    it('should contain a single object with location', () => {
      const query = gql `
        {
          viewer {
            googlemaps {
              edges {
                node {
                  id location {
                    lat
                    lng
                  }
                }
              }
            }
          }
        }`;
      return chai.request(server)
                .post('/graphql')
                .send({
                  query
                })
                .then((res) => {
                  expect(res).to.have.status(200);
                  const result = res.body.data;
                  expect(result.viewer.googlemaps.edges.length).to.equal(1);
                  expect(result.viewer.googlemaps.edges[0].node.location.lat).to.equal(10);
                  expect(result.viewer.googlemaps.edges[0].node.location.lng).to.equal(10);
                });
    });
  });
  describe('Geo Type', () => {
    it('should have location distance of 486 miles', () => {
      const query = gql `
        {
          viewer {
            googlemaps {
              edges {
                node {
                  id location {
                    distance: distanceTo(point: {lat: 5, lng: 5})
                  }
                }
              }
            }
          }
        }`;
      return chai.request(server)
                .post('/graphql')
                .send({
                  query
                })
                .then((res) => {
                  expect(res).to.have.status(200);
                  const result = res.body.data;
                  expect(result.viewer.googlemaps.edges.length).to.equal(1);
                  expect(result.viewer.googlemaps.edges[0].node.location.distance).to.equal(486.3956513042483);
                });
    });
  });

});
