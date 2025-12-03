import { useState, useCallback } from 'react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';

export const useQuiz = ({ onComplete, onShowLeaseHelp }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  const questions = QUIZ_QUESTIONS;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isMultiSelect = question?.multiSelect || false;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  const selectedOptions = isMultiSelect 
    ? (answers[question?.id] || []) 
    : [answers[question?.id]];

  const handleAnswer = useCallback((value) => {
    const q = questions[currentQuestion];
    
    if (q.multiSelect) {
      const currentSelections = answers[q.id] || [];
      let newSelections;
      
      if (currentSelections.includes(value)) {
        newSelections = currentSelections.filter(v => v !== value);
      } else if (currentSelections.length < q.maxSelections) {
        newSelections = [...currentSelections, value];
      } else {
        return;
      }
      
      setAnswers(prev => ({ ...prev, [q.id]: newSelections }));
    } else {
      setAnswers(prev => ({ ...prev, [q.id]: value }));
      
      if (q.id === 'paymentType' && value === 'unsure') {
        onShowLeaseHelp?.();
        return;
      }
      
      setTimeout(() => handleNext(), 300);
    }
  }, [currentQuestion, answers, questions, onShowLeaseHelp]);

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      onComplete?.(answers);
    }
  }, [currentQuestion, questions.length, answers, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [currentQuestion]);

  const handleLeaseDecision = useCallback((choice) => {
    setAnswers(prev => ({ ...prev, paymentType: choice }));
    setTimeout(() => handleNext(), 300);
  }, [handleNext]);

  const handleComplete = useCallback(() => {
    onComplete?.(answers);
  }, [answers, onComplete]);

  const hasCurrentAnswer = useCallback(() => {
    const answer = answers[question?.id];
    if (isMultiSelect) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined;
  }, [answers, question, isMultiSelect]);

  return {
    currentQuestion,
    question,
    answers,
    isAnimating,
    progress,
    isMultiSelect,
    isLastQuestion,
    isFirstQuestion,
    selectedOptions,
    totalQuestions: questions.length,
    
    handleAnswer,
    handleNext,
    handlePrevious,
    handleLeaseDecision,
    handleComplete,
    hasCurrentAnswer,
  };
};

export default useQuiz;
