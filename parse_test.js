const parseQuestionsText = (text) => {
  if (!text || !text.trim()) return [];

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 1. Try splitting by explicit numbering like "1.", "2.", "Q1:", etc.
  const questionMatches = [...cleanText.matchAll(/(?:^|\n)\s*(?:(?:प्रश्न|Q|Question)\s*[:.-]?\s*)?(\d+)[\.\):\s-]/gi)];
  
  let blocks = [];
  if (questionMatches.length > 1) {
    for (let i = 0; i < questionMatches.length; i++) {
      const start = questionMatches[i].index;
      const end = i < questionMatches.length - 1 ? questionMatches[i + 1].index : cleanText.length;
      blocks.push(cleanText.slice(start, end).trim());
    }
  } else {
    // 2. Try splitting by double newlines
    blocks = cleanText.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
    
    // 3. Fallback: If there is only 1 block, and it contains many lines, and NO option markers, treat each line as a question.
    if (blocks.length === 1) {
      const lines = blocks[0].split('\n').map(l => l.trim()).filter(Boolean);
      const hasOptions = lines.some(l => /^(?:[A-D]|[1-4]|[क-घ]|\([A-D]\))[\.\):\-\s]/i.test(l));
      
      if (!hasOptions && lines.length > 1) {
        // Treat every line as a separate block
        blocks = lines;
      }
    }
  }

  const results = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let qLine = lines[0];
    let qNumber = idx + 1;

    // Remove leading numbers from the question line
    const numMatch = qLine.match(/^(?:(?:प्रश्न|Q|Question)\s*[:.-]?\s*)?(\d+)[\.\):\s-]\s*(.*)/i);
    if (numMatch) {
      qNumber = parseInt(numMatch[1], 10) || idx + 1;
      qLine = numMatch[2] || qLine;
    } else {
      qLine = qLine.replace(/^(?:प्रश्न|Q|Question)\s*[:.-]?\s*/i, '');
    }

    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let ans = 'A';

    const optAPattern = /^(?:[Aa]|[1]|[क]|\([Aa]\)|\([1]\)|\([क]\))[\.\):\-\s]\s*(.*)/i;
    const optBPattern = /^(?:[Bb]|[2]|[ख]|\([Bb]\)|\([2]\)|\([ख]\))[\.\):\-\s]\s*(.*)/i;
    const optCPattern = /^(?:[Cc]|[3]|[ग]|\([Cc]\)|\([3]\)|\([ग]\))[\.\):\-\s]\s*(.*)/i;
    const optDPattern = /^(?:[Dd]|[4]|[घ]|\([Dd]\)|\([4]\)|\([घ]\))[\.\):\-\s]\s*(.*)/i;
    const ansPattern = /^(?:उत्तर|Ans|Answer|सही जवाब)[:\-\s]*([A-D]|[1-4]|[क-घ])/i;

    for (let i = 1; i < lines.length; i++) {
      const l = lines[i];
      if (optAPattern.test(l)) optA = l.match(optAPattern)[1];
      else if (optBPattern.test(l)) optB = l.match(optBPattern)[1];
      else if (optCPattern.test(l)) optC = l.match(optCPattern)[1];
      else if (optDPattern.test(l)) optD = l.match(optDPattern)[1];
      else if (ansPattern.test(l)) {
        const val = l.match(ansPattern)[1].toUpperCase();
        if (['A', '1', 'क'].includes(val)) ans = 'A';
        if (['B', '2', 'ख'].includes(val)) ans = 'B';
        if (['C', '3', 'ग'].includes(val)) ans = 'C';
        if (['D', '4', 'घ'].includes(val)) ans = 'D';
      }
    }

    // Fallback if options weren't explicitly prefixed
    if ((!optA || !optB) && lines.length >= 5) {
      optA = optA || lines[1];
      optB = optB || lines[2];
      optC = optC || lines[3];
      optD = optD || lines[4];
    } else if (!optA && lines.length === 1) {
       optA = "Option A";
       optB = "Option B";
       optC = "Option C";
       optD = "Option D";
    }

    if (qLine) {
      results.push({
        questionNumber: qNumber,
        question: qLine,
        optionA: optA || 'Option A',
        optionB: optB || 'Option B',
        optionC: optC || 'Option C',
        optionD: optD || 'Option D',
        correctAnswer: ans,
      });
    }
  });

  return results;
}

console.log(parseQuestionsText("Q1. capital of india\nQ2. capital of usa\nQ3. capital of uk"));
