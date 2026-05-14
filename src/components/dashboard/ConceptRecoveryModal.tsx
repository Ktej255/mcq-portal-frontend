"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecoveryPath {
  primary_topic: string;
  suggested_prerequisites: { title: string; priority: string }[];
  message: string;
}

export const ConceptRecoveryModal = ({ 
  isOpen, 
  onClose, 
  path 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  path: RecoveryPath | null 
}) => {
  if (!path) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[3rem] p-10 gap-8">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <DialogTitle className="text-4xl font-black tracking-tighter">Structural Weakness.</DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-lg leading-relaxed">
            We've detected a repeated failure pattern in <span className="text-zinc-900 font-bold">{path.primary_topic}</span>. 
            Continuing to drill this topic without foundational recovery may cause prepare-burnout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recommended Recovery Path</p>
          <div className="space-y-3">
            {path.suggested_prerequisites.map((step, i) => (
              <div key={i} className="group p-5 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-xs font-black text-zinc-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{step.title}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Estimated 15m to complete</p>
                  </div>
                </div>
                <Badge variant="outline" className={step.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}>
                  {step.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
          <BrainCircuit className="w-6 h-6 text-blue-600 mt-1" />
          <p className="text-xs text-blue-900/70 font-medium leading-relaxed">
            <span className="font-bold text-blue-900">Pedagogical Note:</span> Mastering these prerequisites will stabilize your mental model, making complex {path.primary_topic} questions significantly easier to retain.
          </p>
        </div>

        <DialogFooter className="sm:justify-start gap-4">
          <Button 
            onClick={() => window.location.href = '/drills/recovery'}
            className="flex-1 h-16 rounded-2xl bg-zinc-900 text-white font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10"
          >
            START RECOVERY <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-16 rounded-2xl border-zinc-200 font-bold px-8"
          >
            NOT NOW
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
