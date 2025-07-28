const questionsData = {
  default: [
    {
      id: "q1",
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2
    },
    {
      id: "q2", 
      text: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    },
    {
      id: "q3",
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1
    },
    {
      id: "q4",
      text: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1
    },
    {
      id: "q5",
      text: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3
    }
  ],
  science: [
    {
      id: "s1",
      text: "What is the chemical symbol for gold?",
      options: ["Ag", "Au", "Fe", "Cu"],
      correctAnswer: 1
    },
    {
      id: "s2",
      text: "What is the hardest natural substance on Earth?",
      options: ["Steel", "Diamond", "Granite", "Iron"],
      correctAnswer: 1
    },
    {
      id: "s3",
      text: "What is the speed of light?",
      options: ["299,792 km/s", "199,792 km/s", "399,792 km/s", "499,792 km/s"],
      correctAnswer: 0
    },
    {
      id: "s4",
      text: "What is the largest organ in the human body?",
      options: ["Heart", "Brain", "Liver", "Skin"],
      correctAnswer: 3
    },
    {
      id: "s5",
      text: "What is the atomic number of carbon?",
      options: ["4", "6", "8", "12"],
      correctAnswer: 1
    }
  ],
  history: [
    {
      id: "h1",
      text: "In which year did World War II end?",
      options: ["1943", "1944", "1945", "1946"],
      correctAnswer: 2
    },
    {
      id: "h2",
      text: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
      correctAnswer: 2
    },
    {
      id: "h3",
      text: "What year did Columbus discover America?",
      options: ["1490", "1492", "1495", "1500"],
      correctAnswer: 1
    },
    {
      id: "h4",
      text: "Which empire was ruled by Genghis Khan?",
      options: ["Roman Empire", "Mongol Empire", "Ottoman Empire", "British Empire"],
      correctAnswer: 1
    },
    {
      id: "h5",
      text: "What was the name of the ship that sank in 1912?",
      options: ["Lusitania", "Titanic", "Britannic", "Olympic"],
      correctAnswer: 1
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
  return {
    id: quizId,
    name: quizId.charAt(0).toUpperCase() + quizId.slice(1) + ' Quiz',
    questionCount: questions.length,
    questions: questions
  };
}

export function getAllQuizzes() {
  return getAllQuizIds().map(quizId => getQuizInfo(quizId));
} 