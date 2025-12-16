import type { ObjectionCategory } from './types';

export const SUGGESTED_PROMPTS = [
  "What's the best family SUV under $50K?",
  "I'm in for service today and am curious about what's new with Chevrolet.",
  "¿Puedo hablar contigo en español?",
  "I have a long commute. I need a fuel efficient vehicle.",
  "I want a sporty car with good tech features.",
  "What do you have for electric vehicles?",
];

export const OBJECTION_CATEGORIES: ObjectionCategory[] = [
  {
    id: 'price',
    label: 'Price & Payment',
    icon: '💰',
    prompts: [
      "This seems expensive - what can you do on price?",
      "What would my monthly payment be?",
      "Do you have any rebates or incentives?",
      "Is there room to negotiate?",
    ],
  },
  {
    id: 'timing',
    label: 'Timing & Decision',
    icon: '⏰',
    prompts: [
      "I'm not ready to buy today",
      "I need to think about it",
      "I want to shop around first",
      "I'm just looking for now",
    ],
  },
  {
    id: 'trade',
    label: 'Trade-In',
    icon: '🚗',
    prompts: [
      "What's my trade-in worth?",
      "I still owe money on my current car",
      "My car needs some work - will you still take it?",
      "I want to keep my current car",
    ],
  },
  {
    id: 'spouse',
    label: 'Decision Makers',
    icon: '👥',
    prompts: [
      "I need to talk to my spouse first",
      "My husband/wife isn't here",
      "We make decisions together",
      "Can you send me information to share?",
    ],
  },
  {
    id: 'credit',
    label: 'Financing & Credit',
    icon: '📊',
    prompts: [
      "I'm worried about my credit",
      "What interest rate can I get?",
      "Do you work with all credit types?",
      "I've been turned down before",
    ],
  },
  {
    id: 'vehicle',
    label: 'Vehicle Concerns',
    icon: '🔧',
    prompts: [
      "Is this reliable?",
      "What's the warranty coverage?",
      "How does this compare to competitors?",
      "What about maintenance costs?",
    ],
  },
];

// Spouse/partner objection responses
export const SPOUSE_RESPONSES = [
  {
    triggers: ['spouse', 'husband', 'wife', 'partner', 'significant other', 'talk to my', 'check with'],
    responses: [
      "I completely understand wanting to include your partner in this decision - buying a vehicle is a big choice! Would it help if I prepared a detailed summary you could share with them?",
      "That makes total sense! Many of our customers like to discuss together. I can put together all the specs, pricing, and photos so you have everything to review together.",
      "Absolutely, it's important you're both on the same page. Would you like me to help you prepare the key points to discuss?",
    ],
    followups: [
      "Would you like to schedule a time to come back together?",
      "Can I prepare a comparison sheet for you to take home?",
      "Would a video call work so your partner can see the vehicle?",
      "Should I email you the details to share?",
    ],
  },
  {
    triggers: ['they need to see', 'bring them', 'come back with', 'not here'],
    responses: [
      "I'd love to meet them! In the meantime, let me get you set up with all the information - photos, specs, and pricing - so you can give them a preview.",
      "That would be great! Would it help to take some photos or a video of the vehicle to show them tonight?",
    ],
    followups: [
      "What aspects would be most important for them to know about?",
      "Would they like to call them right now so I can answer their questions?",
      "I can prepare a detailed summary to share with them",
      "Would they like to come see this vehicle in person?",
      "Can I get the keys so you can take it home to show them?",
    ],
  },
];

export const INITIAL_EXTRACTED_DATA = {
  vehicleInterest: { model: null, bodyType: null, features: [] },
  budget: { min: null, max: null, monthlyPayment: null, downPayment: null },
  tradeIn: { 
    hasTrade: null, 
    vehicle: null, 
    hasPayoff: null, 
    payoffAmount: null, 
    monthlyPayment: null, 
    financedWith: null 
  }
};
