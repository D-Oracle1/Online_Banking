/**
 * AML (Anti-Money Laundering) Compliance System
 * Monitors transactions for suspicious activity and ensures regulatory compliance
 */

export interface AMLAlert {
  id: string;
  userId: string;
  type: 'LARGE_TRANSACTION' | 'RAPID_MOVEMENT' | 'STRUCTURING' | 'UNUSUAL_PATTERN' | 'HIGH_RISK_COUNTRY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  transactionId?: string;
  amount?: number;
  timestamp: Date;
  status: 'PENDING' | 'REVIEWED' | 'CLEARED' | 'REPORTED';
}

export interface TransactionPattern {
  userId: string;
  last24Hours: {
    count: number;
    totalAmount: number;
  };
  last7Days: {
    count: number;
    totalAmount: number;
  };
  last30Days: {
    count: number;
    totalAmount: number;
  };
}

// AML Thresholds
export const AML_THRESHOLDS = {
  SINGLE_TRANSACTION_LIMIT: 10000, // $10,000 single transaction
  DAILY_TRANSACTION_LIMIT: 15000, // $15,000 per day
  WEEKLY_TRANSACTION_LIMIT: 50000, // $50,000 per week
  MONTHLY_TRANSACTION_LIMIT: 100000, // $100,000 per month
  STRUCTURING_THRESHOLD: 9000, // Just below $10k reporting threshold
  RAPID_TRANSACTIONS_COUNT: 5, // 5+ transactions in 24 hours
  RAPID_TRANSACTIONS_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Check if a transaction triggers AML alerts
 */
export function checkTransactionForAML(
  amount: number,
  userId: string,
  pattern: TransactionPattern
): AMLAlert[] {
  const alerts: AMLAlert[] = [];
  const timestamp = new Date();

  // 1. Large Single Transaction
  if (amount >= AML_THRESHOLDS.SINGLE_TRANSACTION_LIMIT) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'LARGE_TRANSACTION',
      severity: amount >= 50000 ? 'CRITICAL' : amount >= 25000 ? 'HIGH' : 'MEDIUM',
      description: `Large transaction of $${amount.toFixed(2)} detected`,
      amount,
      timestamp,
      status: 'PENDING',
    });
  }

  // 2. Daily Limit Exceeded
  if (pattern.last24Hours.totalAmount + amount > AML_THRESHOLDS.DAILY_TRANSACTION_LIMIT) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'RAPID_MOVEMENT',
      severity: 'HIGH',
      description: `Daily transaction limit exceeded: $${(pattern.last24Hours.totalAmount + amount).toFixed(2)}`,
      amount: pattern.last24Hours.totalAmount + amount,
      timestamp,
      status: 'PENDING',
    });
  }

  // 3. Weekly Limit Exceeded
  if (pattern.last7Days.totalAmount + amount > AML_THRESHOLDS.WEEKLY_TRANSACTION_LIMIT) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'RAPID_MOVEMENT',
      severity: 'HIGH',
      description: `Weekly transaction limit exceeded: $${(pattern.last7Days.totalAmount + amount).toFixed(2)}`,
      amount: pattern.last7Days.totalAmount + amount,
      timestamp,
      status: 'PENDING',
    });
  }

  // 4. Monthly Limit Exceeded
  if (pattern.last30Days.totalAmount + amount > AML_THRESHOLDS.MONTHLY_TRANSACTION_LIMIT) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'UNUSUAL_PATTERN',
      severity: 'CRITICAL',
      description: `Monthly transaction limit exceeded: $${(pattern.last30Days.totalAmount + amount).toFixed(2)}`,
      amount: pattern.last30Days.totalAmount + amount,
      timestamp,
      status: 'PENDING',
    });
  }

  // 5. Structuring Detection (Breaking up large amounts)
  if (
    amount >= AML_THRESHOLDS.STRUCTURING_THRESHOLD &&
    amount < AML_THRESHOLDS.SINGLE_TRANSACTION_LIMIT &&
    pattern.last24Hours.count >= 2
  ) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'STRUCTURING',
      severity: 'HIGH',
      description: `Potential structuring detected: Multiple transactions just below $10k threshold`,
      amount,
      timestamp,
      status: 'PENDING',
    });
  }

  // 6. Rapid Sequential Transactions
  if (pattern.last24Hours.count >= AML_THRESHOLDS.RAPID_TRANSACTIONS_COUNT) {
    alerts.push({
      id: generateAlertId(),
      userId,
      type: 'RAPID_MOVEMENT',
      severity: 'MEDIUM',
      description: `${pattern.last24Hours.count + 1} transactions in 24 hours`,
      timestamp,
      status: 'PENDING',
    });
  }

  return alerts;
}

/**
 * Calculate risk score for a user (0-100)
 */
