"use server";

import { openai } from '@ai-sdk/openai';
import { google } from "@ai-sdk/google";
import { generateObject, generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import Exa from "exa-js";

// const mainModel = google('gemini-2.5-flash-preview-04-17');
// const mainModel = openai('gpt-4o-mini');
// const openai = createOpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   compatibility: 'strict' // strict mode, enable when using the OpenAI API
// });

const mainModel = openai('gpt-4o-2024-08-06', {
  structuredOutputs: true
});

const exa = new Exa(process.env.EXA_API_KEY);

type SearchResult = {
  title: string;
  url: string;
  content: string;
}

const generateSearchQueries = async (query: string, n: number = 3) => {
  const { object: queries } = await generateObject({
    model: mainModel,
    prompt: `Generate ${n} search queries for the following query: ${query}`,
    schema: z.object({
      queries: z.array(z.string()).min(1).max(5)
    })
  });
  return queries.queries;
};

const searchWeb = async (query: string) => {
  const { results } = await exa.searchAndContents(query, {
    numResults: 1,
    livecrawl: 'always'
  });

  return results.map((result) => 
    ({
      title: result.title,
      url: result.url,
      content: result.text
    }) as SearchResult
  );
};

const searchAndProcess = async (query: string) => {
  const pendingSearchReuslts: SearchResult[] = [];
  const finalSearchResults: SearchResult[] = [];

  await generateText({
    model: mainModel,
    prompt: `Search the web for the following query: ${query}`,
    system: `You are a research assistant. For each query, search the web and then evalute if the results are relevant and will help answer the following query: ${query}`,
    maxSteps: 5, //
    tools: {
      searchWeb: tool({
        description: "Search the web for information about a given query",
        parameters: z.object({
          query: z.string().min(1)
        }),
        execute: async ({ query }) => {
          const results = await searchWeb(query);
          pendingSearchReuslts.push(...results);
          return results;
        }
      }),
      evalute: tool({
        description: "Evalute the search results",
        parameters: z.object({}), // Empty object because we don't need that model analyze large results from web search.
        execute: async () => {
          const pendingResult = pendingSearchReuslts.pop()!;
          const { object: { evaluation } } = await generateObject({
            model: mainModel,
            prompt: `Evaluate the following results are relevant and will help answer the following query: ${query}
            If the results are not relevant, return "irrelevant".
            If the results are relevant, return "relevant".

            <search_results>
              ${JSON.stringify(pendingResult)}
            </search_results>
            `,
            output: 'enum',
            enum: ['relevant', 'irrelevant']
          });

          if (evaluation === 'relevant') {
            finalSearchResults.push(pendingResult);
          }

          console.log("Found:", pendingResult.url);
          console.log("Evaluation completed:", evaluation);
          return evaluation === "irrelevant"
            ? "Search results are irrelevant. Please search again with a more specific query."
            : "Search results are relevant. End research for this query.";
        }
      })
    }
  });

  return finalSearchResults;
};


export const mainResearch = async (query: string) => {
  const queries = await generateSearchQueries(query);

  for (const query of queries) {
    console.log("Searching the web for:", query);
    const finalResults = await searchAndProcess(query);
    console.log(finalResults);
  }
};

