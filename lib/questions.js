const questionsData = {
  default: [
    // Round 1 Questions (1-5)
    {
      id: "q1",
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid", "Rome", "Vienna", "Amsterdam", "Brussels"],
      correctAnswers: [
        { option: 2, points: 100 }, // Paris - primary correct answer
        { option: 4, points: 50 },  // Madrid - secondary correct (Spanish capital)
        { option: 5, points: 25 }   // Rome - tertiary correct (Italian capital)
      ]
    },
    {
      id: "q2", 
      text: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn", "Mercury", "Uranus", "Neptune", "Pluto"],
      correctAnswers: [
        { option: 1, points: 100 }, // Mars - primary correct answer
        { option: 0, points: 30 },  // Venus - secondary (reddish appearance)
        { option: 2, points: 20 }   // Jupiter - tertiary (red spot)
      ]
    },
    {
      id: "q3",
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6", "7", "8", "9", "10"],
      correctAnswers: [
        { option: 1, points: 100 }, // 4 - primary correct answer
        { option: 3, points: 20 },  // 6 - secondary (close but wrong)
        { option: 0, points: 10 }   // 3 - tertiary (close but wrong)
      ]
    },
    {
      id: "q4",
      text: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain", "Oscar Wilde", "George Bernard Shaw", "Tennessee Williams", "Arthur Miller"],
      correctAnswers: [
        { option: 1, points: 100 }, // William Shakespeare - primary correct answer
        { option: 4, points: 40 },  // Oscar Wilde - secondary (famous playwright)
        { option: 5, points: 30 }   // George Bernard Shaw - tertiary (famous playwright)
      ]
    },
    {
      id: "q5",
      text: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean", "Southern Ocean", "Mediterranean Sea", "Caribbean Sea", "Red Sea"],
      correctAnswers: [
        { option: 3, points: 100 }, // Pacific Ocean - primary correct answer
        { option: 0, points: 60 },  // Atlantic Ocean - secondary (second largest)
        { option: 1, points: 40 }   // Indian Ocean - tertiary (third largest)
      ]
    },
    // Round 2 Questions (6-10)
    {
      id: "q6",
      text: "What is the chemical symbol for gold?",
      options: ["Ag", "Au", "Fe", "Cu", "Pt", "Pd", "Hg", "Pb"],
      correctAnswers: [
        { option: 1, points: 100 }, // Au - primary correct answer
        { option: 4, points: 40 },  // Pt - secondary (platinum, precious metal)
        { option: 5, points: 30 }   // Pd - tertiary (palladium, precious metal)
      ]
    },
    {
      id: "q7",
      text: "What is the hardest natural substance on Earth?",
      options: ["Steel", "Diamond", "Granite", "Iron", "Titanium", "Tungsten", "Quartz", "Obsidian"],
      correctAnswers: [
        { option: 1, points: 100 }, // Diamond - primary correct answer
        { option: 4, points: 50 },  // Titanium - secondary (very hard metal)
        { option: 5, points: 40 }   // Tungsten - tertiary (very hard metal)
      ]
    },
    {
      id: "q8",
      text: "What is the speed of light?",
      options: ["299,792 km/s", "199,792 km/s", "399,792 km/s", "499,792 km/s", "150,000 km/s", "250,000 km/s", "350,000 km/s", "450,000 km/s"],
      correctAnswers: [
        { option: 0, points: 100 }, // 299,792 km/s - primary correct answer
        { option: 2, points: 30 },  // 399,792 km/s - secondary (close but wrong)
        { option: 1, points: 20 }   // 199,792 km/s - tertiary (close but wrong)
      ]
    },
    {
      id: "q9",
      text: "What is the largest organ in the human body?",
      options: ["Heart", "Brain", "Liver", "Skin", "Lungs", "Kidneys", "Stomach", "Intestines"],
      correctAnswers: [
        { option: 3, points: 100 }, // Skin - primary correct answer
        { option: 1, points: 40 },  // Brain - secondary (large organ)
        { option: 2, points: 30 }   // Liver - tertiary (large organ)
      ]
    },
    {
      id: "q10",
      text: "What is the atomic number of carbon?",
      options: ["4", "6", "8", "12", "14", "16", "18", "20"],
      correctAnswers: [
        { option: 1, points: 100 }, // 6 - primary correct answer
        { option: 2, points: 30 },  // 8 - secondary (close but wrong)
        { option: 0, points: 20 }   // 4 - tertiary (close but wrong)
      ]
    },
    // Round 3 Questions (11-15)
    {
      id: "q11",
      text: "In which year did World War II end?",
      options: ["1943", "1944", "1945", "1946", "1947", "1948", "1949", "1950"],
      correctAnswers: [
        { option: 2, points: 100 }, // 1945 - primary correct answer
        { option: 3, points: 30 },  // 1946 - secondary (close but wrong)
        { option: 1, points: 20 }   // 1944 - tertiary (close but wrong)
      ]
    },
    {
      id: "q12",
      text: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin", "James Madison", "James Monroe", "John Quincy Adams", "Andrew Jackson"],
      correctAnswers: [
        { option: 2, points: 100 }, // George Washington - primary correct answer
        { option: 1, points: 40 },  // John Adams - secondary (second president)
        { option: 0, points: 30 }   // Thomas Jefferson - tertiary (third president)
      ]
    },
    {
      id: "q13",
      text: "What year did Columbus discover America?",
      options: ["1490", "1492", "1495", "1500", "1505", "1510", "1515", "1520"],
      correctAnswers: [
        { option: 1, points: 100 }, // 1492 - primary correct answer
        { option: 3, points: 30 },  // 1500 - secondary (close but wrong)
        { option: 2, points: 20 }   // 1495 - tertiary (close but wrong)
      ]
    },
    {
      id: "q14",
      text: "Which empire was ruled by Genghis Khan?",
      options: ["Roman Empire", "Mongol Empire", "Ottoman Empire", "British Empire", "Persian Empire", "Chinese Empire", "Russian Empire", "Austrian Empire"],
      correctAnswers: [
        { option: 1, points: 100 }, // Mongol Empire - primary correct answer
        { option: 2, points: 40 },  // Ottoman Empire - secondary (large empire)
        { option: 0, points: 30 }   // Roman Empire - tertiary (large empire)
      ]
    },
    {
      id: "q15",
      text: "What was the name of the ship that sank in 1912?",
      options: ["Lusitania", "Titanic", "Britannic", "Olympic", "Queen Mary", "Queen Elizabeth", "Normandie", "Bremen"],
      correctAnswers: [
        { option: 1, points: 100 }, // Titanic - primary correct answer
        { option: 2, points: 50 },  // Britannic - secondary (sister ship)
        { option: 3, points: 40 }   // Olympic - tertiary (sister ship)
      ]
    }
  ],
  science: [
    {
      id: "s1",
      text: "What is the chemical symbol for gold?",
      options: ["Ag", "Au", "Fe", "Cu", "Pt", "Pd", "Hg", "Pb"],
      correctAnswers: [
        { option: 1, points: 100 }, // Au - primary correct answer
        { option: 4, points: 40 },  // Pt - secondary (platinum, precious metal)
        { option: 5, points: 30 }   // Pd - tertiary (palladium, precious metal)
      ]
    },
    {
      id: "s2",
      text: "What is the hardest natural substance on Earth?",
      options: ["Steel", "Diamond", "Granite", "Iron", "Titanium", "Tungsten", "Quartz", "Obsidian"],
      correctAnswers: [
        { option: 1, points: 100 }, // Diamond - primary correct answer
        { option: 4, points: 50 },  // Titanium - secondary (very hard metal)
        { option: 5, points: 40 }   // Tungsten - tertiary (very hard metal)
      ]
    },
    {
      id: "s3",
      text: "What is the speed of light?",
      options: ["299,792 km/s", "199,792 km/s", "399,792 km/s", "499,792 km/s", "150,000 km/s", "250,000 km/s", "350,000 km/s", "450,000 km/s"],
      correctAnswers: [
        { option: 0, points: 100 }, // 299,792 km/s - primary correct answer
        { option: 2, points: 30 },  // 399,792 km/s - secondary (close but wrong)
        { option: 1, points: 20 }   // 199,792 km/s - tertiary (close but wrong)
      ]
    },
    {
      id: "s4",
      text: "What is the largest organ in the human body?",
      options: ["Heart", "Brain", "Liver", "Skin", "Lungs", "Kidneys", "Stomach", "Intestines"],
      correctAnswers: [
        { option: 3, points: 100 }, // Skin - primary correct answer
        { option: 1, points: 40 },  // Brain - secondary (large organ)
        { option: 2, points: 30 }   // Liver - tertiary (large organ)
      ]
    },
    {
      id: "s5",
      text: "What is the atomic number of carbon?",
      options: ["4", "6", "8", "12", "14", "16", "18", "20"],
      correctAnswers: [
        { option: 1, points: 100 }, // 6 - primary correct answer
        { option: 2, points: 30 },  // 8 - secondary (close but wrong)
        { option: 0, points: 20 }   // 4 - tertiary (close but wrong)
      ]
    }
  ],
  history: [
    {
      id: "h1",
      text: "In which year did World War II end?",
      options: ["1943", "1944", "1945", "1946", "1947", "1948", "1949", "1950"],
      correctAnswers: [
        { option: 2, points: 100 }, // 1945 - primary correct answer
        { option: 3, points: 30 },  // 1946 - secondary (close but wrong)
        { option: 1, points: 20 }   // 1944 - tertiary (close but wrong)
      ]
    },
    {
      id: "h2",
      text: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin", "James Madison", "James Monroe", "John Quincy Adams", "Andrew Jackson"],
      correctAnswers: [
        { option: 2, points: 100 }, // George Washington - primary correct answer
        { option: 1, points: 40 },  // John Adams - secondary (second president)
        { option: 0, points: 30 }   // Thomas Jefferson - tertiary (third president)
      ]
    },
    {
      id: "h3",
      text: "What year did Columbus discover America?",
      options: ["1490", "1492", "1495", "1500", "1505", "1510", "1515", "1520"],
      correctAnswers: [
        { option: 1, points: 100 }, // 1492 - primary correct answer
        { option: 3, points: 30 },  // 1500 - secondary (close but wrong)
        { option: 2, points: 20 }   // 1495 - tertiary (close but wrong)
      ]
    },
    {
      id: "h4",
      text: "Which empire was ruled by Genghis Khan?",
      options: ["Roman Empire", "Mongol Empire", "Ottoman Empire", "British Empire", "Persian Empire", "Chinese Empire", "Russian Empire", "Austrian Empire"],
      correctAnswers: [
        { option: 1, points: 100 }, // Mongol Empire - primary correct answer
        { option: 2, points: 40 },  // Ottoman Empire - secondary (large empire)
        { option: 0, points: 30 }   // Roman Empire - tertiary (large empire)
      ]
    },
    {
      id: "h5",
      text: "What was the name of the ship that sank in 1912?",
      options: ["Lusitania", "Titanic", "Britannic", "Olympic", "Queen Mary", "Queen Elizabeth", "Normandie", "Bremen"],
      correctAnswers: [
        { option: 1, points: 100 }, // Titanic - primary correct answer
        { option: 2, points: 50 },  // Britannic - secondary (sister ship)
        { option: 3, points: 40 }   // Olympic - tertiary (sister ship)
      ]
    }
  ]
};

