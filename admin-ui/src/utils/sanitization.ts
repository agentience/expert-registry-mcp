/**
 * Sanitization utility for preventing XSS attacks
 * Cleans user input before storage or display
 */
export class SanitizationUtils {
  /**
   * Sanitize text input to prevent XSS attacks
   * @param input - Raw user input
   * @returns Sanitized string safe for storage/display
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Basic sanitization without DOMPurify for now
    let sanitized = input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: and data: URLs
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      // Remove null bytes and control characters
      .replace(/\0/g, '')
      .replace(/[\uFFFE\uFFFF]/g, '')
      .trim();

    return sanitized;
  }

  /**
   * Sanitize query input with additional validation
   * @param query - User query string
   * @returns Sanitized query string
   */
  static sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Basic sanitization
    let sanitized = this.sanitizeText(query);

    // Additional query-specific validation
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length to prevent DoS
    const maxLength = 5000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize data before storing in localStorage
   * @param data - Data to sanitize
   * @returns Sanitized data object
   */
  static sanitizeStorageData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Sanitize string fields
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeText(sanitized[key]);
      } else if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) => 
          typeof item === 'string' ? this.sanitizeText(item) : item
        );
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeStorageData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Validate input against common XSS patterns
   * @param input - Input to validate
   * @returns True if input appears safe
   */
  static isInputSafe(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return true;
    }

    // Check for common XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
    ];

    return !xssPatterns.some(pattern => pattern.test(input));
  }
}