import { Ability } from 'wolf-core'
import { ConversationData } from './bot'
import { StorageLayerType } from '../../src'

export default [
  {
    name: 'greet',
    slots: [{
      name: 'name',
      query: () => 'what is your name?'
    }],
    onComplete: async (submittedData, {save}) => {
      const newState = {
        name: submittedData.name
      }
      await save(newState)

      return `hi ${submittedData.name}!`
    }
  },
  {
    name: 'echo',
    slots: [],
    onComplete: async (submittedData, {read}, {getMessageData}) => {
      const convoState = await read()
      console.log(convoState)
      const messageData = getMessageData()
      const message = messageData.rawText
      if (convoState.name) {
        return `${convoState.name} said "${message}"`
      }
      return `You said "${message}"`
    }
  }
] as Ability<ConversationData, StorageLayerType<ConversationData>>[]