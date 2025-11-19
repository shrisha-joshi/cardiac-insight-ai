/**
 * Phase 9: User Feedback Widget
 * Collects user feedback, bug reports, and feature requests
 */

import { useState } from "react";
import { MessageSquare, X, Send, Bug, Lightbulb, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { feedbackService, FeedbackType } from "../../services/feedbackService";
import { cn } from "@/lib/utils";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter your feedback message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await feedbackService.submitFeedback({
        type: feedbackType,
        message: message.trim(),
        email: email.trim() || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      toast({
        title: "✅ Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });

      // Reset form
      setMessage("");
      setEmail("");
      setFeedbackType("general");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "bug", label: "Bug Report", icon: <Bug className="h-4 w-4" />, color: "text-red-500" },
    { value: "feature", label: "Feature Request", icon: <Lightbulb className="h-4 w-4" />, color: "text-yellow-500" },
    { value: "positive", label: "Positive Feedback", icon: <ThumbsUp className="h-4 w-4" />, color: "text-green-500" },
    { value: "negative", label: "Issue/Complaint", icon: <ThumbsDown className="h-4 w-4" />, color: "text-orange-500" },
    { value: "general", label: "General Feedback", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-500" },
  ];

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
          "h-14 w-14 p-0",
          "transition-all hover:scale-110",
          isOpen && "hidden"
        )}
        aria-label="Open Feedback Widget"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Send Feedback</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Feedback Type Selection */}
              <div className="space-y-2">
                <Label>Feedback Type</Label>
                <RadioGroup value={feedbackType} onValueChange={(v) => setFeedbackType(v as FeedbackType)}>
                  {feedbackTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label
                        htmlFor={type.value}
                        className="flex items-center gap-2 cursor-pointer font-normal"
                      >
                        <span className={type.color}>{type.icon}</span>
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="feedback-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="feedback-message"
                  placeholder={
                    feedbackType === "bug"
                      ? "Describe the bug and steps to reproduce..."
                      : feedbackType === "feature"
                      ? "Describe the feature you'd like to see..."
                      : "Share your thoughts with us..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                  required
                />
              </div>

              {/* Optional Email */}
              <div className="space-y-2">
                <Label htmlFor="feedback-email">
                  Email (optional)
                </Label>
                <input
                  id="feedback-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this to follow up if needed
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
