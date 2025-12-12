/**
 * Date and time utilities for visitor registration
 */

export interface TimeValidationResult {
  isValid: boolean;
  message: string;
  hoursUntilVisit?: number;
  minutesUntilValid?: number;
}

/**
 * Validates if a visit date/time is at least 12 hours from now
 */
export function validateTwelveHourNotice(
  visitDate: string,
  visitTime?: string
): TimeValidationResult {
  // Combine date and time
  let visitDateTime: Date;
  
  if (visitTime) {
    // Parse date and time separately
    const [year, month, day] = visitDate.split('-').map(Number);
    const [hours, minutes] = visitTime.split(':').map(Number);
    visitDateTime = new Date(year, month - 1, day, hours, minutes);
  } else {
    // If no time provided, assume midnight (start of day)
    visitDateTime = new Date(visitDate + 'T00:00:00');
  }

  const now = new Date();
  const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  // Calculate time difference
  const timeDiff = visitDateTime.getTime() - now.getTime();
  const hoursUntilVisit = timeDiff / (1000 * 60 * 60);
  const minutesUntilValid = (twelveHoursFromNow.getTime() - visitDateTime.getTime()) / (1000 * 60);

  // Check if visit is in the past
  if (visitDateTime < now) {
    return {
      isValid: false,
      message: 'Visit date/time cannot be in the past',
      hoursUntilVisit: hoursUntilVisit,
    };
  }

  // Check if visit is at least 12 hours from now
  if (visitDateTime < twelveHoursFromNow) {
    const hoursNeeded = Math.ceil((twelveHoursFromNow.getTime() - visitDateTime.getTime()) / (1000 * 60 * 60));
    return {
      isValid: false,
      message: `Visitor registration must be submitted at least 12 hours before the visit. Please select a date/time at least ${hoursNeeded} hours from now.`,
      hoursUntilVisit: hoursUntilVisit,
      minutesUntilValid: Math.ceil(minutesUntilValid),
    };
  }

  return {
    isValid: true,
    message: `Valid! Visit is ${Math.floor(hoursUntilVisit)} hours from now.`,
    hoursUntilVisit: hoursUntilVisit,
  };
}

/**
 * Get minimum allowed date/time (12 hours from now)
 */
export function getMinimumVisitDateTime(): { date: string; time: string } {
  const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000);
  
  const year = twelveHoursFromNow.getFullYear();
  const month = String(twelveHoursFromNow.getMonth() + 1).padStart(2, '0');
  const day = String(twelveHoursFromNow.getDate()).padStart(2, '0');
  const hours = String(twelveHoursFromNow.getHours()).padStart(2, '0');
  const minutes = String(twelveHoursFromNow.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Get minimum allowed date (today + 1 if less than 12 hours left in day)
 */
export function getMinimumVisitDate(): string {
  const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000);
  
  const year = twelveHoursFromNow.getFullYear();
  const month = String(twelveHoursFromNow.getMonth() + 1).padStart(2, '0');
  const day = String(twelveHoursFromNow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format date/time for display
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get time remaining until a date
 */
export function getTimeRemaining(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date();
  const total = targetDate.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date string (YYYY-MM-DD or other format) is today
 */
export function isTodayString(dateString: string): boolean {
  if (!dateString) return false;
  
  // Try parsing different date formats
  let date: Date;
  
  // If it's already in YYYY-MM-DD format
  if (dateString.includes('-') && dateString.length === 10) {
    date = new Date(dateString + 'T00:00:00');
  }
  // If it's in MM/DD/YYYY format
  else if (dateString.includes('/')) {
    date = new Date(dateString);
  }
  // If it's an ISO timestamp
  else if (dateString.includes('T')) {
    date = new Date(dateString);
  }
  // Otherwise try parsing as-is
  else {
    date = new Date(dateString);
  }
  
  // Check if parsing was successful
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date format: ${dateString}`);
    return false;
  }
  
  return isToday(date);
}

/**
 * Normalize date string to YYYY-MM-DD format
 */
export function normalizeDateString(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString; // Return as-is if can't parse
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if date is within the next N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date <= target && date >= now;
}