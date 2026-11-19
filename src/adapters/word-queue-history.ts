import {
  NEW_SCENE_CARD_IDS, NEW_SCENE_V4_CARD_IDS, NEW_READING_V3_CARD_IDS,
  NEW_SCENE_V5_CARD_IDS, NEW_READING_V4_CARD_IDS, NEW_SCENE_V6_CARD_IDS,
  NEW_READING_V5_CARD_IDS, NEW_SCENE_V7_CARD_IDS, NEW_READING_V6_CARD_IDS,
} from '../lib/review';
import type { WordGroupId } from './wiring-words';
// Published v1.9 queues. Never derive these from the growing wordGroups[].words.
// Future released snapshots must be appended here; never edit an existing snapshot.
export const WORD_GROUP_QUEUE_HISTORY: Record<WordGroupId, readonly (readonly string[])[]> = {
  basic: [['L01-V01','L01-V02','L01-V03','L01-V04','L01-V05','L01-V06','L01-V07','L01-V08']],
  'daily-scenes-v3': [[...NEW_SCENE_CARD_IDS]],
  'game-work-reading-v1': [[...NEW_SCENE_V4_CARD_IDS,...NEW_READING_V3_CARD_IDS]],
  'daily-scenes-v5': [[...NEW_SCENE_V5_CARD_IDS]],
  'daily-reading-v4': [[...NEW_READING_V4_CARD_IDS]],
  'daily-scenes-v6': [[...NEW_SCENE_V6_CARD_IDS]],
  'daily-reading-v5': [[...NEW_READING_V5_CARD_IDS]],
  'daily-scenes-v7': [[...NEW_SCENE_V7_CARD_IDS]],
  'daily-reading-v6': [[...NEW_READING_V6_CARD_IDS]],
};
