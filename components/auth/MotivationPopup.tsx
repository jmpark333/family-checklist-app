"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { getRandomQuote } from "@/lib/quotes";

export function MotivationPopup() {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(getRandomQuote());
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            오늘의 명언
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="text-center text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {quote}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="w-full">
            좋아요! 🎯
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
