'use strict';

const expect = require('chai').expect;
const chai = require('chai')
    .use(require('chai-http'));
const server = require('../server/server');
const gql = require('graphql-tag');
const Promise = require('bluebird');
const cpx = require('cpx');

describe('Relations', () => {

  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));

  describe('hasManyAndBelongsToMany', () => {
    it('Author should have two books', () => {
      const query = gql `
        {
          node(id: "QXV0aG9yOjEw") {
            ... on Author {
              id
              first_name
              last_name
              books(last: 1) {
                totalCount
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
                edges {
                  node {
                    id
                    name
                  }
                  cursor
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
                  expect(result.node.first_name).to.equal('Cool');
                  expect(result.node.books.totalCount).to.equal(2);
                  expect(result.node.books.edges.length).to.equal(1);
                  expect(result.node.books.edges[0].node.name).to.equal('Lame Book');
                });
    });
  });

  describe('hasMany', () => {
    it('should have one author and two notes', () => {
      const query = gql `
        {
          viewer {
            authors (first: 1) {
              edges {
                node {
                  id
                  first_name
                  last_name
                  notes {
                    edges {
                      node {
                        id
                        title
                      }
                    }
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
                  expect(result.viewer.authors.edges.length).to.equal(1);
                  expect(result.viewer.authors.edges[0].node.first_name).to.equal('Virginia');
                  expect(result.viewer.authors.edges[0].node.notes.edges.length).to.equal(2);
                });
    });
  });

  describe('referencesMany', () => {
    it('should have one author and two friendIds', () => {
      const query = gql `
        {
          node(id: "QXV0aG9yOjg=") {
            ... on Author {
              id
              first_name
              last_name
              friendIds
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
                  expect(result.node.first_name).to.equal('Jane');
                  expect(result.node.friendIds.length).to.equal(2);
                });
    });
  });


  describe('embedsMany', () => {
    it('should have one book and two links', () => {
      const query = gql `
        {
          viewer {
            books {
              edges {
                node {
                  id
                  name
                  links {
                    id
                    name
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
                  expect(result.viewer.books.edges.length).to.equal(3);
                  expect(result.viewer.books.edges[0].node.name).to.equal('Book 1');
                  expect(result.viewer.books.edges[0].node.links.length).to.equal(2);
                });
    });
  });

  describe('embedsOne', () => {
    it('should have a billingAddress', () => {
      const query = gql `
        {
          node(id: "Q3VzdG9tZXI6Ng==") {
            ... on Customer {
              id
              billingAddress {
                id
                street
                city
                state
                zipCode
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
                  expect(result.node.billingAddress.zipCode).to.equal('95131');
                });
    });
  });

  describe('belongsTo', () => {
    it('should have a note and its owner', () => {
      const query = gql `
        {
          node(id: "Tm90ZToy") {
            ... on Note {
              id
              title
              author {
                id
                first_name
                last_name
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
                  expect(result.node.title).to.equal('Who is Afraid');
                  expect(result.node.author.first_name).to.equal('Virginia');
                });
    });
  });


  describe('hasOne', () => {
    it('should have orders with its customer', () => {
      const query = gql `
        {
          viewer {
            orders(first: 1) {
              edges {
                node {
                  id
                  description
                  customer {
                    id
                    name
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
                  expect(result.viewer.orders.edges.length).to.equal(1);
                  expect(result.viewer.orders.edges[0].node.customer.name).to.equal('Customer A');
                });
    });
  });
});
