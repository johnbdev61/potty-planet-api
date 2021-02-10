const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Posts Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanAllTables(db))

  afterEach('cleanup', () => helpers.cleanAllTables(db))

  describe(`GET /api/posts`, () => {
    context(`Given no posts`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/posts')
          .expect(200, [])
      })
    })
    context('Given there are posts in the database', () => {
      const { testUsers, testPosts, testComments } = helpers.makePostsFixtures()

      beforeEach('insert posts', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db.into('posts').insert(testPosts)
          })
          .then(() => {
            return db.into('comments').insert(testComments)
          })
      })
      it('responds with 200 and all of the posts', () => {
        const expectedPosts = testPosts.map(post =>
            helpers.makeExpectedPost(
              testUsers,
              post,
              testComments,
            )
          )
          return supertest(app)
              .get('/api/posts')
              .expect(200, expectedPosts)
      })
    })
  })
})    