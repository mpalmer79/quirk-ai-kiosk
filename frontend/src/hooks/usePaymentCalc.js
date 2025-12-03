import { useState, useMemo, useCallback } from 'react';
import {
  LEASE_CONFIG,
  FINANCE_CONFIG,
  calculateLeasePayment,
  calculateFinancePayment,
  DEFAULT_VEHICLE,
} from '../data/paymentOptions';

export const usePaymentCalc = ({ vehicle, tradeIn }) => {
  const vehicleData = vehicle || DEFAULT_VEHICLE;
  
  const [leaseTerm, setLeaseTerm] = useState(LEASE_CONFIG.defaultTerm);
  const [leaseMiles, setLeaseMiles] = useState(LEASE_CONFIG.defaultMiles);
  const [leaseDown, setLeaseDown] = useState(LEASE_CONFIG.defaultDown);
  
  const [financeTerm, setFinanceTerm] = useState(FINANCE_CONFIG.defaultTerm);
  const [financeDown, setFinanceDown] = useState(FINANCE_CONFIG.defaultDown);
  const [apr, setApr] = useState(FINANCE_CONFIG.defaultApr);
  
  const [tradeValue, setTradeValue] = useState(tradeIn?.estimatedValue || 0);
  const [tradeOwed, setTradeOwed] = useState(tradeIn?.amountOwed || 0);
  
  const tradeEquity = Math.max(0, tradeValue - tradeOwed);
  
  const leaseCalc = useMemo(() => calculateLeasePayment({
    salePrice: vehicleData.salePrice,
    msrp: vehicleData.msrp,
    term: leaseTerm,
    downPayment: leaseDown,
    tradeEquity,
  }), [vehicleData.salePrice, vehicleData.msrp, leaseTerm, leaseDown, tradeEquity]);
  
  const financeCalc = useMemo(() => calculateFinancePayment({
    salePrice: vehicleData.salePrice,
    term: financeTerm,
    apr,
    downPayment: financeDown,
    tradeEquity,
  }), [vehicleData.salePrice, financeTerm, apr, financeDown, tradeEquity]);
  
  const monthlyDifference = financeCalc.monthly - leaseCalc.monthly;
  const annualSavings = monthlyDifference * 12;
  
  const getLeasePaymentData = useCallback(() => ({
    type: 'lease',
    ...leaseCalc,
    term: leaseTerm,
    milesPerYear: leaseMiles,
    downPayment: leaseDown,
  }), [leaseCalc, leaseTerm, leaseMiles, leaseDown]);
  
  const getFinancePaymentData = useCallback(() => ({
    type: 'finance',
    ...financeCalc,
    term: financeTerm,
    apr,
    downPayment: financeDown,
  }), [financeCalc, financeTerm, apr, financeDown]);
  
  const getTradeInData = useCallback(() => {
    if (tradeValue <= 0) return null;
    return {
      estimatedValue: tradeValue,
      amountOwed: tradeOwed,
      equity: tradeEquity,
    };
  }, [tradeValue, tradeOwed, tradeEquity]);
  
  return {
    vehicle: vehicleData,
    
    lease: {
      term: leaseTerm,
      setTerm: setLeaseTerm,
      miles: leaseMiles,
      setMiles: setLeaseMiles,
      down: leaseDown,
      setDown: setLeaseDown,
      calc: leaseCalc,
      terms: LEASE_CONFIG.terms,
      milesOptions: LEASE_CONFIG.milesOptions,
      downRange: LEASE_CONFIG.downPaymentRange,
    },
    
    finance: {
      term: financeTerm,
      setTerm: setFinanceTerm,
      down: financeDown,
      setDown: setFinanceDown,
      apr,
      setApr,
      calc: financeCalc,
      terms: FINANCE_CONFIG.terms,
      aprRange: FINANCE_CONFIG.aprRange,
      downRange: FINANCE_CONFIG.downPaymentRange,
    },
    
    tradeIn: {
      value: tradeValue,
      setValue: setTradeValue,
      owed: tradeOwed,
      setOwed: setTradeOwed,
      equity: tradeEquity,
      hasTradeIn: tradeValue > 0,
    },
    
    comparison: {
      monthlyDifference,
      annualSavings,
      leaseIsCheaper: monthlyDifference > 0,
    },
    
    getLeasePaymentData,
    getFinancePaymentData,
    getTradeInData,
  };
};

export default usePaymentCalc;
