import { CURATED_ASSETS, findCuratedAssetByQuery } from '../constants/curatedImages';

export interface ImageSearchResult {
  title: string;
  sourceUrl: string;
  isCurated: boolean;
}

export function findRelatedImage(questionText: string): ImageSearchResult {
  const asset = findCuratedAssetByQuery(questionText);
  return {
    title: asset.name,
    sourceUrl: asset.svgDataUri,
    isCurated: true,
  };
}

export function getAllCuratedImages() {
  return CURATED_ASSETS;
}
