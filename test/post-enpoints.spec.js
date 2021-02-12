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
      const { testUsers, testPosts } = helpers.makePostsFixtures()

      beforeEach('insert posts', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db.into('posts').insert(testPosts.map(post => {
              const newPost = { ...post }
              delete newPost.username
              return newPost
            }))
          })
      })
      it('responds with 200 and all of the posts', () => {
        return supertest(app)
          .get('/api/posts')
          .expect(200, testPosts)
      })
    })
    context(`Given an XSS attack post`, () => {
      const { testUsers } = helpers.makePostsFixtures()
      const { maliciousPost, expectedPost } = helpers.makeMaliciousPost()

      beforeEach('insert malicious post', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db.into('posts').insert([maliciousPost])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/posts')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].title).to.eql(expectedPost.title)
            expect(res.body[0].content).to.eql(expectedPost.content)
          })
      })
    })
  })
  describe(`GET /api/posts/:post_id`, () => {
    context(`Given no post`, () => {
    const { testUsers } = helpers.makePostsFixtures()
      beforeEach(`insert users`, () => {
        return db
          .into('users')
          .insert(testUsers)
      })
      it(`responds with 404`, () => {
        const postId = 123456
        return supertest(app)
          .get(`/api/posts/${postId}`)
          .set('authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Post does not exist` } })
      })
    })
    context(`Given the post is in the database`, () => {
      const { testPosts } = helpers.makePostsFixtures()
      const { testUsers } = helpers.makePostsFixtures()
      beforeEach(`insert posts`, () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db.into('posts').insert(testPosts.map(post => {
              const newPost = { ...post }
              delete newPost.username
              return newPost
            }))
          })
      })
      it(`responds with 200 and the specified post`, () => {
        const postId = 2
        const expectedPost = testPosts[postId - 1]
        return supertest(app)
          .get(`/api/posts/${postId}`)
          .set('authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedPost)
      })
    })
  })
  describe(`POST /api/posts`, () => {
    context(`When creating a post with required fields`, () => {
      const { testUsers } = helpers.makePostsFixtures()
      const testUser = testUsers[0]
      beforeEach('insert users', () => {
        return db.into('users').insert(testUsers)
      })
      it('creates a post responding with 201 and new post', () => {
        const newPost = {
          title: 'There is poop everywhere!',
          content: 'My kid poops everywhere except the potty!'
        }
        return supertest(app)
          .post('/api/posts')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newPost)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(newPost.title)
            expect(res.body.content).to.eql(newPost.content)
            expect(res.body).to.have.property('id')
            expect(res.body.author_id).to.eql(testUser.id)
            expect(res.headers.location).to.eql(`/api/posts/${res.body.id}`)
            const expected = new Intl.DateTimeFormat('en-US').format(new Date())
            const actual = new Intl.DateTimeFormat('en-us').format(
              new Date(res.body.date_created)
            )
            expect(actual).to.eql(expected)
          })
          .then((res) => {
            supertest(app).get(`/api/posts/${res.body.id}`).expect(res.body)
          })
      })
    })
  })
})    