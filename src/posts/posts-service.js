const xss = require('xss')

const PostsService = {
  getAllPosts(db) {
    return db
      .from('posts AS post')
      .select(
        'post.id',
        'post.title',
        'post.date_created',
        'post.is_resolved',
        db.raw(
          `count(DISTINCT comm) AS number_of_comments`
        ),
        db.raw(
          `json_strips_nulls(
            json_build_object(
              'id', usr.id,
              'username', usr.username,
              'date_created', usr.date_created
            )
          ) AS "author"`
        ),
      )
      .leftJoin(
        'comments AS comm',
        'post.id',
        'comm.post_id',
      )
      .leftJoin(
        'users AS usr',
        'post.author_id',
        'usr.id',
      )
      .groupBy('post.id', 'usr.id')
  },

  getById(db, id) {
    return PostsService.getAllPosts(db)
      .where('post.id', id)
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

  serializePost(post) {
    const { author } = post
    return {
      id: post.id,
      title: xss(post.title),
      date_created: new Date(post.date_created),
      number_of_comments: Number(post.number_of_comments) || 0,
      author: {
        id: author.id,
        username: author.username,
        date_created: new Date(author.date_created),
      },
    }
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
        date_created: newDate(user.date_created),
      },
    }
  },
}

module.exports = PostsService
