/**
 * Phase 9: Feedback Service
 * Handles submission and storage of user feedback
 */

import { supabase } from "@/lib/supabase";

export type FeedbackType = "bug" | "feature" | "positive" | "negative" | "general";

export interface FeedbackSubmission {
  type: FeedbackType;
  message: string;
  email?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

export interface StoredFeedback extends FeedbackSubmission {
  id: string;
  created_at: string;
  status: "new" | "in-review" | "resolved" | "dismissed";
  priority?: "low" | "medium" | "high" | "critical";
  admin_notes?: string;
}

class FeedbackService {
  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<void> {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const feedbackData = {
        type: feedback.type,
        message: feedback.message,
        email: feedback.email,
        url: feedback.url,
        user_agent: feedback.userAgent,
        user_id: user?.id,
        status: "new",
        created_at: new Date().toISOString(),
      };

      // Try to save to Supabase
      const { error } = await supabase
        .from("user_feedback")
        .insert([feedbackData]);

      if (error) {
        console.error("[Feedback Service] Database error:", error);
        // Fallback: Save to localStorage
        this.saveToLocalStorage(feedbackData);
      } else {
        if (import.meta.env.DEV) {
          console.log("[Feedback Service] ✅ Feedback saved to database");
        }
      }

      // Send to analytics (if configured)
      this.trackFeedbackEvent(feedback.type);
    } catch (error) {
      console.error("[Feedback Service] Error:", error);
      // Fallback: Save to localStorage
      this.saveToLocalStorage(feedback);
    }
  }

  /**
   * Fallback: Save feedback to localStorage
   */
  private saveToLocalStorage(feedback: any): void {
    try {
      const stored = localStorage.getItem("pending_feedback");
      const pendingFeedback = stored ? JSON.parse(stored) : [];
      
      pendingFeedback.push({
        ...feedback,
        id: `local_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem("pending_feedback", JSON.stringify(pendingFeedback));
      
      if (import.meta.env.DEV) {
        console.log("[Feedback Service] ⚠️ Saved to localStorage (offline mode)");
      }
    } catch (error) {
      console.error("[Feedback Service] localStorage error:", error);
    }
  }

  /**
   * Track feedback event for analytics
   */
  private trackFeedbackEvent(type: FeedbackType): void {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "feedback_submitted", {
        event_category: "user_engagement",
        event_label: type,
      });
    }
  }

  /**
   * Get all feedback (admin only)
   */
  async getAllFeedback(): Promise<StoredFeedback[]> {
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("[Feedback Service] Error fetching feedback:", error);
      return [];
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(
    id: string,
    status: StoredFeedback["status"],
    adminNotes?: string
  ): Promise<void> {
    try {
      const updates: any = { status };
      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from("user_feedback")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("[Feedback Service] Error updating feedback:", error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    total: number;
    byType: Record<FeedbackType, number>;
    byStatus: Record<StoredFeedback["status"], number>;
  }> {
    try {
      const feedback = await this.getAllFeedback();

      const byType: Record<FeedbackType, number> = {
        bug: 0,
        feature: 0,
        positive: 0,
        negative: 0,
        general: 0,
      };

      const byStatus: Record<StoredFeedback["status"], number> = {
        new: 0,
        "in-review": 0,
        resolved: 0,
        dismissed: 0,
      };

      feedback.forEach((item) => {
        byType[item.type]++;
        byStatus[item.status]++;
      });

      return {
        total: feedback.length,
        byType,
        byStatus,
      };
    } catch (error) {
      console.error("[Feedback Service] Error calculating stats:", error);
      return {
        total: 0,
        byType: { bug: 0, feature: 0, positive: 0, negative: 0, general: 0 },
        byStatus: { new: 0, "in-review": 0, resolved: 0, dismissed: 0 },
      };
    }
  }

  /**
   * Sync pending feedback from localStorage to database
   */
  async syncPendingFeedback(): Promise<void> {
    try {
      const stored = localStorage.getItem("pending_feedback");
      if (!stored) return;

      const pendingFeedback = JSON.parse(stored);
      if (!Array.isArray(pendingFeedback) || pendingFeedback.length === 0) {
        return;
      }

      if (import.meta.env.DEV) {
        console.log(`[Feedback Service] Syncing ${pendingFeedback.length} pending feedback items...`);
      }

      for (const feedback of pendingFeedback) {
        const { id, timestamp, ...feedbackData } = feedback;
        
        const { error } = await supabase
          .from("user_feedback")
          .insert([feedbackData]);

        if (error) {
          console.error("[Feedback Service] Sync error for item:", id, error);
        }
      }

      // Clear localStorage after successful sync
      localStorage.removeItem("pending_feedback");
      
      if (import.meta.env.DEV) {
        console.log("[Feedback Service] ✅ Pending feedback synced");
      }
    } catch (error) {
      console.error("[Feedback Service] Error syncing pending feedback:", error);
    }
  }
}

export const feedbackService = new FeedbackService();

// Auto-sync pending feedback when online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    feedbackService.syncPendingFeedback();
  });
}
