import { Ability } from 'wolf-core'
import { ConversationData } from './bot'
import { StorageLayerType } from '../../src'

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
    onComplete: async ({read}, submittedData) => {
      const convoState = await read()
      convoState.name = submittedData.name
      return `hi ${submittedData.name}!`
    }
  },
  {
    name: 'echo',
    slots: [],
    onComplete: async ({read}, submittedData, {getMessageData}) => {
      const convoState = await read()
      const messageData = getMessageData()
      const message = messageData.rawText
      if (convoState.name) {
        return `${convoState.name} said "${message}"`
      }
      return `You said "${message}"`
    }
  }
] as Ability<ConversationData, StorageLayerType<ConversationData>>[]