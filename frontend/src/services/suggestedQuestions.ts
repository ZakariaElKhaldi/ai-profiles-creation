/**
 * Suggested Questions Service
 * This service extracts potential questions from document content
 */

// Basic questions that could apply to any document
const COMMON_QUESTIONS = [
  'What is the main topic of this document?',
  'Can you summarize this document?',
  'What are the key points in this document?',
  'Who is the intended audience for this document?',
  'When was this information published?'
];

/**
 * Extract questions based on document content using simple heuristics
 */
export function extractQuestionsFromContent(content: string, maxQuestions: number = 5): string[] {
  // Clean and normalize the content
  const cleanContent = content.replace(/\s+/g, ' ').trim();
  
  // Initialize with common questions
  const suggestedQuestions = [...COMMON_QUESTIONS];
  
  // Extract domain-specific questions based on content patterns
  
  // 1. Look for numbers and statistics which often make good question topics
  const numberPattern = /(\d+(\.\d+)?)\s*(percent|%|people|users|customers|million|billion)/gi;
  let match;
  while ((match = numberPattern.exec(cleanContent)) !== null) {
    const context = cleanContent.substring(
      Math.max(0, match.index - 50),
      Math.min(cleanContent.length, match.index + match[0].length + 50)
    );
    suggestedQuestions.push(`What does the ${match[0]} refer to in this document?`);
  }
  
  // 2. Look for section titles or emphasized text (all caps)
  const sectionPattern = /\b([A-Z][A-Z\s]{4,})\b/g;
  while ((match = sectionPattern.exec(cleanContent)) !== null) {
    suggestedQuestions.push(`Tell me about the ${match[1].toLowerCase()} section.`);
  }
  
  // 3. Look for lists (numbers or bullets)
  if (cleanContent.match(/(\d+\.\s+|\*\s+|\-\s+)/g)) {
    suggestedQuestions.push('What are the main points listed in this document?');
  }
  
  // 4. Look for dates
  const datePattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
  if (cleanContent.match(datePattern)) {
    suggestedQuestions.push('What significant dates are mentioned in this document?');
  }
  
  // 5. Look for technical terms
  const technicalTermPatterns = [
    /\b(analysis|methodology|findings|conclusions|recommendations)\b/gi,
    /\b(algorithm|implementation|configuration|deployment|integration)\b/gi,
    /\b(policy|regulation|compliance|guideline|procedure)\b/gi
  ];
  
  technicalTermPatterns.forEach(pattern => {
    if (cleanContent.match(pattern)) {
      suggestedQuestions.push(`What does the document say about ${pattern.source.slice(2, -2).toLowerCase().split('|')[0]}?`);
    }
  });
  
  // Remove duplicates
  const uniqueQuestions = [...new Set(suggestedQuestions)];
  
  // Return at most maxQuestions questions
  return uniqueQuestions.slice(0, maxQuestions);
}

/**
 * Generate domain-specific questions based on document type
 */
export function getDocumentTypeQuestions(documentType: string): string[] {
  switch (documentType.toLowerCase()) {
    case 'pdf':
    case 'docx':
      return [
        'What are the main sections of this document?',
        'What is the executive summary of this document?'
      ];
    case 'csv':
    case 'xlsx':
      return [
        'What data is contained in this spreadsheet?',
        'What are the trends shown in this data?',
        'What are the maximum and minimum values in this data?'
      ];
    case 'txt':
      return [
        'What is the format of this text file?',
        'Is this a log file or a narrative document?'
      ];
    default:
      return [];
  }
}

/**
 * Combine all sources of questions and return the best ones
 */
export function generateSuggestedQuestions(
  content: string,
  documentType: string,
  documentTitle: string,
  maxQuestions: number = 8
): string[] {
  // Get questions from different sources
  const contentQuestions = extractQuestionsFromContent(content, maxQuestions);
  const typeQuestions = getDocumentTypeQuestions(documentType);
  
  // Add title-based question
  const titleQuestions = [`What does ${documentTitle} tell us about the subject?`];
  
  // Combine and remove duplicates
  const allQuestions = [...contentQuestions, ...typeQuestions, ...titleQuestions];
  const uniqueQuestions = [...new Set(allQuestions)];
  
  // Return at most maxQuestions questions
  return uniqueQuestions.slice(0, maxQuestions);
} 