export function calculateRiskScore(pattern: TransactionPattern, userAge: number): number {
  let score = 0;

  // Transaction volume risk
  if (pattern.last30Days.totalAmount > 100000) score += 40;
  else if (pattern.last30Days.totalAmount > 50000) score += 25;
  else if (pattern.last30Days.totalAmount > 25000) score += 15;

  // Transaction frequency risk
  if (pattern.last7Days.count > 20) score += 30;
  else if (pattern.last7Days.count > 10) score += 20;
  else if (pattern.last7Days.count > 5) score += 10;

  // Account age risk (newer accounts are higher risk)
  if (userAge < 7) score += 20; // Less than a week
  else if (userAge < 30) score += 10; // Less than a month

  // Unusual pattern detection
  const avgTransactionSize = pattern.last30Days.totalAmount / (pattern.last30Days.count || 1);
  if (avgTransactionSize > 5000) score += 10;

  return Math.min(score, 100);
}

/**
 * Determine if enhanced due diligence is required
 */
export function requiresEnhancedDueDiligence(
  amount: number,
  pattern: TransactionPattern,
  riskScore: number
): boolean {
  return (
    amount >= 50000 ||
    pattern.last30Days.totalAmount >= 100000 ||
    riskScore >= 70
  );
}

/**
 * Get AML compliance status
 */
export function getComplianceStatus(riskScore: number): {
  status: 'COMPLIANT' | 'MONITORING' | 'REVIEW_REQUIRED' | 'HIGH_RISK';
  message: string;
  color: string;
} {
  if (riskScore < 30) {
    return {
      status: 'COMPLIANT',
      message: 'Account in good standing',
      color: 'green',
    };
  } else if (riskScore < 50) {
    return {
      status: 'MONITORING',
      message: 'Under routine monitoring',
      color: 'blue',
    };
  } else if (riskScore < 70) {
    return {
      status: 'REVIEW_REQUIRED',
      message: 'Enhanced monitoring required',
      color: 'yellow',
    };
  } else {
    return {
      status: 'HIGH_RISK',
      message: 'High risk - immediate review required',
      color: 'red',
    };
  }
}

/**
 * Generate a unique alert ID
 */
function generateAlertId(): string {
  return `AML-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format AML report for regulatory submission
 */
export function generateSARReport(
  userId: string,
  alerts: AMLAlert[],
  userInfo: {
    fullName: string;
    email: string;
    address?: string;
    idNumber?: string;
  }
): string {
  const reportDate = new Date().toISOString();

  return `
SUSPICIOUS ACTIVITY REPORT (SAR)
Generated: ${reportDate}

SUBJECT INFORMATION:
- User ID: ${userId}
- Full Name: ${userInfo.fullName}
- Email: ${userInfo.email}
- Address: ${userInfo.address || 'Not provided'}
- ID Number: ${userInfo.idNumber || 'Not provided'}

SUSPICIOUS ACTIVITY:
${alerts.map((alert, index) => `
${index + 1}. ${alert.type}
   Severity: ${alert.severity}
   Description: ${alert.description}
   Amount: ${alert.amount ? `$${alert.amount.toFixed(2)}` : 'N/A'}
   Timestamp: ${alert.timestamp.toISOString()}
   Status: ${alert.status}
`).join('\n')}

TOTAL ALERTS: ${alerts.length}
CRITICAL ALERTS: ${alerts.filter(a => a.severity === 'CRITICAL').length}
HIGH ALERTS: ${alerts.filter(a => a.severity === 'HIGH').length}

This report has been generated in accordance with the Bank Secrecy Act (BSA)
and FinCEN reporting requirements.
`.trim();
}

/**
 * Check for PEP (Politically Exposed Person) status
 * In production, this would integrate with external PEP databases
 */
export function checkPEPStatus(userInfo: {
  fullName: string;
  country?: string;
  occupation?: string;
}): {
  isPEP: boolean;
  reason?: string;
} {
  // Simplified PEP check - in production, integrate with external databases
  const pepKeywords = ['minister', 'senator', 'ambassador', 'governor', 'mayor', 'official', 'commissioner'];
  const occupation = userInfo.occupation?.toLowerCase() || '';

  for (const keyword of pepKeywords) {
    if (occupation.includes(keyword)) {
      return {
        isPEP: true,
        reason: `Occupation indicates potential PEP status: ${userInfo.occupation}`,
      };
    }
  }

  return { isPEP: false };
}

/**
 * Watchlist screening (simplified)
 * In production, integrate with OFAC, UN, EU sanctions lists
 */
export function screenAgainstWatchlists(userInfo: {
  fullName: string;
  country?: string;
}): {
  isOnWatchlist: boolean;
  listName?: string;
  reason?: string;
} {
  // High-risk countries (simplified - use official FATF lists in production)
  const highRiskCountries = [
    'iran', 'north korea', 'syria', 'myanmar', 'afghanistan',
  ];

  const country = userInfo.country?.toLowerCase() || '';

  for (const riskCountry of highRiskCountries) {
    if (country.includes(riskCountry)) {
      return {
        isOnWatchlist: true,
        listName: 'High-Risk Jurisdiction',
        reason: `Country flagged as high-risk: ${userInfo.country}`,
      };
    }
  }

  return { isOnWatchlist: false };
}
