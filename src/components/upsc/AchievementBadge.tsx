"use client";

import { useEffect, useState } from "react";
import { Award, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  title: string;
  description: string;
  icon: string; // Emoji
  color?: string; // CSS style classes
  isUnlocked?: boolean;
}

export function AchievementBadge({
  title,
  description,
  icon,
  color = "border-[#dcd5c7] bg-[#fffdf8] text-[#13251d]",
  isUnlocked = true,
}: BadgeProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border text-center transition-all duration-300",
        isUnlocked 
          ? cn("shadow-sm transform hover:-translate-y-1 hover:shadow-md", color)
          : "border-dashed border-gray-300 bg-gray-50/50 text-gray-400 opacity-60"
      )}
    >
      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full text-3xl mb-3 shadow-inner",
        isUnlocked ? "bg-white/95" : "bg-gray-200"
      )}>
        {isUnlocked ? icon : "🔒"}
      </div>

      <h4 className={cn("text-sm font-black leading-tight", isUnlocked ? "text-inherit" : "text-gray-500")}>
        {title}
      </h4>
      
      <p className="mt-1.5 text-[10px] font-semibold leading-relaxed opacity-75 max-w-[150px]">
        {description}
      </p>

      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <Sparkles className="h-3.5 w-3.5 text-[#ef9f27] animate-pulse" />
        </div>
      )}
    </div>
  );
}

interface NotificationProps {
  badge: {
    title: string;
    description: string;
    icon: string;
    color: string;
  } | null;
  onClose: () => void;
}

export function AchievementNotification({ badge, onClose }: NotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Trigger cleanup after transition
      }, 5000); // Display for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge || !visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm">
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-2xl border shadow-2xl relative backdrop-blur",
        badge.color
      )}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-md">
          {badge.icon}
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#be4444] flex items-center gap-1">
            <Award className="h-3 w-3 animate-bounce" /> Milestone Unlocked!
          </span>
          <h4 className="text-sm font-black mt-1 leading-snug">{badge.title}</h4>
          <p className="mt-1 text-[10px] font-bold leading-normal opacity-90">{badge.description}</p>
        </div>

        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-3 right-3 text-inherit opacity-60 hover:opacity-100 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
