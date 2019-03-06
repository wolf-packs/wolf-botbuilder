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
    traces: [],
    onComplete: () => {
      return 'Hello! Welcome to alarm bot.'
    }
  },
  {
    name: 'addAlarm',
    traces: [
      {
        slotName: 'alarmName'
      },
      {
        slotName: 'alarmTime'
      }
    ],
    onComplete: async (submittedData, { read, save }) => {
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
    traces: [
      {
        slotName: 'alarmName'
      }
    ],
    onComplete: async (submittedData, { read, save }) => {
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
    traces: [],
    onComplete: async (submittedData, { read }) => {
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
    traces: [],
    onComplete: (submittedData, convoStorageLayer, { getAbilityList }) => {
      const abilityList = getAbilityList()
      const abilities = abilityList.map((ability) => ability.name).join(', ')
      const message = `Here are my abilities: ${abilities}`
      return message
    }
  }
] as Ability<UserState, StorageLayerType<UserState>>[]
