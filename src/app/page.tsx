"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, AlertCircle, Loader2Icon, X, Paperclip } from "lucide-react";
import FactCheckResults from "@/components/fact-check-results";
import { factCheck } from "@/actions/action";
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input";
import { FactCheckResponse, Location } from "@/lib/types";

interface ImageState {
  name: string;
  file: File;
  imageUrl: string;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [factCheckData, setFactCheckData] = useState<FactCheckResponse>();
  const [error, setError] = useState<string | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<Location | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<ImageState | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
            if (!response.ok) return;

            const locationInfo = await response.json();
            setLocation({
              latitude,
              longitude,
              city: locationInfo.city,
              country: locationInfo.country,
              countryCode: locationInfo.countryCode
            });
          } catch (error) {
            setLocation({ latitude, longitude });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleValueChange = (value: string) => {
    setInputText(value);
  };;

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setShowQuotaWarning(false);

    try {
      console.log("image", image);
      const result = await factCheck(inputText, image ? image.imageUrl : undefined, location || undefined);
      console.log("RESULT", result);

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
    setImage(null); 
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        setImage({
          name: selectedFile.name,
          file: selectedFile,
          imageUrl: event.target?.result as string
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setImage(null);
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-70px)] flex-col items-center justify-center py-4 px-6 sm:p-4">
      {!showResults ? (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-3xl leading-7 w-[70%] md:w-full md:text-4xl md:leading-[39px] tracking-tight font-bold mb-7 text-center">
            Which doubt do you want to clear up?
          </h1>

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
            className="w-full max-w-(--breakpoint-md) bg-[#303030] border-[#303030]"
          >

            {image && (
              <div className="inline-flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5 text-sm">
                <Paperclip className="size-4 text-zinc-400" />
                <span className="max-w-[120px] truncate text-zinc-300">{image.name}</span>
                <button
                  onClick={() => handleRemoveFile()}
                  className="text-zinc-400 cursor-pointer hover:bg-red-600/60 hover:text-red-100 rounded-full p-1 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <PromptInputTextarea
              placeholder="Ask me anything or paste a file..."
              className="text-[#ececec] !text-[18px]"
            />
            <PromptInputActions className="justify-between pt-2">
              <PromptInputAction tooltip="Attach files">
                <label
                  htmlFor="file-upload"
                  className="hover:bg-zinc-800 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    ref={uploadInputRef}
                  />
                  <Paperclip className="text-zinc-400 hover:text-white size-5 transition-colors" />
                </label>
              </PromptInputAction>
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
            Factly is an advanced tool that consults various sources to provide accurate answers. However, it is not infallible and may offer incorrect information. <br />
            We recommend always verifying critical data and consulting official sources to obtain up-to-date and reliable information.
          </p>

          <p className="text-[#ececec] text-[12px] mt-4 text-center flex sm:hidden">
            Factly can make mistakes. Always verify the sources.
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

