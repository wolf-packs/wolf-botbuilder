import { Ability } from 'wolf-core'
import { ConversationData } from './bot'
import { StorageLayerType } from '../../src'

export const abilities =  [
  {
    name: 'greet',
    traces: [
      {
        slotName: 'name'
      }
    ],
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
    traces: [],
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