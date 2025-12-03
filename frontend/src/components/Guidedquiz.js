import React, { useState } from 'react';

const GuidedQuiz = ({ navigateTo, updateCustomerData, customerData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showLeaseHelp, setShowLeaseHelp] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const questions = [
    {
      id: 'primaryUse',
      question: 'What will you primarily use this vehicle for?',
      subtitle: 'Select the option that best describes your needs',
      options: [
        { value: 'commute', label: 'Daily Commute', icon: '🏢', desc: 'Getting to work & running errands' },
        { value: 'family', label: 'Family Hauling', icon: '👨‍👩‍👧‍👦', desc: 'Kids, groceries, road trips' },
        { value: 'work', label: 'Work & Towing', icon: '🔧', desc: 'Job sites, hauling, towing trailers' },
        { value: 'weekend', label: 'Weekend Fun', icon: '🏔️', desc: 'Adventures, outdoor activities' },
        { value: 'all', label: 'All of the Above', icon: '✨', desc: 'I need a versatile vehicle' },
      ],
    },
    {
      id: 'passengers',
      question: 'How many passengers do you typically carry?',
      subtitle: 'This helps us recommend the right size',
      options: [
        { value: '1', label: 'Just Me', icon: '👤', desc: 'Solo driver most of the time' },
        { value: '2-4', label: '2-4 People', icon: '👥', desc: 'Partner, friends, or small family' },
        { value: '5+', label: '5+ People', icon: '👨‍👩‍👧‍👦', desc: 'Large family or groups' },
        { value: '3rdRow', label: 'Need 3rd Row', icon: '🚐', desc: 'Maximum seating capacity' },
      ],
    },
    {
      id: 'mileage',
      question: 'How many miles do you drive per year?',
      subtitle: 'This affects whether leasing is right for you',
      options: [
        { value: 'under10k', label: 'Under 10,000', icon: '🏠', desc: 'Light driving, mostly local' },
        { value: '10-15k', label: '10,000 - 15,000', icon: '🚗', desc: 'Average daily commuter' },
        { value: '15-20k', label: '15,000 - 20,000', icon: '🛣️', desc: 'Regular highway miles' },
        { value: 'over20k', label: 'Over 20,000', icon: '✈️', desc: 'Road warrior, lots of travel' },
      ],
    },
    {
      id: 'tradeIn',
      question: 'Do you have a vehicle to trade in?',
      subtitle: 'A trade-in can reduce your payments',
      options: [
        { value: 'yes', label: 'Yes', icon: '✅', desc: 'I have a vehicle to trade' },
        { value: 'no', label: 'No', icon: '➖', desc: 'No trade-in' },
        { value: 'unsure', label: 'Not Sure of Value', icon: '❓', desc: 'I\'d like to get an appraisal' },
      ],
    },
    {
      id: 'paymentType',
      question: 'Are you looking to lease or finance?',
      subtitle: 'Choose what works best for your situation',
      options: [
        { value: 'lease', label: 'Lease', icon: '📅', desc: 'Lower payments, new car every 2-3 years' },
        { value: 'finance', label: 'Finance', icon: '🏦', desc: 'Build equity, own it forever' },
        { value: 'unsure', label: 'Help Me Decide', icon: '🤔', desc: 'Show me the comparison' },
      ],
    },
    {
      id: 'monthlyPayment',
      question: 'What\'s your ideal monthly payment?',
      subtitle: 'We\'ll find vehicles that fit your budget',
      options: [
        { value: 'under400', label: 'Under $400', icon: '💵', desc: 'Economy-focused' },
        { value: '400-600', label: '$400 - $600', icon: '💰', desc: 'Most popular range' },
        { value: '600-800', label: '$600 - $800', icon: '💎', desc: 'Premium options' },
        { value: 'over800', label: '$800+', icon: '👑', desc: 'Luxury & performance' },
        { value: 'showAll', label: 'Show Me Options', icon: '📊', desc: 'I\'m flexible on price' },
      ],
    },
    {
      id: 'downPayment',
      question: 'How much can you put down today?',
      subtitle: 'More down = lower monthly payments',
      options: [
        { value: '0', label: '$0 Down', icon: '0️⃣', desc: 'Minimal upfront cost' },
        { value: '1-3k', label: '$1,000 - $3,000', icon: '💵', desc: 'Standard down payment' },
        { value: '3-5k', label: '$3,000 - $5,000', icon: '💰', desc: 'Reduce monthly payment' },
        { value: '5k+', label: '$5,000+', icon: '💎', desc: 'Maximize payment reduction' },
      ],
    },
    {
      id: 'features',
      question: 'What features matter most to you?',
      subtitle: 'Select up to 3 priorities',
      multiSelect: true,
      maxSelections: 3,
      options: [
        { value: 'safety', label: 'Safety Tech', icon: '🛡️', desc: 'Collision alerts, lane assist' },
        { value: 'towing', label: 'Towing Capacity', icon: '🚛', desc: 'Haul trailers & boats' },
        { value: 'fuel', label: 'Fuel Efficiency', icon: '⛽', desc: 'Save at the pump' },
        { value: 'audio', label: 'Premium Audio', icon: '🔊', desc: 'Bose, upgraded speakers' },
        { value: 'leather', label: 'Leather Seats', icon: '🪑', desc: 'Premium interior' },
        { value: 'carplay', label: 'Apple CarPlay', icon: '📱', desc: 'Smartphone integration' },
      ],
    },
    {
      id: 'timeline',
      question: 'When are you looking to purchase?',
      subtitle: 'This helps us prioritize your inquiry',
      options: [
        { value: 'today', label: 'Today', icon: '🔥', desc: 'Ready to make a deal' },
        { value: 'thisWeek', label: 'This Week', icon: '📅', desc: 'Actively shopping' },
        { value: 'thisMonth', label: 'This Month', icon: '🗓️', desc: 'Still comparing options' },
        { value: 'researching', label: 'Just Researching', icon: '🔍', desc: 'Exploring possibilities' },
      ],
    },
    {
      id: 'rebates',
      question: 'Would you like us to check available rebates & incentives?',
      subtitle: 'We can find special offers that apply to you',
      options: [
        { value: 'yes', label: 'Yes, Maximize Savings', icon: '✅', desc: 'Check all applicable rebates' },
        { value: 'no', label: 'Just Show Price', icon: '💲', desc: 'Show standard pricing' },
      ],
    },
  ];

  const handleAnswer = (value) => {
    const question = questions[currentQuestion];
    
    if (question.multiSelect) {
      const currentSelections = answers[question.id] || [];
      let newSelections;
      
      if (currentSelections.includes(value)) {
        newSelections = currentSelections.filter(v => v !== value);
      } else if (currentSelections.length < question.maxSelections) {
        newSelections = [...currentSelections, value];
      } else {
        return; // Max selections reached
      }
      
      setAnswers(prev => ({ ...prev, [question.id]: newSelections }));
    } else {
      setAnswers(prev => ({ ...prev, [question.id]: value }));
      
      // Special handling for lease/finance question
      if (question.id === 'paymentType' && value === 'unsure') {
        setShowLeaseHelp(true);
        return;
      }
      
      // Auto-advance for single-select
      setTimeout(() => handleNext(), 300);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    updateCustomerData({ quizAnswers: answers });
    navigateTo('inventory');
  };

  const handleLeaseDecision = (choice) => {
    setAnswers(prev => ({ ...prev, paymentType: choice }));
    setShowLeaseHelp(false);
    setTimeout(() => handleNext(), 300);
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isMultiSelect = question.multiSelect;
  const selectedOptions = isMultiSelect ? (answers[question.id] || []) : [answers[question.id]];

  // Lease vs Buy Helper Modal
  if (showLeaseHelp) {
    return (
      <div style={styles.container}>
        <div style={styles.leaseModal}>
          <h2 style={styles.leaseTitle}>Lease vs. Finance: Which is Right for You?</h2>
          
          <div style={styles.leaseComparison}>
            <div style={styles.leaseCard}>
              <div style={styles.leaseCardHeader}>
                <span style={styles.leaseIcon}>📅</span>
                <h3 style={styles.leaseCardTitle}>Lease</h3>
              </div>
              <ul style={styles.leaseFeatures}>
                <li>✓ Lower monthly payments</li>
                <li>✓ New car every 2-3 years</li>
                <li>✓ Always under warranty</li>
                <li>✓ Lower sales tax</li>
                <li>✗ Mileage limits apply</li>
                <li>✗ Don't own the vehicle</li>
              </ul>
              <div style={styles.leaseBestFor}>
                <strong>Best if:</strong> You drive under 15K miles/year and like having a new car regularly
              </div>
              <button 
                style={styles.leaseChoiceButton}
                onClick={() => handleLeaseDecision('lease')}
              >
                I'll Lease
              </button>
            </div>

            <div style={styles.leaseCard}>
              <div style={styles.leaseCardHeader}>
                <span style={styles.leaseIcon}>🏦</span>
                <h3 style={styles.leaseCardTitle}>Finance</h3>
              </div>
              <ul style={styles.leaseFeatures}>
                <li>✓ Build equity over time</li>
                <li>✓ No mileage restrictions</li>
                <li>✓ Customize your vehicle</li>
                <li>✓ Own it after payoff</li>
                <li>✗ Higher monthly payments</li>
                <li>✗ Maintenance costs later</li>
              </ul>
              <div style={styles.leaseBestFor}>
                <strong>Best if:</strong> You drive a lot, want to keep it long-term, or plan to customize
              </div>
              <button 
                style={styles.leaseChoiceButton}
                onClick={() => handleLeaseDecision('finance')}
              >
                I'll Finance
              </button>
            </div>
          </div>

          {/* AI Recommendation based on mileage answer */}
          {answers.mileage && (
            <div style={styles.aiRecommendation}>
              <div style={styles.aiIcon}>🤖</div>
              <div style={styles.aiText}>
                <strong>AI Recommendation:</strong> Based on your driving habits 
                ({answers.mileage === 'under10k' || answers.mileage === '10-15k' 
                  ? 'under 15K miles/year' 
                  : 'over 15K miles/year'}), 
                {answers.mileage === 'under10k' || answers.mileage === '10-15k'
                  ? ' leasing could save you money with lower monthly payments!'
                  : ' financing might be better to avoid mileage penalties.'}
              </div>
            </div>
          )}

          <button 
            style={styles.backToQuiz}
            onClick={() => setShowLeaseHelp(false)}
          >
            ← Back to question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Progress Bar */}
      <div style={styles.progressSection}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      {/* Question Content */}
      <div 
        style={{
          ...styles.questionContent,
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateX(-20px)' : 'translateX(0)',
        }}
      >
        <div style={styles.questionHeader}>
          <h1 style={styles.questionTitle}>{question.question}</h1>
          <p style={styles.questionSubtitle}>{question.subtitle}</p>
        </div>

        {/* Options Grid */}
        <div style={{
          ...styles.optionsGrid,
          gridTemplateColumns: question.options.length <= 4 
            ? 'repeat(auto-fit, minmax(240px, 1fr))' 
            : 'repeat(auto-fit, minmax(180px, 1fr))',
        }}>
          {question.options.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <button
                key={option.value}
                style={{
                  ...styles.optionCard,
                  borderColor: isSelected ? '#1B7340' : 'rgba(255,255,255,0.1)',
                  background: isSelected 
                    ? 'rgba(27, 115, 64, 0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
                onClick={() => handleAnswer(option.value)}
              >
                <span style={styles.optionIcon}>{option.icon}</span>
                <span style={styles.optionLabel}>{option.label}</span>
                <span style={styles.optionDesc}>{option.desc}</span>
                {isSelected && (
                  <div style={styles.checkmark}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Multi-select helper */}
        {isMultiSelect && (
          <p style={styles.multiSelectHint}>
            {selectedOptions.length} of {question.maxSelections} selected
          </p>
        )}
      </div>

      {/* Navigation */}
      <div style={styles.navigation}>
        <button 
          style={{
            ...styles.navButton,
            opacity: currentQuestion === 0 ? 0.3 : 1,
          }}
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Previous
        </button>

        {isMultiSelect && (
          <button 
            style={styles.continueButton}
            onClick={handleNext}
          >
            {currentQuestion === questions.length - 1 ? 'See My Matches' : 'Continue'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}

        {currentQuestion === questions.length - 1 && !isMultiSelect && answers[question.id] && (
          <button 
            style={styles.continueButton}
            onClick={handleComplete}
          >
            See My Matches
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 40px',
    overflow: 'auto',
  },
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '40px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1B7340 0%, #4ade80 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  questionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  questionHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  questionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  questionSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  optionsGrid: {
    display: 'grid',
    gap: '16px',
    width: '100%',
    maxWidth: '800px',
  },
  optionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    borderRadius: '16px',
    border: '2px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    textAlign: 'center',
  },
  optionIcon: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  optionLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  },
  optionDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  checkmark: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#1B7340',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  multiSelectHint: {
    marginTop: '16px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  // Lease Helper Modal Styles
  leaseModal: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  leaseTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '32px',
  },
  leaseComparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  leaseCard: {
    padding: '24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  leaseCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  leaseIcon: {
    fontSize: '32px',
  },
  leaseCardTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  leaseFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 16px 0',
  },
  leaseBestFor: {
    padding: '12px',
    background: 'rgba(27, 115, 64, 0.1)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '16px',
  },
  leaseChoiceButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  aiRecommendation: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    background: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  aiIcon: {
    fontSize: '32px',
  },
  aiText: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.5',
  },
  backToQuiz: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
  },
};

export default GuidedQuiz;
