export class Quiz {
  constructor(scriptData) {
    this.data = scriptData;
    this.currentTier = parseInt(localStorage.getItem('tierProgress')) || 1;
    this.score = 0;
    this.streak = 0;
    this.consecutiveCorrect = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.currentQuestion = null;
  }

  generateQuestion() {
    const lastQuestion = this.currentQuestion;
    const availablePool = this.data.filter(item => item.tier <= this.currentTier);
    
    let newQuestion;
    if (availablePool.length === 0) return null;

    do {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      newQuestion = availablePool[randomIndex];
    } while (availablePool.length > 1 && lastQuestion && newQuestion.kana === lastQuestion.kana);

    this.currentQuestion = newQuestion;
    return this.currentQuestion;
  }

  checkAnswer(input) {
    // Mode 1: input is romaji string
    // Mode 2: input is kana character
    const isCorrect = (input.toLowerCase().trim() === this.currentQuestion.romaji.toLowerCase()) ||
                      (input === this.currentQuestion.kana);
    
    if (isCorrect) {
      this.score += 1 * this.currentTier;
      this.streak++;
      this.consecutiveCorrect++;
      this.totalCorrect++;
      const unlocked = this.checkTierUnlock();
      return { correct: true, correctAnswer: this.currentQuestion.romaji, kanaAnswer: this.currentQuestion.kana, tierUnlocked: unlocked };
    } else {
      this.streak = 0;
      this.consecutiveCorrect = 0;
      this.totalWrong++;
      return { correct: false, correctAnswer: this.currentQuestion.romaji, kanaAnswer: this.currentQuestion.kana };
    }
  }

  checkTierUnlock() {
    const UNLOCK_THRESHOLD = 10; 
    if (this.consecutiveCorrect >= UNLOCK_THRESHOLD && this.currentTier < 4) {
      this.currentTier++;
      this.consecutiveCorrect = 0;
      localStorage.setItem('tierProgress', this.currentTier);
      return true; 
    }
    return false;
  }
}
