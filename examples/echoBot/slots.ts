import { Slot } from 'wolf-core'
import { ConversationData } from './bot'
import { StorageLayerType } from '../../src'

export const slots = [
  {
    name: 'name',
    query: () => 'what is your name?'
  }
] as Slot<StorageLayerType<ConversationData>>[]