"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface WarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

export const Warning = ({ open, onOpenChange, onClose }: WarningProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="hidden" asChild>
        <button>
          Open
        </button>
      </DialogTrigger>
      <DialogContent 
        className="rounded-xl overflow-hidden border-none p-0 min-w-[300px] bg-black"
        showCloseButton={false}  
      >
        <DialogHeader>
          <div>
            <img src="/background.png" alt="" />
          </div>
          <div className="p-4">
            <DialogTitle className="mb-2 text-xl font-bold text-left">
              Welcome to the AI Fact Checking App
            </DialogTitle>
            <DialogDescription className="text-md text-gray-300/80 mb-2 text-left">
              <p className="mb-2">
                This app helps you verify the accuracy of news circulating on the internet. It is a proof-of-concept that explores the use of artificial intelligence to combat misinformation online.
              </p>

              <p className="mb-2">When you see the AI&apos;s response, remember:</p>
              <ul className="list-disc list-inside">
                <li>Always check the sources.</li>
                <li>Verify the date of the news.</li>
                <li>Verify the fact-checking process of the app.</li>
                <li>AI can make mistakes. Always verify the sources.</li>
              </ul>
            </DialogDescription>
            <Button 
              variant="outline" 
              className="w-full text-black cursor-pointer"
              onClick={onClose}
            >
              I got it
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
