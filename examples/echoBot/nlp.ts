import { TurnContext } from 'botbuilder'
import { NlpEntity, NlpResult } from 'wolf-core';

// Creating a simple regex for hi to test if it is in the user message
const greetTest = new RegExp('^hi')

// Creating a function that either returns null, or the wolf-defined Entity Object if name is detected
const nameRecognizer = (input: string): NlpEntity | null => {
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
  // First test to see if the utterance is a greeting
  const isGreeting = greetTest.test(context.activity.text)
  if (isGreeting) {
    // If it is a greeting, detect to see if the greeting has a name in there
    const nameFound = nameRecognizer(context.activity.text)
    if (nameFound) {
      // if there is a name, return the entire Nlp Result with the name entity
      return {
        message: context.activity.text,
        intent: 'greet',
        entities: [nameFound]
      }
    }
    // if there is no name, return the Nlp Result with no entities
    return {
      message: context.activity.text,
      intent: 'greet',
      entities: []
    }
  }

  // if the utterance is not a greeting, just return the default Nlp Result
  return {
    message: context.activity.text,
    intent: null,
    entities: []
  }
}