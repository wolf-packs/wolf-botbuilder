import * as wolf from 'wolf-core'
import { ConversationState, TurnContext } from 'botbuilder'

interface AnyObject {
  [key: string]: any,
  [key: number]: any
}

/**
 * Factory function that allows the creation of Wolf storage layer interfaces specific to
 * Microsoft Botbuilder utilizing TurnContext
 * 
 * @param conversationState Botbuilder's ConversationState instance
 * @param statePropertyName Optional state proprty name, default is 'CONVERSATION_STATE'
 * @returns Wolf storage layer functions
 */
export const createBotbuilderStorageLayer = <T extends AnyObject>(
  conversationState: ConversationState,
  statePropertyName: string = 'CONVERSATION_STATE'
) => {
  const convoStore = conversationState.createProperty(statePropertyName)
  return (botbuilderTurnContext: TurnContext, initialState?: T) => {
    const convoStateStorage: wolf.StorageLayer<T> = {
      read: () => {
        return convoStore.get(botbuilderTurnContext, initialState)
      },
      save: async (newState: T) => {
        // TODO: Why we chose to do this?
        // remove old keys
        const oldState = await convoStore.get(botbuilderTurnContext, initialState)
        const oldKeys = Object.keys(oldState)
        oldKeys.forEach((key) => {
          delete oldState[key]
        })

        // save new keys
        const keys = Object.keys(newState)
        keys.forEach((key) => {
          oldState[key] = newState[key]
        })

        // save back to botbuilder context
        conversationState.saveChanges(botbuilderTurnContext)
      }
    }
    return convoStateStorage
  }
}

// TODO: JSDocs
export const createWolfStorageLayer = (conversationState: ConversationState) => {
  const wolfStorageLayer = createBotbuilderStorageLayer<wolf.WolfState>(conversationState, 'WOLF_STATE')
  return (botbuilderTurnContext: TurnContext) => wolfStorageLayer(botbuilderTurnContext, wolf.getDefaultWolfState())
}
