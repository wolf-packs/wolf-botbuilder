# Wolf Bot Builder Integration

This package is designed to enable seamless integration between [Wolf] and [Microsoft Bot Builder SDK v4].
The goal is to allow developers to create dynamic bot conversations flow utilizing the [Microsoft Bot Framework] in a declarative way. In order to utilize the Bot Framework to persist state with `TurnContext`, we provide a few convenience functions.

If you have not already, we encourage you to check out [Wolf] to learn more about what this conversational framework aims to accomplish and the developer experience we are striving to enable.

_Fun fact: Wolf can easily integrate with many popular frameworks, to find out more check out the [Wolf] docs or [Wolf-Packs]._

## Core Concepts
This package allows you, the bot developer, to utilize Bot Builder's internal storage layer to persist the `conversationState` and the `wolfState` while conforming to the storage interface that Wolf provides. There are two convenience functions provided that allows the developer to use the Bot Builder's `turnContext` as a mechanism to persist state. Both the `conversationState` and the `wolfState` are required to be persisted and supplied since Wolf is a stateless function that is run on every turn.

### Custom Conversation State
`createBotbuilderStorageLayer`: A factory function which creates a function that will return a Bot Builder specific implementation of a storage layer Wolf can utilize. This factory creates a custom storage layer expecting the custom user state defined by the developer. Ultimately Wolf (v3+) will provide all user-defined functions a `read`/`save` interface.

> *Note:* Bot Builder's `ConversationState` requires the developer to mutate the state then call `saveChanges()` to commit the mutated state to the session context. To avoid imposing mutative patterns on the developer, we expose a `save(data)` function which expects a new state which we will save onto the context on behalf of the developer. To accomplish this we scrub all properties of the old state then load in the new values and call Bot Builder's `saveChanges()`.

### Wolf State
`createWolfStorageLayer`: A factory function which is composed from `createBotbuilderStorageLayer`.  In order for wolf to be stateless and free of storage implementations, we provide a convenience function for the developer to call when setting up the bot.  This will hook the `wolfState` persistance mechanism into the Bot Builder storage.

---------------------------------------
## Examples
* The [alarmBot] example shows how bare-bones a Wolf and Bot Builder example can be utilizing simple functions.
* The [echoBot] is the final product of the step-by-step guide below and follows the Bot Builder's convention of a class based approach.

---------------------------------------
## Step-by-step Guide on Building a Stateful Echo Bot
We will build a stateful echo bot where the bot will remember your name, if you greet it with "hi" or "hi my name is {your name}"

1. If you don't have node installed, please install Node (LTS version) by going to the [NodeJS website].
2. Go to [Bot Builder Docs] on how to create a bot and follow the steps until you tun `yo botbuilder`.
3. During `yo` prompt flow: When asked "Which programming language do you want to use?", select "TypeScript".
4. During `yo` prompt flow: When asked about "Which template would you like to start with?", select "Empty Bot".
5. Navigate into the project you just created with `cd <project-name>`, and run:
```
npm install wolf-core@alpha wolf-botbuilder@alpha
```

6. Before we get into the code, let's make some quick edits to the `/tslint.json`. Add these rules into the `"rules"` object before `"max-line-length"`. The first rule disables universally alphabetizing property order, instead, bases the order on what is declared by the interface. The second rule allows you to use generic array types which we will need later. 
```json
"object-literal-sort-keys": {
    "options": "match-declaration-order"
},
"array-type": [
    true,
    "array"
],
```

7. Navigate into `src/index.ts` and import the required methods from both `botbuilder` and `wolf-core` at the top of the file. We will utilize these Wolf storage layer functions designed to integrate with the Bot Builder storage. In this example we will use the Bot Builder's `MemoryStorage`.
```ts
import { BotFrameworkAdapter, ConversationState, MemoryStorage } from 'botbuilder';
import { createBotbuilderStorageLayer, createWolfStorageLayer } from 'wolf-botbuilder';
```

8. In `src/index.ts`, create the Bot Builder and Wolf storage layers below the adapter. We will eventually pass these storage layers into Wolf which will allow the developer to `read`/`save` state within the user defined functions utilizing Bot Builder's `TurnContext`.
```ts
// Setup storage layer
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const conversationStorageLayer = createBotbuilderStorageLayer<object>(conversationState);
const wolfStorageLayer = createWolfStorageLayer(conversationState);
```

9. Navigate into `src/bot.ts` and import `wolf-core` at the top of the file.
```ts
import * as wolf from 'wolf-core';
```

10. In `src/bot.ts` define the shape of your conversation data above the `MyBot` class. This `IConversationData` is a basic interface placeholder which should be replaced with the desired state shape.
```ts
export interface IConversationData {
    name?: string; // this is where your name is going to be stored
}
```

