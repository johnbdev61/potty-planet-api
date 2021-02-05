const xss = require('xss')

const ChatsService = {
  getByUser(db, id) {
    return db
      .from('chats AS chat')
      .select('chat.id', 'usr1.name', 'usr2.name')
      .leftJoin('users AS usr1', 'chat.usr1', 'usr1.id')
      .leftJoin('users AS usr2', 'chat.usr2', 'usr2.id')
      .orWhere('usr1.id', id)
      .orWhere('usr2.id', id)
      .first()
  },

  getMessagesByChat(db, id) {
    return db
      .from('messages AS message')
      .select('message.id', 'message.date_created', 'message.sender_id', 'message.recipient_id')
      .where('message.chat_id', id)
  },

  insertChat(db, newChat) {
    return db
      .insert(newChat)
      .into('chats')
      .returning('*')
      .then(([chat]) => chat)
      .then(chat =>
        ChatsService.getById(db, chat.id)
      )
  },
}

module.exports = ChatsService