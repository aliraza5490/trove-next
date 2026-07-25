import React from "react";
import { Sparkles } from "lucide-react";

export function HeroHeading() {
  return (
    <div className="mx-auto text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium mb-3.5 shadow-2xs">
        <Sparkles className="size-3.5 text-primary" />
        <span>Trove AI Workspace</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground/90">
        What can I help you build today?
      </h1>
      <p className="mt-2.5 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
        Research the web, analyze documents, write code, or brainstorm ideas.
      </p>
    </div>
  );
}

export default HeroHeading;
