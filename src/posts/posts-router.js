const express = require('express')
const PostsService = require('./posts-service')
const { requireAuth } = require('../middleware/jwt-auth')
const xss = require('xss')

const postsRouter = express.Router()
const jsonBodyParser = express.json()

postsRouter
  .route('/')
  .get(async (req, res, next) => {
    PostsService.getAllPosts(req.app.get('db'))
      .then(async (posts) => {
        if (posts.length !== 0) {
          return posts.map((post, i) => ({
            id: post.id,
            title: xss(post.title),
            author_id: post.author_id,
            username: post.username,
            content: xss(post.content),
            is_resolved: post.is_resolved,
            date_created: post.date_created,
          }))
        }
      })
      .then((posts) => {
        return res.json(posts || [])
      })
      .catch(next)
  })
  .post(jsonBodyParser, requireAuth, (req, res, next) => {
    const { title, content } = req.body
    let newPost = {
      title,
      content,
      author_id: req.user.id,
    }
    for (const [key, value] of Object.entries(newPost)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` },
        })
      }
    }
    newPost = {
      title: xss(title),
      content: xss(content),
      is_resolved: false,
      author_id: req.user.id,
    }

    PostsService.insertPost(req.app.get('db'), newPost)
      .then((post) => {
        console.log('POST', post)
        res.status(201).location(`/api/posts/${post.id}`).json(post)
      })
      .catch(next)
  })

postsRouter
  .route('/:post_id')
  .all(requireAuth)
  .all((req, res, next) => {
    console.log(req.params)
    PostsService.getById(req.app.get('db'), req.params.post_id)
      .then((post) => {
        if (!post) {
          return res.status(404).json({
            error: { message: `Post does not exist` },
          })
        }
        req.post = post
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(req.post)
  })
  .delete(jsonBodyParser, requireAuth, (req, res, next) => {
    PostsService.deletePost(req.app.get('db'), req.params.post_id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonBodyParser, requireAuth, (req, res, next) => {
    const { is_resolved } = req.body
    const postToUpdate = { is_resolved }
    PostsService.updatePost(
      req.app.get('db'),
      req.params.post_id,
      postToUpdate
    )
    .then(() => {
      res.status(204).end()
    })
    .catch(next)
  })

postsRouter
  .route('/:post_id/comments/')
  .all(requireAuth)
  .all(checkPostExists)
  .get((req, res, next) => {
    PostsService.getCommentsForPost(req.app.get('db'), req.params.post_id)
      .then((comments) => {
        res.json(comments.map(PostsService.serializePostComment))
      })
      .catch(next)
  })

async function checkPostExists(req, res, next) {
  try {
    const post = await PostsService.getById(
      req.app.get('db'),
      req.params.post_id
    )

    if (!post)
      return res.status(404).json({
        error: `Post doesn't exist`,
      })
    res.post = post
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = postsRouter
