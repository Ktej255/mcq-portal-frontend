"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  testId: string;
}

export function FeedbackModal({ isOpen, onClose, questionId, testId }: FeedbackModalProps) {
  const [type, setType] = useState('ambiguous');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please provide a brief description of the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, we simulate the submission
      // In a real scenario, this would call a feedback API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Feedback submitted:", { questionId, testId, type, description });
      setIsSuccess(true);
      toast.success("Feedback recorded. Our editorial team will review this.");
      
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setDescription('');
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Feedback Received</h3>
            <p className="text-muted-foreground">Thank you for helping us maintain institutional quality.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Report Content Issue
              </DialogTitle>
              <DialogDescription>
                Help us improve question quality. Describe any ambiguity, error, or formatting issue.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Issue Type</Label>
                <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-2 gap-3">
                  <Label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'ambiguous' ? 'bg-zinc-50 border-zinc-900 dark:bg-zinc-800' : ''}`}>
                    <RadioGroupItem value="ambiguous" id="ambiguous" />
                    <span className="text-sm">Ambiguous</span>
                  </Label>
                  <Label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'incorrect' ? 'bg-zinc-50 border-zinc-900 dark:bg-zinc-800' : ''}`}>
                    <RadioGroupItem value="incorrect" id="incorrect" />
                    <span className="text-sm">Incorrect Answer</span>
                  </Label>
                  <Label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'translation' ? 'bg-zinc-50 border-zinc-900 dark:bg-zinc-800' : ''}`}>
                    <RadioGroupItem value="translation" id="translation" />
                    <span className="text-sm">Translation Error</span>
                  </Label>
                  <Label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'formatting' ? 'bg-zinc-50 border-zinc-900 dark:bg-zinc-800' : ''}`}>
                    <RadioGroupItem value="formatting" id="formatting" />
                    <span className="text-sm">Formatting</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Explain the issue briefly..." 
                  className="min-h-[100px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 gap-2">
                {isSubmitting ? 'Submitting...' : (
                  <>
                    <Send className="w-4 h-4" /> Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
