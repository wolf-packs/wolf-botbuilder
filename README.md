# Wolf Bot Builder Integration

This package is designed to enable seemless integration between [Wolf] and [Microsoft Bot Builder SDK v4].
The goal is to allow developers to create dynamic bot conversations flow utilizing the [Microsoft Bot Framework] in a declarative way. In order to utilize the Bot Framework to persist state with `TurnContext`, we provide a few convenience functions.

If you have not already, we encourage you to check out [Wolf] to learn more about what this conversational framework aims to accomplish and the developer experience we are striving to enable.

_Fun fact: Wolf can easily integrate with many popular frameworks, to find out more check out the [Wolf] documentation or [Wolf-Packs]._

## What is provided?
This package allows you, the bot developer, to utilize Bot Builder's internal storage layer to persist the `conversationState` and the `wolfState` while conforming to the storage interface that Wolf provides. There are two convenience functions provided that allows the developer to use the Bot Builder's `turnContext` as a mechanism to persist state. Both the `conversationState` and the `wolfState` are required to be persisted and supplied since Wolf is a stateless function that is run on every turn.

### Custom Conversation State
`createBotbuilderStorageLayer`: A factory function which creates a function that will return a Bot Builder specific implementation of a storage layer Wolf can utilize. This factory creates a custom storage layer expecting the custom user state defined by the developer. Ultimately Wolf (v3+) will provide all user-defined functions a `read`/`save` interface.

> *Note:* Bot Builder's `ConversationState` requires the developer to mutate the state then call `saveChanges()` to commit the mutated state to the session context. To avoid imposing mutative patterns on the developer, we expose a `save(data)` function which expects a new state which we will save onto the context on behalf of the developer. To accomplish this we scrub all properties of the old state then load in the new values and call Bot Builder's `saveChanges()`.

### Wolf State
`createWolfStorageLayer`: A factory function which is composed from `createBotbuilderStorageLayer`.  In order for wolf to be stateless and free of storage implementations, we provide a convenience function for the developer to call when setting up the bot.  This will hook the `wolfState` persistance mechanism into the botbuilder storage.

---------------------------------------
## Examples
* The [alarmBot] example shows how bare-bones a Wolf and Bot Builder example can be utilizing simple functions.
* The [echoBot] is the final product of the step-by-step guide below and follows the Bot Builder's convention of a class based approach.

---------------------------------------
## Step-by-step Guide on Building a Stateful Echo Bot
We will build a stateful echo bot where the bot will remember your name, if you greet it with "hi" or "hi my name is {your name}"

1. If you don't have node installed, please install Node (LTS version) by going to the [NodeJS website]
2. Go to [Bot Builder Docs] on how to create a bot
3. When asked about "Which template would you like to start with?" during the `yo` generator prompt flow, select **"Empty Bot"**
4. Go into the project you just created, and run `npm install wolf-core@alpha wolf-botbuilder@alpha`
5. At the top of the `src/bot.ts` insert the line to import `wolf` and wolf-botbuilder integration functions:
```ts
import * as wolf from 'wolf-core'
import { createBotbuilderStorageLayer, createWolfStorageLayer } from 'wolf-botbuilder'
```

6. Create the storage layers somewhere in the app level:
```ts
const adapter = new BotFrameworkAdapter();

// add the following lines:
// Setup storage layer
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage)
const conversationStorageLayer = createBotbuilderStorageLayer<object>(conversationState)
const wolfStorageLayer = createWolfStorageLayer(conversationState)
```

7. In `src/bot.ts` define your shape of your conversation data:
```ts
export interface ConversationData {
  name?: string // this is where your name is going to be stored
}
```

8. In `src/bot.ts` configure your Bot class to take in the `conversationStorageLayer` and the `wolfStorageLayer`
```ts
export class MyBot {

  /* Add the following code in your Bot class*/
  private wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>
  private conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, ConversationData>

  constructor(
    wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>,
    conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, ConversationData>
  ) {
    this.wolfStorageLayer = wolfStorageLayer
    this.conversationStorageLayer = conversationStorageLayer
  }

  // ...onTurn method below here
}
```

9. In `src/index.ts` instantiate your bot with the two storage layers you created by changing to line like so
```ts
const myBot = new MyBot(wolfStorageLayer, conversationStorageLayer);
```

10. **Define your NLP**: we are going to use a very simple regex-based NLP that detects "hi" and "hi my name is ..."  Create a file in `src/nlp.ts` with the code below: (Checkout out the examples/echoBot/nlp.ts for the annotated version of the code to see what it's doing)
```ts
import { TurnContext } from 'botbuilder'
import { NlpEntity, NlpResult } from 'wolf-core'

const greetTest = new RegExp('hi')
const nameRecognizer = (input: string): NlpEntity => {
  const nameReg = /my name is (\w*)/
  const result = nameReg.exec(input)
  if (!result) {
    return null
  }
  return {
    name: 'name',
    value: result[1],
    text: result[1]
  }
}

export default (context: TurnContext): NlpResult => {
  const isGreeting = greetTest.test(context.activity.text)
  if (isGreeting) {
    const nameFound = nameRecognizer(context.activity.text)
    if (nameFound) {
      return {
        message: context.activity.text,
        intent: 'greet',
        entities: [nameFound]
      }
    }
    return {
      message: context.activity.text,
      intent: 'greet',
      entities: []
    }
  }

  return {
    message: context.activity.text,
    intent: null,
    entities: []
  }
}
```
11. **Define your abilities:** Create a `src/abilities.ts` file with the following content:
```ts
import { Ability } from 'wolf-core'
import { ConversationData } from './bot'

export default [
  {
    name: 'greet',
    slots: [{
      name: 'name',
      query: () => 'what is your name?',
      validate: () => ({isValid: true, reason: null}),
      retry: () => '',
      onFill: () => {return}
    }],
    onComplete: (convoState, submittedData) => {
      convoState.name = submittedData.name
      return `hi ${submittedData.name}!`
    }
  },
  {
    name: 'echo',
    slots: [],
    onComplete: (convoState, submittedData, {getMessageData}) => {
      const messageData = getMessageData()
      const message = messageData.rawText
      if (convoState.name) {
        return `${convoState.name} said "${message}"`
      }
      return `You said "${message}"`
    }
  }
] as Ability<ConversationData>[]
```
12. **Finally, Create the wolf runner in your bot class (onTurn method) and send the result back to the user:**  In your `src/bot.ts`, replace the body of the `onTurn` method:
```ts
export class MyBot {
  // constructor code above here...

  public onTurn = async (turnContext: TurnContext) => {

    /* Put the follow code in the onTurn method body */
    const wolfResult = await wolf.run(
      this.wolfStorageLayer(turnContext),
      this.conversationStorageLayer(turnContext, {}),
      () => nlp(turnContext),
      () => abilities,
      'echo'
    )

    const sendActivities = wolfResult.messageStringArray.map((message) => turnContext.sendActivity(message))
    await Promise.all(sendActivities)

    // delete the default line "await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);"
  }
}

```

[alarmBot]: examples/alarmBot
[echoBot]: examples/echoBot
[Wolf]: https://github.com/wolf-packs/wolf-core
[Wolf-Packs]: https://github.com/wolf-packs
[Microsoft Bot Framework]: https://dev.botframework.com/
[Microsoft Bot Builder SDK v4]: https://github.com/microsoft/botbuilder-js
[Bot Builder Docs]: (https://docs.microsoft.com/en-us/azure/bot-service/javascript/bot-builder-javascript-quickstart?view=azure-bot-service-4.0)
[NodeJS website]: https://nodejs.org