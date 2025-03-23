"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, HelpCircle, Info, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FactCheckResponse, VeracityLevels } from "@/lib/types";
import showdown from 'showdown';

interface FactCheckResultsProps {
  data: FactCheckResponse | undefined
  onReset: () => void
}

export default function FactCheckResults({ data, onReset }: FactCheckResultsProps) {
  const converter = new showdown.Converter();
  const analysisContent = converter.makeHtml(data?.summary.analysis || '');
  if (!data) return null;

  const getVeracityIcon = (veracity: string) => {
    switch (veracity.toLowerCase()) {
      case VeracityLevels.TRUE:
        return <CheckCircle className="!size-4 text-green-500" />;
      case VeracityLevels.FALSE:
        return <AlertTriangle className="!size-4 text-red-500" />;
      case VeracityLevels.MIXTED:
        return <HelpCircle className="!size-4 text-yellow-500" />;
      default:
        return <HelpCircle className="!size-4 text-blue-500" />;
    }
  };

  const getVeracityColor = (veracity: string) => {
    switch (veracity.toLowerCase()) {
      case VeracityLevels.TRUE:
        return "bg-green-500/10 text-green-500 border-2 border-green-500/20";
      case VeracityLevels.FALSE:
        return "bg-red-500/10 text-red-500 border-2 border-red-500/20";
      case VeracityLevels.MIXTED:
        return "bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-2 border-blue-500/20";
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <Button variant="ghost" onClick={onReset} className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to search
      </Button>

      {data.fallback && (
        <div className="mb-6 p-4 bg-amber-900/20 border border-amber-900/50 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-500 font-medium mb-1">Limited Service Available</h3>
            <p className="text-amber-400/80 text-sm">
              The fact-checking API is currently experiencing quota limitations. We are providing a limited response. For
              accurate fact-checking, please try again later or consult trusted sources directly.
            </p>
          </div>
        </div>
      )}

      <div className="mb-10 sm:p-6 sm:border sm:border-zinc-800 rounded-xl sm:bg-zinc-900/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Fact Check Results</h2>
          <Badge className={`px-3 py-1 rounded-full ${getVeracityColor(data.summary.veracity)}`}>
            {getVeracityIcon(data.summary.veracity)}
            <span className="ml-1 text-[16px] uppercase font-bold">{data.summary.veracity}</span>
          </Badge>
        </div>

        <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-2">Claim:</p>
          <p className="text-white">{data.summary.text}</p>
        </div>

        <div>
          <p className="text-zinc-400 text-sm mb-2">Analysis:</p>
          <div className="analysis-content" dangerouslySetInnerHTML={{ __html: analysisContent }} />
        </div>


        <div className="flex justify-center gap-2 mt-5 w-full flex-col">
          <div className="flex items-center gap-3">
            <p className="text-md text-zinc-500 mt-1">Confidence: <strong>{Math.round(data.summary.confidence * 100)}%</strong></p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-4 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] text-sm">
                  <p>These are values that measure a model&apos;s confidence in a response or specific data point. These scores are typically in a range between 0 and 1, where a higher value indicates greater confidence that the information is correct or relevant.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${data.summary.confidence > 0.7
                ? "bg-green-500"
                : data.summary.confidence > 0.4
                  ? "bg-yellow-500"
                  : "bg-red-500"
                }`}
              style={{ width: `${data.summary.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-medium mb-4">Sources</h3>

      {data.sources && data.sources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {data.sources.map((source, index) => (
            <div
              key={index}
              className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{source.title}</h4>
                </div>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                  >
                    View Source
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 text-zinc-400">
          No sources were found for this fact check.
        </div>
      )}

      {data.metadata && !data.fallback && (
        <Accordion
          type="single"
          collapsible
          className="mb-8 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50"
        >
          <AccordionItem value="search-metadata" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:bg-zinc-800 hover:no-underline">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2 text-zinc-400" />
                <span>Search Metadata</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="text-sm text-zinc-300">
                {data.metadata.webSearchQueries && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Search Queries Used:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {data.metadata.webSearchQueries.map((query: string, i: number) => (
                        <li key={i} className="text-zinc-400">
                          {query}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.metadata.searchEntryPoint && (
                  <div>
                    <h4 className="font-medium mb-2">Main Search Entry Point:</h4>
                    <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-zinc-400">
                      {data.metadata.searchEntryPoint.renderedContent}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

