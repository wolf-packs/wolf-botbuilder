import { randomElement } from './helpers'
import * as wolf from 'wolf-core'

interface Alarm {
  alarmName: string,
  alarmTime: string
}

export interface UserState {
  alarms: Alarm[]
}

export const abilities = [
  {
    name: 'greeting',
    slots: [],
    onComplete: () => {
      return 'Hello! Welcome to alarm bot.'
    }
  },
  {
    name: 'addAlarm',
    slots: [
      {
        name: 'alarmName',
        query: () => { return 'What is the name of the alarm?' },
        retry: (convoState, submittedData, turnCount) => {
          const phrase = [`Please try a new name (attempt: ${turnCount})`, `Try harder.. (attempt: ${turnCount})`]
          if (turnCount > phrase.length - 1) {
            return phrase[phrase.length - 1]
          }
          return phrase[turnCount]
        },
        validate: (value) => {
          if (value.toLowerCase() === 'hao') {
            return { isValid: false, reason: `${value} is not a good alarm name.` }
          }
          return { isValid: true, reason: null }
        },
        onFill: (value) => `ok! name is set to ${value}.`
      },
      {
        name: 'alarmTime',
        query: () => { return 'What is the time you want to set?' },
        retry: (convoState, submittedData, turnCount) => {
          const phrases: string[] = ['let\'s try again', 'what is the time you want to set?']
          return randomElement(phrases)
        },
        validate: (value: string) => {
          if (!value.toLowerCase().endsWith('pm') && !value.toLowerCase().endsWith('am')) {
            return {
              isValid: false,
              reason: 'Needs to set PM or AM',
            }
          }
          return {
            isValid: true
          }
        },
        onFill: (value) => `ok! time is set to ${value}.`
      }
    ],
    onComplete: (convoState, submittedData) => {
      return new Promise((resolve, reject) => {
        const value = submittedData
        const alarms = convoState.alarms || []
        convoState.alarms = [
          ...alarms,
          value
        ]

        setTimeout(() => {
          resolve(`Your ${value.alarmName} is added!`)
        }, 500)
      })
    }
  },
  {
    name: 'removeAlarm',
    slots: [
      {
        name: 'alarmName',
        query: () => {
          return 'What is the name of the alarm you would like to remove?'
        }
      }
    ],
    onComplete: (convoState, submittedData) => {
      const { alarmName } = submittedData
      const stateAlarms = convoState.alarms || []

      // Check if alarm name exists
      if (!stateAlarms.some((alarm: Alarm) => alarm.alarmName === alarmName)) {
        return `There is no alarm with name ${alarmName}.`
      }

      // Remove alarm
      const alarms = stateAlarms.filter((alarm: Alarm) => alarm.alarmName !== alarmName)
      convoState.alarms = alarms
      return `The ${alarmName} has been removed.`
    }
  },
  {
    name: 'listAlarms',
    slots: [],
    onComplete: (convoState) => {
      const alarms = convoState.alarms || []

      if (alarms.length === 0) {
        return `You do not have any alarms!`
      }
      return alarms.map((alarms: Alarm) => alarms.alarmName + ' at ' + alarms.alarmTime).join(', ')
    }
  },
  {
    name: 'listAbility',
    slots: [],
    onComplete: (convoState, submittedData, { getAbilityList }) => {
      const abilityList = getAbilityList()
      const abilities = abilityList.map((ability) => ability.name).join(', ')
      const message = `Here are my abilities: ${abilities}`
      return message
    }
  }
] as wolf.Ability<UserState>[]
