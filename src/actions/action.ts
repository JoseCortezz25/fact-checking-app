"use server";

import { FactCheckResponse, VeracityLevels } from "@/lib/types";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

function getFallbackResponse(claim: string) {
  return {
    success: true,
    fallback: true,
    summary: {
      text: claim,
      veracity: "Unknown",
      confidence: 0.5,
      analysis:
        "We couldn't verify this claim due to API limitations. Please try again later or check reliable sources manually to verify this information."
    },
    sources: [
      {
        title: "API Quota Exceeded",
        publisher: "System Message",
        date: new Date().toLocaleDateString(),
        reliability: "Medium",
        excerpt:
          "The fact-checking service is currently unavailable due to API quota limitations. We recommend checking trusted news sources or fact-checking websites to verify this claim.",
        url: "https://factcheck.org",
        imageUrl: "/placeholder.svg?height=120&width=200"
      }
    ],
    metadata: null
  };
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("resource exhausted") ||
      errorMessage.includes("resource has been exhausted")
    );
  }
  return false;
}

export async function factCheck(claim: string) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google Generative AI API key is not configured. Please check your environment variables.");
    }

    const systemPrompt = `You are a fact-checking assistant. Your task is to analyze claims and provide a detailed analysis of their accuracy. Your analysis should include a confidence score and a summary of the claim. You should also provide sources to support your analysis. If you cannot find any sources, please indicate that in your response. Also, your answers have to be in Spanish. Only Spanish is allowed.`;

    const prompt = `Fact check the following claim and provide a detailed analysis:
    "${claim}"
    
    Analyze the accuracy of this claim using search results. Determine if it is True, False, or Mixed.
    Provide a confidence score between 0 and 1.
    Explain your reasoning with specific evidence from reliable sources.
    
    <INSTRUCTIONS>
    - Provide a summary of the claim.
    - Include a confidence score and a detailed analysis.
    - Provide sources to support your analysis.
    - If you cannot find any sources, indicate that in your response.
    - Your answers should be in Spanish.
    - You have to say if the claim is True, False or Mixed.
    - Provide a confidence score between 0 and 1.
    - Explain your reasoning with specific evidence from reliable sources.
    - Your response should be in MARKDOWN format. 
    - Do not response with "Búsqueda en Google:". Avoid that information.
    </INSTRUCTIONS>
    `;

    try {
      const { text, sources, providerMetadata } = await generateText({
        model: google('gemini-2.0-flash-exp', {
          useSearchGrounding: true
        }),
        system: systemPrompt,
        prompt,
        maxTokens: 1024
      });

      const metadata = providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
      const groundingMetadata = metadata?.groundingMetadata;

      const { object } = await generateObject({
        model: google("gemini-2.0-flash-exp"),
        system: ``,
        prompt: `Extract the claim, veracity, confidence scor from the text below. The text is in Spanish.
        <TEXT>
        ${text}
        </TEXT>`,
        maxTokens: 1024,
        schema: z.object({
            veracity: z.enum([VeracityLevels.TRUE, VeracityLevels.FALSE, VeracityLevels.MIXTED]).describe("The veracity of the claim"),
            confidence: z.number().min(0).max(1).describe("The confidence score of the claim"),
            claim: z.string().describe("The claim being fact-checked")
        })
      });    
      
      const { claim, veracity, confidence } = object;

      const formattedSources =
        sources?.map((source, index) => {
          return {
            title: source.title || `Source ${index + 1}`,
            publisher: "Unknown Publisher",
            date: "Recent",
            reliability: "Medium",
            excerpt: "No excerpt available",
            url: source.url || "#",
            imageUrl: `/placeholder.svg?height=120&width=200`
          };
        }) || [];

      return {
        success: true,
        fallback: false,
        summary: {
          text: claim,
          veracity,
          confidence,
          analysis: text
        },
        sources: formattedSources,
        metadata: groundingMetadata
      } as FactCheckResponse;
    } catch (apiError) {
      if (isQuotaError(apiError)) {
        console.log("API quota exceeded, using fallback response");
        return getFallbackResponse(claim);
      }

      throw apiError;
    }
  } catch (error) {
    console.error("Error in fact checking:", error);

    if (isQuotaError(error)) {
      console.log("Using fallback response due to quota limitations");
      return getFallbackResponse(claim);
    }

    let errorMessage = "An unknown error occurred during fact checking.";

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "API key error: The Google Generative AI API key is missing or invalid.";
      } else if (error.message.includes("network")) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

