const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Comments Endpoints', function () {
  let db

  const { testPosts, testUsers, testComments } = helpers.makePostsFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: {
        connectionString: process.env.TEST_DB_URL,
      },
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
        return db.into('comments').insert(
          testComments.map((comment) => {
            const newComment = { ...comment }
            delete newComment.user
            newComment.date_created = new Date(newComment.date_created)
            return newComment
          })
        )
      })
      it(`responds with 200 and the requested comments`, () => {
        return supertest(app)
          .get('/api/posts/1/comments')
          .set('authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(
            200,
            testComments
              .filter((comment) => comment.post_id == 1)
              .map((comment) => {
                comment.user = testUsers.find(
                  (user) => user.id == comment.user_id
                )
                return {
                  id: comment.id,
                  comment: comment.comment,
                  date_created: comment.date_created.toISOString(),
                  user: { id: comment.user.id, username: comment.user.username, }
                }
              })
          )
      })
    })
  })
  describe(`POST /api/posts/1/comments`, () => {
    context(`When creating a post with required fields`, () => {
      it('creates a post responding with 201 and new post', () => {
        this.retries(3)
        const { testComments } = helpers.makePostsFixtures()
        const testUser = testUsers[0]
        console.log('TEST USER', testUser)
        const testComment = testComments[0]
        return supertest(app)
          .post(`/api/comments`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(testComment)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property('id')
            expect(res.body.comment).to.eql(testComment.comment)
            expect(res.body.post_id).to.eql(testComment.post_id)
            expect(res.headers.location).to.eql(`/api/comments/${res.body.id}`)
            const expected = new Date().toLocaleString('en', {
              timeZone: 'UTC',
            })
            const actual = new Date(res.body.date_created).toLocaleString()
            expect(actual).to.eql(expected)
          })
          .then((res) => {
            supertest(app).get(`/api/comments/${res.body.id}`).expect(res.body)
          })
      })
    })
    context('When creating a comment without required field', () => {
      const requiredFields = ['comment', 'post_id']

      requiredFields.forEach((field) => {
        const testPost = testPosts[0]
        const testUser = testUsers[0]
        const newComment = {
          comment: 'Test new comment',
          post_id: testPost.id,
        }

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete newComment[field]

          return supertest(app)
            .post('/api/comments')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(newComment)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        })
      })
    })
  })
})
