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

  getById(db, id) {
    return db
      .select('*')
      .from('posts')
      .where('posts.id', id)
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
                  usr.date_created,
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .where('comm.post_id', post_id)
      .leftJoin(
        'users AS usr',
        'comm.user_id',
        'usr.id'
      )
      .groupBy('comm.id', 'usr.id')
  },

  // serializePost(post) {
  //   const { author } = post
  //   return {
  //     id: post.id,
  //     title: xss(post.title),
  //     content: xss(post.content),
  //     date_created: new Date(post.date_created),
  //     number_of_comments: Number(post.number_of_comments) || 0,
  //     author: {
  //       id: author.id,
  //       username: author.username,
  //       date_created: new Date(author.date_created),
  //     },
  //   }
  // },

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
        date_created: newDate(user.date_created),
      },
    }
  },
}

module.exports = PostsService
