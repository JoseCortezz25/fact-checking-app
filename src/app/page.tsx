"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, AlertCircle, Loader2Icon } from "lucide-react";
import FactCheckResults from "@/components/fact-check-results";
import { factCheck } from "@/actions/action";
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input";
import { FactCheckResponse } from "@/lib/types";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [factCheckData, setFactCheckData] = useState<FactCheckResponse>();
  const [error, setError] = useState<string | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleValueChange = (value: string) => {
    setInputText(value);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setShowQuotaWarning(false);

    try {
      const result = await factCheck(inputText);

      if ("fallback" in result) {
        setFactCheckData(result);
        setShowResults(true);

        if (result.fallback) {
          setShowQuotaWarning(true);
        }
      } else {
        setError(result.error || "Failed to fact check. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setShowResults(false);
    setInputText("");
    setError(null);
    setShowQuotaWarning(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-4 px-6 sm:p-4 bg-[#212121] text-[#ececec]">
      {!showResults ? (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-2xl leading-7 w-[70%] md:w-full md:text-4xl md:leading-[39px] tracking-tight font-bold mb-7 text-center">Which doubt do you want to clear up?</h1>

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

          <PromptInput
            value={inputText}
            onValueChange={handleValueChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="w-full max-w-(--breakpoint-md) bg-[#303030] border-[#303030] "
          >
            <PromptInputTextarea placeholder="Ask me anything..." className="text-[#ececec] !text-[18px]" />
            <PromptInputActions className="justify-end pt-2">
              <PromptInputAction
                tooltip={isLoading ? "Stop generation" : "Send message"}
              >
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={handleSubmit}
                  disabled={inputText.length < 15}
                >
                  {isLoading ? (
                    <Loader2Icon className="size-5 animation-loader" />
                  ) : (
                    <ArrowUp className="size-5" />
                  )}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
          <p className="text-[#ececec] text-[10px] mt-4 text-center hidden sm:flex">
            Factly es una herramienta avanzada que consulta diversas fuentes para proporcionar respuestas precisas. Sin embargo, no es infalible y puede ofrecer información incorrecta. <br />
            Te recomendamos verificar siempre los datos críticos y consultar fuentes oficiales para obtener información actualizada y confiable.
          </p>

          <p className="text-[#ececec] text-[12px] mt-4 text-center flex sm:hidden">
            Factly puede cometer errores. Verifica siempre las fuentes.
          </p>

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
  );
}

