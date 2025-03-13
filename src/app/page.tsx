"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, AlertCircle } from "lucide-react"
import FactCheckResults from "@/components/fact-check-results"
import { factCheck } from "@/actions/action"

export default function Home() {
  const [inputText, setInputText] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [factCheckData, setFactCheckData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showQuotaWarning, setShowQuotaWarning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setIsChecking(true)
    setError(null)
    setShowQuotaWarning(false)

    try {
      const result = await factCheck(inputText)

      if (result.success) {
        setFactCheckData(result)
        setShowResults(true)

        // Show quota warning if using fallback
        if (result.fallback) {
          setShowQuotaWarning(true)
        }
      } else {
        setError(result.error || "Failed to fact check. Please try again.")
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setIsChecking(false)
    }
  }

  const resetSearch = () => {
    setShowResults(false)
    setInputText("")
    setError(null)
    setShowQuotaWarning(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      {!showResults ? (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-3xl font-semibold mb-12">Fact Checker</h1>

          {showQuotaWarning && (
            <div className="mb-6 w-full p-4 bg-amber-900/20 border border-amber-900/50 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-500 font-medium mb-1">API Quota Limitations</h3>
                <p className="text-amber-400/80 text-sm">
                  The fact-checking API is currently experiencing quota limitations. Results may be limited.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Enter a claim to fact-check..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full py-6 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:ring-0"
              />
              <Button
                type="submit"
                disabled={isChecking || !inputText.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 rounded-lg p-2"
              >
                {isChecking ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-6 w-full p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>
      ) : (
        <FactCheckResults data={factCheckData} onReset={resetSearch} />
      )}
    </main>
  )
}

