const STORAGE_KEY = 'voiceover-usage-limit';
const MAX_ATTEMPTS = parseInt(process.env.NEXT_PUBLIC_MAX_ATTEMPTS ?? '3', 10);
const RESET_PERIOD_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

interface UsageData {
  attempts: number;
  resetAt: number; // timestamp
}

export const usageLimit = {
  /**
   * Check if user can generate a voiceover
   */
  canGenerate: (): { allowed: boolean; remaining: number; resetAt: number | null } => {
    try {
      if (typeof window === 'undefined') {
        return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: null };
      }

      const data = usageLimit.getData();
      const now = Date.now();

      // If reset period has passed, reset the counter
      if (now >= data.resetAt) {
        usageLimit.reset();
        return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: null };
      }

      // Check if user has remaining attempts
      const remaining = MAX_ATTEMPTS - data.attempts;
      const allowed = remaining > 0;

      return {
        allowed,
        remaining: Math.max(0, remaining),
        resetAt: data.resetAt,
      };
    } catch (error) {
      // console.error('Error checking usage limit:', error);
      return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: null };
    }
  },

  /**
   * Increment the usage counter
   */
  incrementUsage: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;

      const data = usageLimit.getData();
      const now = Date.now();

      // Reset if period has passed
      if (now >= data.resetAt) {
        usageLimit.reset();
        return usageLimit.incrementUsage();
      }

      // Increment attempt count
      data.attempts += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      // console.error('Error incrementing usage:', error);
      return false;
    }
  },

  /**
   * Get current usage data
   */
  getData: (): UsageData => {
    try {
      if (typeof window === 'undefined') {
        return {
          attempts: 0,
          resetAt: Date.now() + RESET_PERIOD_MS,
        };
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as UsageData;
        return data;
      }

      // Initialize if not exists
      return usageLimit.reset();
    } catch (error) {
      // console.error('Error getting usage data:', error);
      return {
        attempts: 0,
        resetAt: Date.now() + RESET_PERIOD_MS,
      };
    }
  },

  /**
   * Reset the usage counter
   */
  reset: (): UsageData => {
    try {
      if (typeof window === 'undefined') {
        return {
          attempts: 0,
          resetAt: Date.now() + RESET_PERIOD_MS,
        };
      }

      const newData: UsageData = {
        attempts: 0,
        resetAt: Date.now() + RESET_PERIOD_MS,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      // console.error('Error resetting usage limit:', error);
      return {
        attempts: 0,
        resetAt: Date.now() + RESET_PERIOD_MS,
      };
    }
  },

  /**
   * Get time remaining until reset (in milliseconds)
   */
  getTimeUntilReset: (): number => {
    try {
      const data = usageLimit.getData();
      const now = Date.now();
      return Math.max(0, data.resetAt - now);
    } catch (error) {
      // console.error('Error getting time until reset:', error);
      return 0;
    }
  },

  /**
   * Format time until reset as human-readable string
   */
  formatTimeUntilReset: (): string => {
    try {
      const ms = usageLimit.getTimeUntilReset();
      if (ms === 0) return 'Now';

      const hours = Math.floor(ms / (60 * 60 * 1000));
      const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((ms % (60 * 1000)) / 1000);

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    } catch (error) {
      // console.error('Error formatting time:', error);
      return 'Unknown';
    }
  },

  /**
   * Get maximum attempts allowed
   */
  getMaxAttempts: (): number => MAX_ATTEMPTS,
};
