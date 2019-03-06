// Import Wolf dependency
import * as wolf from 'wolf-core'

// Import Wolf's Bot Builder storage layer
// import { createBotbuilderStorageLayer, createWolfStorageLayer, StorageLayerType } from 'wolf-botbuilder'
import { createBotbuilderStorageLayer, createWolfStorageLayer, StorageLayerType } from '../../src'

// Import Wolf abilities and slots
import { UserState, abilities } from './abilities'
import { slots } from './slots'

// Import NLP
import nlp from './nlp'

// Bring in Bot Builder dependency
import * as restify from 'restify'
import { BotFrameworkAdapter, MemoryStorage, ConversationState } from 'botbuilder'

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
const conversationStorageLayer = createBotbuilderStorageLayer<UserState>(conversationState)
const wolfStorageLayer = createWolfStorageLayer(conversationState)

const flow: wolf.Flow<UserState, StorageLayerType<UserState>> = {
  abilities,
  slots
}

// Listen for incoming requests
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {

    // Has to be a message, ignores all other activity (such as conversation update events)
    if (context.activity.type !== 'message') {
      return
    }

    // Bot logic here
    const wolfResult = await wolf.run(
      wolfStorageLayer(context),
      conversationStorageLayer(context, { alarms: [] }),
      () => nlp(context.activity.text),
      () => flow,
      'greeting'
    )

    // Respond Wolf messages
    const sendActivities = wolfResult.messageStringArray.map((message) => context.sendActivity(message))
    await Promise.all(sendActivities)
  })
})
