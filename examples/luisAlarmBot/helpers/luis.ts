import { NlpResult, NlpEntity } from 'wolf-core'

const transformLuisEntitiesToNlpEntities = (luisEntity): NlpEntity => {
  return {
    name: luisEntity.type,
    text: luisEntity.entity,
    value: luisEntity.entity
  }
}

export const transformLuisToNlpResult = (luisResult): NlpResult[] => {
  return [{
    message: luisResult.query,
    intent: luisResult.topScoringIntent.intent === 'None' ? null : luisResult.topScoringIntent.intent,
    entities: luisResult.entities.map(transformLuisEntitiesToNlpEntities),
  }]
}