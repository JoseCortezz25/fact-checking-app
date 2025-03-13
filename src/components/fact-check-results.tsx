"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, HelpCircle, Info, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Source = {
  title: string
  publisher: string
  date: string
  reliability: string
  excerpt: string
  url: string
  imageUrl: string
}

type FactCheckData = {
  summary: {
    text: string
    veracity: string
    confidence: number
    analysis: string
  }
  sources: Source[]
  metadata?: any
  fallback?: boolean
}

interface FactCheckResultsProps {
  data: FactCheckData | null
  onReset: () => void
}

export default function FactCheckResults({ data, onReset }: FactCheckResultsProps) {
  if (!data) return null

  const getVeracityIcon = (veracity: string) => {
    switch (veracity.toLowerCase()) {
      case "verdadero":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "falso":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case "mixta":
        return <HelpCircle className="h-6 w-6 text-yellow-500" />
      default:
        return <HelpCircle className="h-6 w-6 text-blue-500" />
    }
  }

  const getVeracityColor = (veracity: string) => {
    switch (veracity.toLowerCase()) {
      case "verdadero":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "falso":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "mixta":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getReliabilityColor = (reliability: string) => {
    switch (reliability.toLowerCase()) {
      case "high":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
    }
  }

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
              The fact-checking API is currently experiencing quota limitations. We're providing a limited response. For
              accurate fact-checking, please try again later or consult trusted sources directly.
            </p>
          </div>
        </div>
      )}

      <div className="mb-10 p-6 border border-zinc-800 rounded-xl bg-zinc-900/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Fact Check Results</h2>
          <Badge className={`px-3 py-1 ${getVeracityColor(data.summary.veracity)}`}>
            {getVeracityIcon(data.summary.veracity)}
            <span className="ml-2">{data.summary.veracity}</span>
          </Badge>
        </div>

        <div className="mb-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-2">Claim:</p>
          <p className="text-white">{data.summary.text}</p>
        </div>

        <div>
          <p className="text-zinc-400 text-sm mb-2">Analysis:</p>
          <div className="text-white prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.summary.analysis }} />

        </div>

        <div className="mt-4 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
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
        <p className="text-xs text-zinc-500 mt-1">Confidence: {Math.round(data.summary.confidence * 100)}%</p>
      </div>

      <h3 className="text-lg font-medium mb-4">Sources</h3>

      {data.sources && data.sources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {data.sources.map((source, index) => (
            <div
              key={index}
              className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
            >
              <div className="relative h-32 w-full">
                <Image
                  src={source.imageUrl || "/placeholder.svg?height=120&width=200"}
                  alt={source.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{source.title}</h4>
                  <Badge className={`ml-2 ${getReliabilityColor(source.reliability)}`}>{source.reliability}</Badge>
                </div>
                <p className="text-sm text-zinc-400 mb-3">
                  {source.publisher} • {source.date}
                </p>
                <p className="text-sm text-zinc-300 mb-4">{source.excerpt}</p>
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
          No sources were found for this fact check. The analysis is based on the model's knowledge.
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
  )
}

