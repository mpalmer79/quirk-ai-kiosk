// frontend/src/components/Modelbudgetselector.js
import React, { useState, useMemo } from 'react';

const ModelBudgetSelector = ({ onBack, onSearch, defaultPayment = 1400 }) => {
  // Basic finance settings
  const [monthlyPayment, setMonthlyPayment] = useState(defaultPayment);
  const [term, setTerm] = useState(84); // months
  const [apr, setApr] = useState(7.0); // %
  const [downPaymentOption, setDownPaymentOption] = useState(10000);
  const [customDownPayment, setCustomDownPayment] = useState('');

  // Resolve actual down payment value
  const downPayment = useMemo(() => {
    if (downPaymentOption === 'custom') {
      const value = parseFloat(customDownPayment.replace(/[^0-9.]/g, ''));
      return isNaN(value) ? 0 : value;
    }
    return downPaymentOption;
  }, [downPaymentOption, customDownPayment]);

  // Core loan math
  const { loanAmount, totalPrice, totalPaid, totalInterest } = useMemo(() => {
    const r = apr / 100 / 12; // monthly interest rate
    const n = term; // number of payments

    if (r === 0) {
      const principal = monthlyPayment * n;
      const total = principal + downPayment;
      return {
        loanAmount: principal,
        totalPrice: total,
        totalPaid: total,
        totalInterest: 0,
      };
    }

    const discountFactor = (1 - Math.pow(1 + r, -n)) / r;
    const principal = monthlyPayment * discountFactor;
    const total = principal + downPayment;
    const totalPaidCalc = monthlyPayment * n + downPayment;

    return {
      loanAmount: principal,
      totalPrice: total,
      totalPaid: totalPaidCalc,
      totalInterest: totalPaidCalc - principal - downPayment,
    };
  }, [monthlyPayment, term, apr, downPayment]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        monthlyPayment,
        term,
        apr,
        downPayment,
        loanAmount,
        totalPrice,
        totalPaid,
        totalInterest,
      });
    }
  };

  const formatMoney = (value) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const formatMoneyExact = (value) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div style={styles.stepContainer}>
      <div style={styles.stepHeader}>
        {onBack && (
          <button style={styles.backButton} onClick={onBack}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
        )}
        <div>
          <div style={styles.stepBadge}>Step 5 of 5</div>
          <h2 style={styles.stepTitle}>Dial in a budget that actually works on paper</h2>
          <p style={styles.stepSubtitle}>
            We&apos;ll estimate your buying power using a real-world payment, term, APR, and down payment.
          </p>
        </div>
      </div>

      {/* Top budget summary */}
      <div style={styles.budgetDisplay}>
        <div style={styles.budgetValue}>
          {formatMoney(monthlyPayment)} <span style={styles.budgetLabelSmall}>/mo</span>
        </div>
        <div style={styles.budgetSeparator}>×</div>
        <div style={styles.budgetValue}>
          {term} <span style={styles.budgetLabelSmall}>months</span>
        </div>
        <div style={styles.budgetSeparator}>@</div>
        <div style={styles.budgetValue}>
          {apr.toFixed(1)}%
          <span style={styles.budgetLabelSmall}> APR</span>
        </div>
        <div style={styles.budgetSeparator}>+</div>
        <div style={styles.budgetValue}>
          {formatMoney(downPayment)}
          <span style={styles.budgetLabelSmall}> down</span>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* Sliders + inputs */}
        <div style={styles.leftColumn}>
          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Monthly payment target
              <span style={styles.sliderValue}>{formatMoney(monthlyPayment)}</span>
            </label>
            <input
              type="range"
              min="300"
              max="2500"
              step="25"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(parseInt(e.target.value, 10))}
              style={styles.slider}
            />
            <div style={styles.sliderScale}>
              <span>$300</span>
              <span>$2500</span>
            </div>
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Term length
              <span style={styles.sliderValue}>{term} months</span>
            </label>
            <input
              type="range"
              min="36"
              max="84"
              step="6"
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value, 10))}
              style={styles.slider}
            />
            <div style={styles.sliderScale}>
              <span>36</span>
              <span>84</span>
            </div>
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              APR (estimate)
              <span style={styles.sliderValue}>{apr.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="1.9"
              max="12.9"
              step="0.1"
              value={apr}
              onChange={(e) => setApr(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderScale}>
              <span>1.9%</span>
              <span>12.9%</span>
            </div>
          </div>

          <div style={styles.downPaymentSection}>
            <div style={styles.sliderLabel}>Down payment</div>
            <div style={styles.downPaymentOptions}>
              {[0, 2500, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  style={{
                    ...styles.optionButton,
                    ...(downPaymentOption === amount ? styles.optionButtonActive : {}),
                  }}
                  onClick={() => setDownPaymentOption(amount)}
                >
                  {formatMoney(amount)}
                </button>
              ))}
              <button
                style={{
                  ...styles.optionButton,
                  ...(downPaymentOption === 'custom' ? styles.optionButtonActive : {}),
                }}
                onClick={() => setDownPaymentOption('custom')}
              >
                Custom
              </button>
            </div>

            {downPaymentOption === 'custom' && (
              <div style={styles.customDownRow}>
                <span style={styles.customDownLabel}>Custom down:</span>
                <input
                  type="text"
                  value={customDownPayment}
                  onChange={(e) => setCustomDownPayment(e.target.value)}
                  placeholder="$7,500"
                  style={styles.customDownInput}
                />
              </div>
            )}
          </div>
        </div>

        {/* Buying power summary */}
        <div style={styles.rightColumn}>
          <div style={styles.buyingPowerCard}>
            <div style={styles.buyingPowerHeader}>Estimated buying power</div>
            <div style={styles.buyingPowerMain}>{formatMoney(totalPrice)}</div>
            <div style={styles.buyingPowerSub}>
              Rough max vehicle price based on your payment, term, APR, and down payment.
            </div>

            <div style={styles.mathBreakdown}>
              <div style={styles.mathRow}>
                <span>Amount financed</span>
                <span>{formatMoneyExact(loanAmount)}</span>
              </div>
              <div style={styles.mathRow}>
                <span>Down payment</span>
                <span>{formatMoneyExact(downPayment)}</span>
              </div>
              <div style={styles.mathDivider} />
              <div style={styles.mathRowStrong}>
                <span>Vehicle price target</span>
                <span>{formatMoneyExact(totalPrice)}</span>
              </div>
            </div>

            <div style={styles.mathSecondary}>
              <div style={styles.mathRow}>
                <span>Total of payments</span>
                <span>{formatMoneyExact(totalPaid)}</span>
              </div>
              <div style={styles.mathRow}>
                <span>Estimated interest paid</span>
                <span>{formatMoneyExact(totalInterest)}</span>
              </div>
            </div>

            <ul style={styles.buyingPowerList}>
              <li>This is an estimate, not an approval.</li>
              <li>Taxes, fees, and rebates will move the numbers around.</li>
              <li>A manager or finance will run real numbers on the vehicle you pick.</li>
            </ul>
          </div>

          <button style={styles.continueButton} onClick={handleSearch}>
            See vehicles that fit this budget
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  stepContainer: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stepHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 0',
    opacity: 0.8,
  },
  stepBadge: {
    display: 'inline-flex',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '8px',
    opacity: 0.8,
  },
  stepTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  },
  stepSubtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    opacity: 0.85,
    maxWidth: '560px',
  },

  budgetDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '16px 20px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(15,15,20,0.85)',
    backdropFilter: 'blur(14px)',
  },
  budgetValue: {
    fontSize: '20px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  budgetLabelSmall: {
    fontSize: '12px',
    fontWeight: 500,
    opacity: 0.8,
    marginLeft: '4px',
  },
  budgetSeparator: {
    fontSize: '18px',
    opacity: 0.6,
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  sliderGroup: {
    padding: '16px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(10,10,14,0.85)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  sliderValue: {
    fontWeight: 600,
    fontSize: '13px',
  },
  slider: {
    width: '100%',
  },
  sliderScale: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    opacity: 0.6,
  },

  downPaymentSection: {
    padding: '16px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(10,10,14,0.85)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  downPaymentOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  optionButton: {
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'transparent',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  optionButtonActive: {
    background: 'white',
    color: '#111',
  },
  customDownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  customDownLabel: {
    fontSize: '12px',
    opacity: 0.8,
  },
  customDownInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'transparent',
    color: 'inherit',
    fontSize: '13px',
  },

  buyingPowerCard: {
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.18)',
    background:
      'radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 55%), rgba(8,8,12,0.95)',
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  buyingPowerHeader: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    opacity: 0.8,
  },
  buyingPowerMain: {
    fontSize: '26px',
    fontWeight: 650,
  },
  buyingPowerSub: {
    fontSize: '12px',
    opacity: 0.8,
  },
  mathBreakdown: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.14)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
  },
  mathSecondary: {
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed rgba(255,255,255,0.14)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    opacity: 0.85,
  },
  mathRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  mathRowStrong: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 600,
  },
  mathDivider: {
    height: '1px',
    margin: '4px 0',
    background: 'rgba(255,255,255,0.14)',
  },

  buyingPowerList: {
    margin: '8px 0 0 16px',
    padding: 0,
    fontSize: '11px',
    opacity: 0.75,
  },

  continueButton: {
    marginTop: '4px',
    alignSelf: 'flex-end',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '999px',
    border: 'none',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default ModelBudgetSelector;
