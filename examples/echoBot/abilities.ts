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