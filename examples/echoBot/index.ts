// Import Wolf's Bot Builder storage layer
// import { createBotbuilderStorageLayer, createWolfStorageLayer } from 'wolf-botbuilder'
import { createBotbuilderStorageLayer, createWolfStorageLayer } from '../../src'

// Bring in Bot Builder dependency
import * as restify from 'restify'
import { BotFrameworkAdapter, MemoryStorage, ConversationState, TurnContext } from 'botbuilder'
import { MyBot } from './bot'

// Create HTTP server with restify
const server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`)
})

// Create adapter (Bot Builder specific)
const adapter = new BotFrameworkAdapter({
  appId: process.env.microsoftAppID,
  appPassword: process.env.microsoftAppPassword,
})

// Setup storage layer
const memoryStorage = new MemoryStorage()
const conversationState = new ConversationState(memoryStorage)
const conversationStorageLayer = createBotbuilderStorageLayer<object>(conversationState)
const wolfStorageLayer = createWolfStorageLayer(conversationState)

const myBot = new MyBot(wolfStorageLayer, conversationStorageLayer)

// Listen for incoming requests
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    
    // Has to be a message, ignores all other activity (such as conversation update events)
    if (context.activity.type !== 'message') {
      return
    }

    await myBot.onTurn(context)
  })
})
