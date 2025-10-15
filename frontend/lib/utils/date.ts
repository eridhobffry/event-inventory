/**
 * Date utility functions for inventory management
 */

/**
 * Check if a date is expiring soon (within the specified number of days)
 */
export function isExpiringSoon(expirationDate: string | Date, daysThreshold: number = 7): boolean {
  const expiry = new Date(expirationDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= daysThreshold && diffDays >= 0;
}

/**
 * Check if a date has expired
 */
export function isExpired(expirationDate: string | Date): boolean {
  const expiry = new Date(expirationDate);
  const now = new Date();
  return expiry.getTime() < now.getTime();
}

/**
 * Calculate days until expiration
 * Returns negative number if expired
 */
export function daysUntilExpiry(expirationDate: string | Date): number {
  const expiry = new Date(expirationDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get expiry status with severity level
 */
export function getExpiryStatus(expirationDate: string | Date): {
  status: "expired" | "critical" | "warning" | "good";
  daysRemaining: number;
  message: string;
} {
  const days = daysUntilExpiry(expirationDate);

  if (days < 0) {
    return {
      status: "expired",
      daysRemaining: days,
      message: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`,
    };
  } else if (days === 0) {
    return {
      status: "critical",
      daysRemaining: 0,
      message: "Expires today",
    };
  } else if (days <= 3) {
    return {
      status: "critical",
      daysRemaining: days,
      message: `Expires in ${days} day${days === 1 ? "" : "s"}`,
    };
  } else if (days <= 7) {
    return {
      status: "warning",
      daysRemaining: days,
      message: `Expires in ${days} days`,
    };
  } else {
    return {
      status: "good",
      daysRemaining: days,
      message: `Expires in ${days} days`,
    };
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, includeTime: boolean = false): string {
  const d = new Date(date);

  if (includeTime) {
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date for form inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.abs(Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs < 0;
  const suffix = isPast ? "ago" : "from now";

  if (diffYear > 0) {
    return `${diffYear} year${diffYear === 1 ? "" : "s"} ${suffix}`;
  } else if (diffMonth > 0) {
    return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ${suffix}`;
  } else if (diffWeek > 0) {
    return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ${suffix}`;
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ${suffix}`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ${suffix}`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ${suffix}`;
  } else {
    return "just now";
  }
}
