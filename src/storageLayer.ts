import * as wolf from 'wolf-core'
import { ConversationState, TurnContext } from 'botbuilder'

/**
 * Custom developer state (represented as a generic in the `createBotBuilderStorageLayer`)
 * is expected to extend this interface.
 */
interface AnyObject {
  [key: string]: any,
  [key: number]: any
}

export type StorageLayerType<T> = wolf.AllAsyncStorageLayer<T>

/**
 * Creates storage layer to interface with Wolf based on the developer's custom state.
 * Factory function that allows the creation of Wolf storage layer interfaces specific to
 * Microsoft Bot Builder utilizing TurnContext.
 * 
 * @param conversationState Bot Builder's ConversationState instance
 * @param statePropertyName Optional state property name, default is 'CONVERSATION_STATE'
 * @returns Wolf storage layer functions
 */
export const createBotbuilderStorageLayer = <T extends AnyObject>(
  conversationState: ConversationState,
  statePropertyName: string = 'CONVERSATION_STATE'
): wolf.StorageLayerFactory<TurnContext, T> => {
  // Bot Builder pattern to create a new store in state mapped to a key `statePropertyName`
  const convoStore = conversationState.createProperty(statePropertyName)
  return (botbuilderTurnContext: TurnContext, initialState?: T): StorageLayerType<T> => {
    const convoStateStorage: StorageLayerType<T> = {
      read: () => {
        // Return the state from the store
        return convoStore.get(botbuilderTurnContext, initialState)
      },
      save: async (newState: T) => {
        // Bot Builder `TurnContext` requires the developer to mutate the state in the store
        // then call `saveChanges()` which will commit the mutated state to the session context.
        // To avoid imposing the developer to utilize mutative patterns, we expose a `save()` function
        // which expects a new state which we will save onto the context on behalf of the developer.

        // To accomplish this we clean state then load in the new state and call Bot Builder's `saveChanges()`

        // Remove old keys
        const oldState = await convoStore.get(botbuilderTurnContext, initialState)
        const oldKeys = Object.keys(oldState)
        oldKeys.forEach((key) => {
          delete oldState[key]
        })

        // Load new keys
        const keys = Object.keys(newState)
        keys.forEach((key) => {
          oldState[key] = newState[key]
        })

        // Save back to Bot Builder context
        return conversationState.saveChanges(botbuilderTurnContext)
      }
    }
    return convoStateStorage
  }
}

/**
 * Creates storage layer to interface with Wolf customized to manage Wolf's state.
 * Factory function that allows the creation of Wolf storage layer interfaces specific to
 * Microsoft Bot Builder utilizing TurnContext.
 * 
 * @param conversationState Bot builder's ConversationState instance
 * @returns Wolf storage layer functions
 */
export const createWolfStorageLayer = (conversationState: ConversationState):
  wolf.StorageLayerFactory<TurnContext, wolf.WolfState> => {
  const wolfStorageLayer = createBotbuilderStorageLayer<wolf.WolfState>(conversationState, 'WOLF_STATE')
  return (botbuilderTurnContext: TurnContext): wolf.WolfStateStorage =>
    wolfStorageLayer(botbuilderTurnContext, wolf.getDefaultWolfState())
}