11. Remaining in `src/bot.ts`, configure your Bot class to take in the `conversationStorageLayer` and the `wolfStorageLayer` parameters and set the private class variables. Replace the entire `class MyBot` with: 
```ts
export class MyBot {

    /* Add the following code in your Bot class*/
    private wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>;
    private conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, IConversationData>;

    constructor(
        wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>,
        conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, IConversationData>,
    ) {
        this.wolfStorageLayer = wolfStorageLayer;
        this.conversationStorageLayer = conversationStorageLayer;
    }

    /**
     * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
     *
     * @param {TurnContext} turnContext context object.
     */
    public onTurn = async (turnContext: TurnContext) => {
        // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
}
```

12. In `src/index.ts` instantiate your bot with the two storage layers we created created by replacing `new MyBot()` with
```ts
const myBot = new MyBot(wolfStorageLayer, conversationStorageLayer);
```

13. **Define your NLP**: We are going to use a very simple regex-based NLP that detects "hi" and "hi my name is ...". Create a file `src/nlp.ts` with the code below: (Checkout out the examples/echoBot/nlp.ts for the annotated version of the code to see what it's doing).
```ts
import { TurnContext } from 'botbuilder';
import { NlpEntity, NlpResult } from 'wolf-core';

const greetTest = new RegExp('hi');
const nameRecognizer = (input: string): NlpEntity => {
  const nameReg = /my name is (\w*)/;
  const result = nameReg.exec(input);
  if (!result) {
    return null;
  }
  return {
    name: 'name',
    value: result[1],
    text: result[1],
  };
};

export default (context: TurnContext): NlpResult => {
  const isGreeting = greetTest.test(context.activity.text);
  if (isGreeting) {
    const nameFound = nameRecognizer(context.activity.text);
    if (nameFound) {
      return {
        message: context.activity.text,
        intent: 'greet',
        entities: [nameFound],
      };
    }
    return {
      message: context.activity.text,
      intent: 'greet',
      entities: [],
    };
  }

  return {
    message: context.activity.text,
    intent: null,
    entities: [],
  };
};

```

14. **Define your abilities:** Create a `src/abilities.ts` file with the following content. This file is where the developer will define the desired user information, and how to handle the information once it is received. We have provided two simple abilities which greet the user and echos the user message.
```ts
import { Ability } from 'wolf-core';
import { IConversationData } from './bot';

export default [
  {
    name: 'greet',
    slots: [{
      name: 'name',
      query: () => 'what is your name?',
      validate: () => ({isValid: true, reason: null}),
      retry: () => '',
      onFill: () => { return; },
    }],
    onComplete: (convoState, submittedData) => {
      convoState.name = submittedData.name;
      return `hi ${submittedData.name}!`;
    },
  },
  {
    name: 'echo',
    slots: [],
    onComplete: (convoState, submittedData, {getMessageData}) => {
      const messageData = getMessageData();
      const message = messageData.rawText;
      if (convoState.name) {
        return `${convoState.name} said "${message}"`;
      }
      return `You said "${message}"`;
    },
  },
] as Ability<IConversationData>[];

```

15. Import the `abilities` and `nlp` that we just created in `src/bot.ts` right below the import from `wolf-core` near the top of the file.
```ts
import abilities from './abilities';
import nlp from './nlp';
```

16. Create the wolf runner in your bot class (`onTurn` method) and send the result back to the user. In your `src/bot.ts`, replace the `onTurn` method with:
```ts
public onTurn = async (turnContext: TurnContext) => {
        // Has to be a message, ignores all other activity (such as conversation update events)
        if (turnContext.activity.type !== 'message') {
            return;
        }

        /* Put the follow code in the onTurn method body */
        const wolfResult = await wolf.run(
            this.wolfStorageLayer(turnContext),
            this.conversationStorageLayer(turnContext, {}),
            () => nlp(turnContext),
            () => abilities,
            'echo',
        );

        const sendActivities = wolfResult.messageStringArray.map((message) => turnContext.sendActivity(message));
        await Promise.all(sendActivities);
    }
```

17. The last step is to run `npm start` which will build and run your bot.

[alarmBot]: examples/alarmBot
[echoBot]: examples/echoBot
[Wolf]: https://github.com/wolf-packs/wolf-core
[Wolf-Packs]: https://github.com/wolf-packs
[Microsoft Bot Framework]: https://dev.botframework.com/
[Microsoft Bot Builder SDK v4]: https://github.com/microsoft/botbuilder-js
[Bot Builder Docs]: https://docs.microsoft.com/en-us/azure/bot-service/javascript/bot-builder-javascript-quickstart?view=azure-bot-service-4.0
[NodeJS website]: https://nodejs.org