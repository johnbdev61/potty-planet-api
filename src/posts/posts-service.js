const xss = require('xss')

const PostsService = {
  getAllPosts(db) {
    return db
      .select('posts.*', 'users.username')
      .from('posts')
      .leftOuterJoin('users', 'posts.author_id', '=', 'users.id')
  },

  insertPost(db, newPost) {
    return db
      .insert(newPost)
      .into('posts')
      .returning('*')
      .then(([post]) => post)
  },

  deletePost(db, id) {
    return db.from('posts').where({ id }).delete()
  },

  updatePost(knex, id, is_resolved) {
    return knex('posts').where({ id }).update(is_resolved)
  },

  getById(db, id) {
    return db
      .select('posts.*', 'users.username')
      .from('posts')
      .where('posts.id', id)
      .leftOuterJoin('users', 'posts.author_id', '=', 'users.id')
      .first()
  },

  getCommentsForPost(db, post_id) {
    return db
      .from('comments AS comm')
      .select(
        'comm.id',
        'comm.comment',
        'comm.date_created',
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.username,
                  usr.date_created
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .where('comm.post_id', post_id)
      .leftJoin('users AS usr', 'comm.user_id', 'usr.id')
      .groupBy('comm.id', 'usr.id')
  },

  serializePostComment(comment) {
    const { user } = comment
    return {
      id: comment.id,
      post_id: comment.post_id,
      comment: xss(comment.comment),
      date_created: new Date(comment.date_created),
      user: {
        id: user.id,
        username: user.username,
      },
    }
  },
}

module.exports = PostsService
