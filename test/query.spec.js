'use strict';

const expect = require('chai').expect;
const chai = require('chai')
    .use(require('chai-http'));
const server = require('../server/server');
const gql = require('graphql-tag');
const Promise = require('bluebird');
const cpx = require('cpx');

describe('Queries', () => {

  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));

  describe('Single entity', () => {
    it('should execute a single query with relation', () => {
      const query = gql `
            query {
              viewer {
                orders(first: 1) {
                  edges {
                    node {
                      date
                      description
                      customer {
                        name
                        age
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
                });
    });
  });
  describe('Relationships', () => {
    it('should query related entity with nested relational data', () => {
      const query = gql `
                query {
                  viewer {
                    customers(first: 2) {
                      edges {
                        node {
                          name
                          age
                          orders {
                            edges {
                              node {
                                date
                                description
                                customer {
                                  name
                                  age
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
            `;
      return chai.request(server)
                .post('/graphql')
                .send({
                  query
                })
                .then((res) => {
                  expect(res).to.have.status(200);
                  expect(res.body.data.viewer.customers.edges.length).to.equal(2);
                });
    });
  });

  it('should have a total count of 7', () => {
    const query = gql `
      {
        viewer {
          customers {
            totalCount
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
              expect(res.body.data.viewer.customers.totalCount).to.equal(7);
            });
  });


  it('should sort books by name in descending order', () => {
    const query = gql `
      {
        viewer {
          books (order: "name DESC") {
            totalCount
            edges {
              node {
                id
                name
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
              expect(res.body.data.viewer.books.totalCount).to.equal(3);
              expect(res.body.data.viewer.books.edges[0].node.name).to.equal('Lame Book');
            });
  });

  describe('Remote hooks', () => {

    it('count', () => {
      const query = gql `
        {
          Author {
            count: AuthorCount
          }
        }`;
      return chai.request(server)
              .post('/graphql')
              .send({
                query
              })
              .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body.data.Author.count).to.be.above(7);
              });
    });


    it('exists', () => {
      const query = gql `
        {
          Author {
            exists: AuthorExists(id: 3) 
          }
        }`;
      return chai.request(server)
              .post('/graphql')
              .send({
                query
              })
              .then((res) => {
                expect(res).to.have.status(200);
                expect(res.body.data.Author.exists).to.equal(true);
              });
    });


    it('findOne', () => {
      const query = gql `
        {
          Author {
            AuthorFindOne(filter: { where: {id: 3}}) {
              id
              first_name
              last_name
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
                expect(res.body.data.Author.AuthorFindOne.first_name).to.equal('Virginia');
                expect(res.body.data.Author.AuthorFindOne.last_name).to.equal('Wolf');
              });
    });


    it('findById', () => {
      const query = gql `
        {
          Author {
            AuthorFindById(id: 3) {
              id
              first_name
              last_name
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
                expect(res.body.data.Author.AuthorFindById.first_name).to.equal('Virginia');
                expect(res.body.data.Author.AuthorFindById.last_name).to.equal('Wolf');
              });
    });


    it('should call a remoteHook and return the related data', () => {
      const query = gql `
        {
          Customer {
            CustomerFindById(id: 1) {
              name
              age
              billingAddress {
                id
              }
              emailList {
                id
              }
              accountIds
              orders {
                edges {
                  node {
                    id
                    date
                    description
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
                expect(res).to.have.deep.property('body.data.Customer.CustomerFindById.name');
                expect(res).to.have.deep.property('body.data.Customer.CustomerFindById.age');
                expect(res).to.have.deep.property('body.data.Customer.CustomerFindById.orders.edges[0].node.id');
                expect(res).to.have.deep.property('body.data.Customer.CustomerFindById.orders.edges[0].node.description');
              });
    });


  });
});
