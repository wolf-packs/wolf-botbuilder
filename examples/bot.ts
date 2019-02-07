// Import Wolf dependency
import * as wolf from 'wolf-core'

// Import Wolf's botbuilder storage layer
// import { createBotbuilderStorageLayer } from 'wolf-botbuilder'
import { createBotbuilderStorageLayer } from '../src'

// Import Wolf abilities
import { UserState, abilities } from './abilities'

// Import NLP
import nlp from './nlp'

// Bring in Botbuilder dependency
import * as restify from 'restify'
import { BotFrameworkAdapter, MemoryStorage, ConversationState } from 'botbuilder'

// Create HTTP server with restify
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
});

// Create adapter (Botbuilder specific)
const adapter = new BotFrameworkAdapter({
  appId: process.env.microsoftAppID,
  appPassword: process.env.microsoftAppPassword,
});

// Settup storage layer
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage)
const conversationStorageLayer = createBotbuilderStorageLayer<UserState>(conversationState)
const wolfStorageLayer = createBotbuilderStorageLayer<wolf.WolfState>(conversationState, 'WOLF_STATE')

// Listen for incoming requests
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // Bot logic here
    const wolfResult = await wolf.run(
      wolfStorageLayer(context),
      conversationStorageLayer(context, { alarms: [] }),
      () => nlp(context.activity.text),
      () => abilities,
      'greet'
    )

    // Respond first message from Wolf
    await context.sendActivity(wolfResult.messageStringArray[0])
  });
});
