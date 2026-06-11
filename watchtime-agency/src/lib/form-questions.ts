export type QuestionType = 'text' | 'email' | 'tel' | 'phone' | 'url' | 'radio';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  placeholder?: string;
  options?: string[];
}

export const FORM_QUESTIONS: FormQuestion[] = [
  {
    id: 'fullName',
    type: 'text',
    title: "What's your full name?",
    subtitle: 'So we know who we are talking to.',
    placeholder: 'e.g. Alex Smith',
  },
  {
    id: 'email',
    type: 'email',
    title: "What's the best email to reach you?",
    subtitle: 'We will send the details of your strategy call here.',
    placeholder: 'you@company.com',
  },
  {
    id: 'phone',
    type: 'phone',
    title: 'And your phone number?',
    subtitle: 'We only use this if we need to confirm your call.',
    placeholder: '60 123 4567',
  },
  {
    id: 'youtubeRole',
    type: 'radio',
    title: "What's the main role YouTube plays in your business right now?",
    options: [
      'Building brand awareness',
      'Generating leads / sales calls',
      'Converting viewers into buyers',
      "It's not working the way I want",
      "I'm not sure yet",
    ],
  },
  {
    id: 'strategyOwner',
    type: 'radio',
    title: 'Who is mainly responsible for your YouTube strategy right now?',
    options: [
      'I handle everything myself',
      'I have a freelancer or VA helping',
      'I have a small content team',
      "Nobody — that's the problem",
    ],
  },
  {
    id: 'frustration',
    type: 'radio',
    title: "What's your biggest frustration with your channel right now?",
    options: [
      "I don't have time to stay consistent",
      "Views aren't converting into leads or sales",
      'I post but nothing seems to grow',
      "Production quality isn't where I want it",
      "I don't know what's actually wrong",
    ],
  },
  {
    id: 'businessType',
    type: 'radio',
    title: 'What does your business primarily sell?',
    options: [
      'Coaching or consulting services',
      'Online courses or programs',
      'SaaS or software',
      'Done-for-you services / agency',
      'Speaking, books, or content',
      'Physical products or e-commerce',
    ],
  },
  {
    id: 'offerPrice',
    type: 'radio',
    title: "What's the typical price of your main offer?",
    options: [
      'Under $500',
      '$500 – $2,000',
      '$2,000 – $10,000',
      '$10,000+',
      'I sell on retainer / subscription',
    ],
  },
  {
    id: 'channelLink',
    type: 'url',
    title: 'What is the link to your channel?',
    subtitle: 'Paste the full URL so our team can take a look.',
    placeholder: 'https://youtube.com/@yourchannel',
  },
  {
    id: 'channelSetup',
    type: 'radio',
    title: 'What best describes your current YouTube setup?',
    options: [
      'Just starting',
      'Posting inconsistently',
      'Consistent but not growing',
      'Growing but not monetizing well',
      'Scaling with a team',
    ],
  },
  {
    id: 'directsToOffer',
    type: 'radio',
    title: 'Do you currently direct viewers to an offer?',
    options: [
      'No',
      'Yes — free lead magnet',
      'Yes — low ticket',
      'Yes — high ticket',
    ],
  },
  {
    id: 'monthlyLeads',
    type: 'radio',
    title: 'On a typical month, how many customers or leads do you generate from YouTube?',
    options: ['0', '1 – 10', '10 – 50', '50 – 200', '200+'],
  },
  {
    id: 'teamSetup',
    type: 'radio',
    title: 'Which of these best describes your team setup?',
    options: [
      'Solo creator',
      'Freelancer support',
      'Small team (2 – 5)',
      'Agency / structured team',
    ],
  },
  {
    id: 'videosPerMonth',
    type: 'radio',
    title: 'How many videos do you publish per month on average?',
    options: ['Less than 1', '1 – 2', '3 – 4', '5+'],
  },
];
