'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowUp,
  AlertCircle,
  Loader2Icon,
  MoonIcon,
  HeartPulse,
  GlassWater,
  Computer
} from 'lucide-react';
import FactCheckResults from '@/components/fact-check-results';
import { factCheck } from '@/actions/action';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea
} from '@/components/ui/prompt-input';
import { FactCheckResponse, Location } from '@/lib/types';
import { motion } from 'motion/react';
import { TooltipContent } from '@/components/ui/tooltip';
import { TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { Warning } from '@/components/modal/warning';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [factCheckData, setFactCheckData] = useState<FactCheckResponse>();
  const [error, setError] = useState<string | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [factCount, setFactCount] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  const examples = [
    {
      text: 'Did man land on the moon?',
      icon: <MoonIcon className="size-4" />
    },
    {
      text: 'Is sodium bicarbonate good for health?',
      icon: <HeartPulse className="size-4" />
    },
    {
      text: 'Is water healthy?',
      icon: <GlassWater className="size-4" />
    },
    {
      text: 'Is Mark Zuckerberg a robot?',
      icon: <Computer className="size-4" />
    }
  ];

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `/api/geocode?lat=${latitude}&lng=${longitude}`
            );
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
            console.error('Error getting location info:', error);
            setLocation({ latitude, longitude });
          }
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const showWarning = globalThis.localStorage.getItem('showed-warning');

    if (showWarning !== "true") {
      setShowWarning(true);
    }
  }, []);

  useEffect(() => {
    const factCount = globalThis.localStorage.getItem('fact-count');
    setFactCount(factCount ? parseInt(factCount) : 0);
  }, [factCount]);

  const handleValueChange = (value: string) => {
    setInputText(value);
  };

  const handleWarningClose = () => {
    globalThis.localStorage.setItem('showed-warning', 'true');
    setShowWarning(false);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setShowQuotaWarning(false);

    if (factCount >= 10) {
      setError('You have reached the maximum number of fact checks.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await factCheck(inputText, location || undefined);

      globalThis.localStorage.setItem('fact-count', (factCount + 1).toString());
      setFactCount(factCount + 1);

      if ('fallback' in result) {
        setFactCheckData(result);
        setShowResults(true);

        if (result.fallback) {
          setShowQuotaWarning(true);
        }
      } else {
        setError(result.error || 'Failed to fact check. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setShowResults(false);
    setInputText('');
    setError(null);
    setShowQuotaWarning(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const buttonVariants = {
    hidden: { scale: 0, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-70px)] flex-col items-center justify-center py-4 px-6 sm:p-4">
      {!showResults ? (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <span className="font-bold mb-2 text-[#ececec] text-[12px] mt-4 text-center flex border border-[#ececec] rounded-full px-4 py-1">
            PoC
          </span>
          <h1 className="text-[35px] leading-7 w-[80%] md:w-full md:text-4xl md:leading-[39px] tracking-tight font-bold mb-7 text-center">
            Which doubt do you want to clear up?
          </h1>

          {showQuotaWarning && (
            <div className="mb-6 w-full p-4 bg-amber-900/20 border border-amber-900/50 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-500 font-medium mb-1">
                  API Quota Limitations
                </h3>
                <p className="text-amber-400/80 text-sm">
                  The fact-checking API is currently experiencing quota
                  limitations. Results may be limited.
                </p>
              </div>
            </div>
          )}

          <PromptInput
            value={inputText}
            onValueChange={handleValueChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="w-full max-w-(--breakpoint-md) bg-[#303030] border-[#303030] shadow-md"
          >
            <PromptInputTextarea
              placeholder="Ask me anything..."
              className="text-[#ececec] !text-[18px]"
            />
            <PromptInputActions className="justify-end pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-[#ececec] text-[14px]">
                    {factCount} / 10
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have {10 - factCount} more fact checks left.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <PromptInputAction
                tooltip={isLoading ? 'Loading...' : 'Send message'}
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full flex sm:justify-center flex-wrap gap-2 mt-4"
          >
            {examples.map(example => (
              <motion.div
                variants={buttonVariants}
                key={example.text}
                className="flex items-center gap-2 cursor-pointer hover:bg-[#303030] transition-all duration-300 active:scale-95 text-[14px] sm:text-md font-sm bg-[#303030] border-[#303030] px-4 py-2 rounded-full"
                onClick={() => setInputText(example.text)}
              >
                {example.icon}
                {example.text}
              </motion.div>
            ))}
          </motion.div>

          <p className="text-[#ececec] text-[10px] mt-4 text-center hidden sm:flex">
            Factly is an advanced tool that consults various sources to provide
            accurate answers. However, it is not infallible and may offer
            incorrect information. <br />
            We recommend always verifying critical data and consulting official
            sources to obtain up-to-date and reliable information.
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

      <Warning
        open={showWarning}
        onOpenChange={setShowWarning}
        onClose={handleWarningClose}
      />
    </main>
  );
}