export function getQuestions(quizId = 'default') {
  return questionsData[quizId] || questionsData.default;
}

export function getAllQuizIds() {
  return Object.keys(questionsData);
}

export function getQuizInfo(quizId = 'default') {
  const questions = getQuestions(quizId);
  const totalQuestions = questions.length;
  const questionsPerRound = 5;
  const totalRounds = Math.ceil(totalQuestions / questionsPerRound);
  
  return {
    id: quizId,
    name: quizId.charAt(0).toUpperCase() + quizId.slice(1) + ' Quiz',
    questionCount: totalQuestions,
    totalRounds: totalRounds,
    questionsPerRound: questionsPerRound,
    questions: questions
  };
}

export function getAllQuizzes() {
  return getAllQuizIds().map(quizId => getQuizInfo(quizId));
}

export function getCurrentRound(questionIndex, questionsPerRound = 5) {
  return Math.floor(questionIndex / questionsPerRound) + 1;
}

export function shouldPauseAfterQuestion(questionIndex, questionsPerRound = 5) {
  return (questionIndex + 1) % questionsPerRound === 0;
}

export function getQuestionsForRound(quizId, round, questionsPerRound = 5) {
  const allQuestions = getQuestions(quizId);
  const startIndex = (round - 1) * questionsPerRound;
  const endIndex = Math.min(startIndex + questionsPerRound, allQuestions.length);
  return allQuestions.slice(startIndex, endIndex);
} 