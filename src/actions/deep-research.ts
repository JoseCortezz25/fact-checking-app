'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { FactCheckResponse, VeracityLevels } from '@/lib/types';

const mainModel = openai('gpt-4o');
const exa = new Exa(process.env.EXA_API_KEY);

type SearchResult = {
  title: string;
  url: string;
  content: string;
};

type Learning = {
  learning: string;
  followUpQuestions: string[];
};

type Research = {
  query: string | undefined;
  queries: string[];
  searchResults: SearchResult[];
  learnings: Learning[];
  completedQueries: string[];
};

const SYSTEM_PROMPT = `You are an expert researcher and fact checker. Today is ${new Date().toISOString()}.
Con base a la siguiente informacion, genera un resumen de la investigacion y un informe de la veracidad de la afirmacion.
Al final, debes dar un verdicto de la veracidad de la afirmacion.
Asi mismo, debes dar una explicacion de tu razonamiento para llegar a ese verdicto.
Por otra parte, debes dar un valor de confianza de tu investigacion entre 0 y 100 dependiendo de la evidencia y la calidad de la investigacion.

<instructions>
- El resumen debe ser conciso y a la vez completo.
- El informe debe ser claro y directo.
- El verdicto debe ser claro y directo.
- La explicacion debe ser clara y concisa.
- El informe debe seguir el formato especificado.
- El resumen debe ser en inglés.
- Debe tener un formato de summary (del reporte), analisis extenso y verdicto con tus conclusiones.
</instructions>

<format_to_follow>
  Summary
  - Claim: The claim to fact check
  - Query: The query to search the web for
  - Search Results: The search results from the web
  - Learnings: The learnings from the search results
  - Completed Queries: The queries that have been completed

  Analysis
  - Explanation: The explanation of the verdict
  - Confidence: The confidence of the fact check

  Verdict
  - Verdict: The verdict of the fact check
  - Confidence: The confidence of the fact check

  
</format_to_follow>
`;

const generateSearchQueries = async (query: string, n: number = 3) => {
  const {
    object: { queries }
  } = await generateObject({
    model: mainModel,
    prompt: `Generate ${n} search queries for the following query: ${query}. 
    Your mision is generate queries that will help you find necessary information related to the query. 
    It is important that the queries are related to the query and resolve the doubt of the user and help you to fact check the query and find the truth.

    <instructions>
    - The queries should be concise and to the point, and should not be longer than 10 words.
    - The queries should be specific and not general.
    - The queries should be related to the query.
    - The queries should be in english.
    </instructions>
    `,
    schema: z.object({
      queries: z.array(z.string()).min(1).max(5)
    })
  });
  return queries;
};

const searchWeb = async (query: string) => {
  const { results } = await exa.searchAndContents(query, {
    numResults: 1,
    livecrawl: 'always'
  });

  return results.map(
    result =>
      ({
        title: result.title,
        url: result.url,
        content: result.text
      }) as SearchResult
  );
};

