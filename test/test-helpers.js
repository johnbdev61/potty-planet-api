const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


function makeUsersArray() {
  return [
    {
      id: 1,
      username: 'test-user-1',
      password: 'password',
    },
    {
      id: 2,
      username: 'test-user-2',
      password: 'password',
    },
    {
      id: 3,
      username: 'test-user-3',
      password: 'password',
    },
    {
      id: 4,
      username: 'test-user-4',
      password: 'password',
    },
  ]
}

function makePostsArray(users) {
  return [
    {
      id: 1,
      title: 'First test post!',
      author_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      content:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
    },
    {
      id: 2,
      title: 'Second test post!',
      author_id: users[1].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      content:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
    },
    {
      id: 3,
      title: 'Third test post!',
      author_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      content:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
    },
    {
      id: 4,
      title: 'Fourth test post!',
      author_id: users[3].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      content:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
    },
  ]
}

function makeCommentsArray(users, articles) {
  return [
    {
      id: 1,
      comment: 'First test comment!',
      post_id: articles[0].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      comment: 'Second test comment!',
      post_id: articles[0].id,
      user_id: users[1].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      comment: 'Third test comment!',
      post_id: articles[0].id,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 4,
      comment: 'Fourth test comment!',
      post_id: articles[0].id,
      user_id: users[3].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 5,
      comment: 'Fifth test comment!',
      post_id: articles[articles.length - 1].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 6,
      comment: 'Sixth test comment!',
      post_id: articles[articles.length - 1].id,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 7,
      comment: 'Seventh test comment!',
      post_id: articles[3].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
  ]
}

function makeExpectedPost(users, post, comments = []) {
  const author = users.find((user) => user.id === post.author_id)

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    date_created: post.date_created.toISOString(),
    author: {
      id: author.id,
      username: author.username,
      date_created: author.date_created.toISOString(),
      date_modified: author.date_modified || null,
    },
  }
}

function makeExpectedComments(users, postId, comments) {
  const expectedComments = comments.filter(
    (comment) => comment.post_id === postId
  )

  return expectedComments.map((comment) => {
    const commentUser = users.find((user) => user.id === comment.user_id)
    return {
      id: comment.id,
      comment: comment.comment,
      date_created: comment.date_created.toISOString(),
      user: {
        id: commentUser.id,
        username: commentUser.username,
        date_created: commentUser.date_created.toISOString(),
      },
    }
  })
}

function makeMaliciousPost(user) {
  const maliciousPost = {
    id: 666,
    date_created: new Date(),
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    author_id: user.id,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
  }
  const expectedPost = {
    ...makeExpectedPost([user], maliciousArticle),
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  }
  return {
    maliciousArticle,
    expectedArticle,
  }
}

function makePostsFixtures() {
  const testUsers = makeUsersArray()
  const testPosts = makePostsArray(testUsers)
  const testComments = makeCommentsArray(testUsers, testPosts)
  return { testUsers, testPosts, testComments}
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.username,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}

function cleanAllTables(db) {
  return db.raw(`TRUNCATE posts, comments, users RESTART IDENTITY CASCADE;`)
}

module.exports = {
  makeUsersArray,
  makePostsArray,
  makeCommentsArray,
  makeExpectedPost,
  makeExpectedComments,
  makeMaliciousPost,
  makePostsFixtures,
  makeAuthHeader,
  cleanAllTables,
}