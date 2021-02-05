//routes to get list of chats of user
//route to get message by chat id
//post route to create new message
//post route to create new chat
const express = require('express')
const ChatsService = require('./chats-service')
const { requireAuth } = require('../middleware/jwt-auth')

const chatsRouter = express.Router()
const jsonBodyParser = express.json()



chatsRouter
  .route('/')
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { id, user1, user2 } = req.body
    const newChat = { id, user1, user2 }

    for (const [key, value] of Object.entries(newChat))
      if (value == null)
        return 
  })