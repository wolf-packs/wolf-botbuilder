// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext } from 'botbuilder'
import { StorageLayerType } from '../../src'
import * as wolf from 'wolf-core'
import { abilities } from './abilities'
import { slots } from './slots'
import nlp from './nlp'

export interface ConversationData {
  name?: string
}

const flow: wolf.Flow<ConversationData, StorageLayerType<ConversationData>> = {
  abilities,
  slots
}

export class MyBot {

  private wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>
  private conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, ConversationData>

  constructor(
    wolfStorageLayer: wolf.StorageLayerFactory<TurnContext, wolf.WolfState>,
    conversationStorageLayer: wolf.StorageLayerFactory<TurnContext, ConversationData>
  ) {
    this.wolfStorageLayer = wolfStorageLayer
    this.conversationStorageLayer = conversationStorageLayer
  }

  /**
   * Use onTurn to handle an incoming activity, received from a user, process it, and reply as needed
   *
   * @param {TurnContext} turnContext context object.
   */
  public onTurn = async (turnContext: TurnContext) => {
    // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
      
    // Bot logic here
    const wolfResult = await wolf.run(
      this.wolfStorageLayer(turnContext),
      this.conversationStorageLayer(turnContext, {}),
      () => nlp(turnContext),
      () => flow,
      'echo'
    )

    // Respond Wolf messages
    const sendActivities = wolfResult.messageStringArray.map((message) => turnContext.sendActivity(message))
    await Promise.all(sendActivities)
  }
}
