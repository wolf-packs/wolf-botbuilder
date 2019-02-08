// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext } from 'botbuilder'
import * as wolf from 'wolf-core'
import fetch from 'node-fetch'
import abilities from './abilities'
import { transformLuisToNlpResult } from './helpers/luis';

interface Alarm {
  alarmName: string,
  alarmTime: string
}

export interface ConversationData {
  alarms: Alarm[]
}

const luisEndpoint = process.env.LUIS_ENDPOINT

const callLuis = (context: TurnContext): Promise<wolf.NlpResult> => {
  return fetch(luisEndpoint + context.activity.text)
    .then((res) => res.json())
    .then((luisResult) => transformLuisToNlpResult(luisResult))
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
      this.conversationStorageLayer(turnContext, {alarms: []}),
      () => callLuis(turnContext),
      () => abilities,
      'echo'
    )

    // Respond Wolf messages
    const sendActivities = wolfResult.messageStringArray.map((message) => turnContext.sendActivity(message))
    await Promise.all(sendActivities)
  }
}