const searchAndProcess = async (
  query: string,
  accumulatedSources: SearchResult[]
) => {
  const pendingSearchResults: SearchResult[] = [];
  const finalSearchResults: SearchResult[] = [];
  await generateText({
    model: mainModel,
    prompt: `Search the web for information about ${query}`,
    system: `You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query.
    The goadl is search the web for information about the query and find the truth about the user's query.
    `,
    maxSteps: 5,
    tools: {
      searchWeb: tool({
        description: 'Search the web for information about a given query',
        parameters: z.object({
          query: z.string().min(1)
        }),
        async execute({ query }) {
          const results = await searchWeb(query);
          pendingSearchResults.push(...results);
          return results;
        }
      }),
      evaluate: tool({
        description: 'Evaluate the search results',
        parameters: z.object({}),
        async execute() {
          const pendingResult = pendingSearchResults.pop()!;
          const { object: evaluation } = await generateObject({
            model: mainModel,
            prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

            <search_results>
            ${JSON.stringify(pendingResult)}
            </search_results>

            <existing_results>
            ${JSON.stringify(accumulatedSources.map(result => result.url))}
            </existing_results>

            `,
            output: 'enum',
            enum: ['relevant', 'irrelevant']
          });
          if (evaluation === 'relevant') {
            finalSearchResults.push(pendingResult);
          }
          console.log('Found:', pendingResult.url);
          console.log('Evaluation completed:', evaluation);
          return evaluation === 'irrelevant'
            ? 'Search results are irrelevant. Please search again with a more specific query.'
            : 'Search results are relevant. End research for this query.';
        }
      })
    }
  });
  return finalSearchResults;
};

const generateLearnings = async (query: string, searchResult: SearchResult) => {
  const { object } = await generateObject({
    model: mainModel,
    prompt: `The user is researching "${query}". 
    
    The following search result were deemed relevant.
    Generate a learning and a follow-up question from the following search result:

    <search_result>
    ${JSON.stringify(searchResult)}
    </search_result>
    `,
    schema: z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string())
    })
  });
  return object;
};

const deepResearch = async (
  prompt: string,
  depth: number = 2,
  breadth: number = 2
) => {
  const accumulatedResearch: Research = {
    query: undefined,
    queries: [],
    searchResults: [],
    learnings: [],
    completedQueries: []
  };

  if (!accumulatedResearch.query) {
    accumulatedResearch.query = prompt;
  }

  if (depth === 0) {
    return accumulatedResearch;
  }

  const queries = await generateSearchQueries(prompt, breadth);
  accumulatedResearch.queries = queries;

  for (const query of queries) {
    console.log(`Searching the web for: ${query}`);
    const searchResults = await searchAndProcess(
      query,
      accumulatedResearch.searchResults
    );
    accumulatedResearch.searchResults.push(...searchResults);
    for (const searchResult of searchResults) {
      console.log(`Processing search result: ${searchResult.url}`);
      const learnings = await generateLearnings(query, searchResult);
      accumulatedResearch.learnings.push(learnings);
      accumulatedResearch.completedQueries.push(query);

      const newQuery = `Overall research goal: ${prompt}
        Previous search queries: ${accumulatedResearch.completedQueries.join(', ')}
 
        Follow-up questions: ${learnings.followUpQuestions.join(', ')}
        `;
      await deepResearch(newQuery, depth - 1, Math.ceil(breadth / 2));
    }
  }
  return accumulatedResearch;
};

const generateReport = async (research: Research) => {
  const { object } = await generateObject({
    model: mainModel,
    system: SYSTEM_PROMPT,
    prompt:
      'Generate a report based on the following research data:\n\n' +
      JSON.stringify(research, null, 2),
    schema: z.object({
      veracity: z
        .enum([
          VeracityLevels.TRUE,
          VeracityLevels.FALSE,
          VeracityLevels.MIXTED
        ])
        .describe('The veracity of the claim'),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe('The confidence score of the claim'),
      claim: z.string().describe('The claim being fact-checked'),
      sources: z
        .array(
          z.object({
            url: z.string(),
            title: z.string(),
            content: z.string()
          })
        )
        .describe('The sources used to fact-check the claim'),
      metadata: z.object({
        groundingMetadata: z.object({
          grounding: z.string().describe('The grounding of the claim'),
          groundingScore: z
            .number()
            .describe('The grounding score of the claim'),
          groundingExplanation: z
            .string()
            .describe('The grounding explanation of the claim')
        })
      })
    })
  });

  return object;
};

export const mainResearch = async (
  query: string
): Promise<FactCheckResponse> => {
  const research = await deepResearch(query);
  const report = await generateReport(research);
  const { veracity, confidence, claim, sources, metadata } = report;

  console.log('report', report);

  return {
    success: true,
    fallback: false,
    summary: {
      text: claim,
      veracity,
      confidence,
      analysis: research.learnings[0].learning
    },
    sources: sources.map(source => ({
      url: source.url,
      title: source.title,
      content: source.content
    })),
    metadata: metadata
  } as FactCheckResponse;
};
