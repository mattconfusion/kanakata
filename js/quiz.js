export class Quiz {
  constructor(scriptData, isWordMode = false) {
    this.data = scriptData;
    this.isWordMode = isWordMode;
    this.currentTier = parseInt(localStorage.getItem('tierProgress')) || 1;
    this.score = 0;
    this.streak = 0;
    this.consecutiveCorrect = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.currentQuestion = null;
    this.composition = [];
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
    this.composition = [];
    return this.currentQuestion;
  }

  checkAnswer(input, mode) {
    const q = this.currentQuestion;
    
    // Mode 2 (Romaji -> Kana) with Words requires composition
    if (mode === 2 && this.isWordMode) {
      const targetKana = q.kana;
      const currentBuilt = this.composition.join('');
      const remaining = targetKana.substring(currentBuilt.length);
      
      if (remaining.startsWith(input)) {
        this.composition.push(input);
        const isComplete = this.composition.join('') === targetKana;
        
        if (isComplete) {
          const points = q.kana.length > 1 ? q.kana.length : 1;
          this.score += points * this.currentTier;
          this.streak++;
          this.consecutiveCorrect++;
          this.totalCorrect++;
          const unlocked = this.checkTierUnlock();
          return { 
            correct: true, 
            complete: true,
            correctAnswer: q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji), 
            kanaAnswer: q.kana, 
            translation: q.phonetic ? q.romaji : null,
            tierUnlocked: unlocked 
          };
        } else {
          return { correct: true, complete: false };
        }
      } else {
        this.streak = 0;
        this.consecutiveCorrect = 0;
        this.totalWrong++;
        return { correct: false, complete: false, correctAnswer: q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji), kanaAnswer: q.kana };
      }
    }

    // Standard single-answer logic (Mode 1, Mode 3, or Mode 2 without words)
    const answerKey = q.phonetic || q.romaji;
    let isCorrect = false;

    if (Array.isArray(answerKey)) {
      isCorrect = answerKey.some(t => t.toLowerCase().trim() === input.toLowerCase().trim());
    } else {
      isCorrect = (input.toLowerCase().trim() === answerKey.toLowerCase().trim()) ||
                  (input === q.kana);
    }
    
    if (isCorrect) {
      const points = q.kana.length > 1 ? q.kana.length : 1;
      this.score += points * this.currentTier;
      this.streak++;
      this.consecutiveCorrect++;
      this.totalCorrect++;
      const unlocked = this.checkTierUnlock();
      return { 
        correct: true, 
        correctAnswer: q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji), 
        kanaAnswer: q.kana, 
        translation: q.phonetic ? q.romaji : null,
        tierUnlocked: unlocked 
      };
    } else {
      this.streak = 0;
      this.consecutiveCorrect = 0;
      this.totalWrong++;
      return { 
        correct: false, 
        correctAnswer: q.phonetic || (Array.isArray(q.romaji) ? q.romaji[0] : q.romaji), 
        kanaAnswer: q.kana 
      };
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
