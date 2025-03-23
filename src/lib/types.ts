import type { GoogleGenerativeAIProviderSettings as BaseGoogleGenerativeAIProviderSettings } from '@ai-sdk/google';

export enum VeracityLevels {
  TRUE = 'true',
  FALSE = 'false',
  MIXTED = 'mixted'
}

export type Location = {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  countryCode?: string;
};

export type GoogleGenerativeAISettings = {
  useSearchGrounding?: boolean;
  location?: Location;
};

export type GoogleGenerativeAIProviderSettings =
  BaseGoogleGenerativeAIProviderSettings & {
    defaultOptions?: GoogleGenerativeAISettings;
  };

export type FactCheckResponse = {
  success: boolean;
  fallback: boolean;
  summary: {
    text: string;
    veracity: string;
    confidence: number;
    analysis: string;
  };
  sources: {
    title: string;
    url: string;
  }[];
  metadata:
    | {
        webSearchQueries?: string[] | null | undefined;
        retrievalQueries?: string[] | null | undefined;
        searchEntryPoint?:
          | {
              renderedContent: string;
            }
          | null
          | undefined;
        groundingChunks?:
          | {
              web?:
                | {
                    uri: string;
                    title: string;
                  }
                | null
                | undefined;
              retrievedContext?:
                | {
                    uri: string;
                    title: string;
                  }
                | null
                | undefined;
            }[]
          | null
          | undefined;
        groundingSupports?:
          | {
              segment: {
                startIndex?: number | null | undefined;
                endIndex?: number | null | undefined;
                text?: string | null | undefined;
              };
              segment_text?: string | null | undefined;
              groundingChunkIndices?: number[] | null | undefined;
              supportChunkIndices?: number[] | null | undefined;
              confidenceScores?: number[] | null | undefined;
              confidenceScore?: number[] | null | undefined;
            }[]
          | null
          | undefined;
        retrievalMetadata?:
          | {
              webDynamicRetrievalScore: number;
            }
          | Record<string, never>
          | null
          | undefined;
      }
    | null
    | undefined;
};
