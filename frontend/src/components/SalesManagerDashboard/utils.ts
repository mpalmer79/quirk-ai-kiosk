/**
 * Sales Manager Dashboard - Utility Functions
 */

import type { PaymentResult, LeaseResult, LeadScoreBadge, StatusBadge } from './types';
import { STEP_LABELS } from './constants';

export const formatCurrency = (val: number | null | undefined): string => {
  if (val == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const getTimeSince = (dateStr: string): string => {
  if (!dateStr) return 'Unknown';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
};

export const getStepLabel = (step: string): string => {
  return STEP_LABELS[step] || step || 'Browsing';
};

export const calculateFinancePayment = (
  principal: number,
  apr: number,
  term: number
): PaymentResult => {
  if (principal <= 0) return { monthly: 0, totalCost: 0, totalInterest: 0 };
  
  const monthlyRate = apr / 100 / 12;
  
  if (monthlyRate === 0) {
    const monthly = Math.round(principal / term);
    return { monthly, totalCost: principal, totalInterest: 0 };
  }
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
    (Math.pow(1 + monthlyRate, term) - 1);
  
  const totalCost = payment * term;
  const totalInterest = totalCost - principal;
  
  return {
    monthly: Math.round(payment),
    totalCost: Math.round(totalCost),
    totalInterest: Math.round(totalInterest),
  };
};

export const calculateLeasePayment = (
  msrp: number,
  salePrice: number,
  downPayment: number,
  term: number,
  residualPercent: number,
  moneyFactor: number
): LeaseResult => {
  if (msrp <= 0) return { monthly: 0, dueAtSigning: 0, residualValue: 0 };
  
  const capitalizedCost = salePrice - downPayment;
  const residualValue = msrp * residualPercent;
  const ACQUISITION_FEE = 895;
  
  const depreciation = (capitalizedCost - residualValue) / term;
  const rentCharge = (capitalizedCost + residualValue) * moneyFactor;
  const monthly = Math.round(depreciation + rentCharge);
  
  const dueAtSigning = downPayment + monthly + ACQUISITION_FEE;
  
  return { 
    monthly, 
    dueAtSigning: Math.round(dueAtSigning), 
    residualValue: Math.round(residualValue) 
  };
};

export const getLeadScoreBadge = (score: number): LeadScoreBadge => {
  if (score >= 70) {
    return { label: 'HOT', color: '#dc2626', bg: '#fef2f2', icon: '🔥' };
  } else if (score >= 40) {
    return { label: 'WARM', color: '#d97706', bg: '#fffbeb', icon: '⚡' };
  }
  return { label: 'COLD', color: '#6b7280', bg: '#f3f4f6', icon: '👀' };
};

export const getStatusBadge = (status: string): StatusBadge => {
  switch (status) {
    case 'ready':
      return { label: 'READY', color: '#059669', bg: '#d1fae5' };
    case 'negotiating':
      return { label: 'NEGOTIATING', color: '#7c3aed', bg: '#ede9fe' };
    case 'draft':
      return { label: 'DRAFT', color: '#6b7280', bg: '#f3f4f6' };
    case 'accepted':
      return { label: 'ACCEPTED', color: '#059669', bg: '#d1fae5' };
    case 'declined':
      return { label: 'DECLINED', color: '#dc2626', bg: '#fef2f2' };
    case 'expired':
      return { label: 'EXPIRED', color: '#9ca3af', bg: '#f3f4f6' };
    default:
      return { label: status.toUpperCase(), color: '#6b7280', bg: '#f3f4f6' };
  }
};
