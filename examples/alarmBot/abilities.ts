import { randomElement } from './helpers'
import { Ability } from 'wolf-core'
import { StorageLayerType } from '../../src';

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
        retry: (submittedValue, convoStorageLayer, turnCount) => {
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
        retry: (submittedValue, convoStorageLayer, turnCount) => {
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
    onComplete: async (submittedData, {read, save}) => {
        const value = submittedData
        const convoState = await read()
        const prevAlarms = convoState.alarms || []
        const newState = {
          alarms: [
            ...prevAlarms,
            value
          ]
        }

        await save(newState)

        return `Your ${value.alarmName} is added!`
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
    onComplete: async (submittedData, {read, save}) => {
      const { alarmName } = submittedData
      const convoState = await read()
      const stateAlarms = convoState.alarms || []

      // Check if alarm name exists
      if (!stateAlarms.some((alarm: Alarm) => alarm.alarmName === alarmName)) {
        return `There is no alarm with name ${alarmName}.`
      }

      // Remove alarm
      const newAlarms = stateAlarms.filter((alarm: Alarm) => alarm.alarmName !== alarmName)
      const newState = {
        alarms: newAlarms
      }
      
      await save(newState)

      return `The ${alarmName} has been removed.`
    }
  },
  {
    name: 'listAlarms',
    slots: [],
    onComplete: async (submittedData, {read}) => {
      const convoState = await read()
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
    onComplete: (submittedData, convoStorageLayer, { getAbilityList }) => {
      const abilityList = getAbilityList()
      const abilities = abilityList.map((ability) => ability.name).join(', ')
      const message = `Here are my abilities: ${abilities}`
      return message
    }
  }
] as Ability<UserState, StorageLayerType<UserState>>[]
