const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Comments Endpoints', function() {
  let db

  const {
    testPosts,
    testUsers,
    testComments,
  } = helpers.makePostsFixtures()

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

   beforeEach('insert posts', () => {
     return db
       .into('users')
       .insert(testUsers)
       .then(() => {
         return db.into('posts').insert(
           testPosts.map((post) => {
             const newPost = { ...post }
             delete newPost.username
             return newPost
           })
         )
       })
   })

  describe(`GET /api/posts`, () => {
    context('Given no comments', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
        .get('/api/posts/1/comments')
        .set('authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200, [])
      })
    })
    context('Given there are comments in the database', () => {
      beforeEach('insert comments', () => {
        return db
          .into('comments')
          .insert(
            testComments.map((comment) => {
              const newComment = { ...comment }
              delete newComment.user //THIS MIGHT BE PART OF THE PROBLEM?
              return newComment
            })
          )
      })
      it(`responds with 200 and the requested comments`, () => {
        return supertest(app)
          .get('/api/posts/1/comments')
          .set('authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, testComments.filter(comment => comment.post_id == 1)) //TODO: FIX BROKEN TEST
      })
    })
  })

})