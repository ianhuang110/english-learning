
document.addEventListener('DOMContentLoaded', () => {
    const btnAuto = document.getElementById('btn-auto');
    const btnManual = document.getElementById('btn-manual');
    const btnPrint = document.getElementById('btn-print');
    const manualArea = document.getElementById('manual-input-area');
    const btnSubmitManual = document.getElementById('btn-submit-manual');
    const cardGrid = document.getElementById('card-grid');
    const wordCount = document.getElementById('word-count');
    const statsBar = document.getElementById('stats-bar');

    const btnQuiz = document.getElementById('btn-quiz');
    const quizOverlay = document.getElementById('quiz-overlay');
    const btnCloseQuiz = document.getElementById('btn-close-quiz');
    const btnRestartQuiz = document.getElementById('btn-restart-quiz');
    const quizProgress = document.getElementById('quiz-progress');
    const quizSentence = document.getElementById('quiz-sentence');
    const quizTranslation = document.getElementById('quiz-translation');
    const quizOptions = document.getElementById('quiz-options');
    const quizQuestionArea = document.getElementById('quiz-question-area');
    const quizResultArea = document.getElementById('quiz-result-area');
    const quizAccuracy = document.getElementById('quiz-accuracy');
    const quizResultList = document.getElementById('quiz-result-list');

    let currentQuizWords = [];
    let currentQuestionIndex = 0;
    let quizResults = [];

    // Quiz Game Events
    btnQuiz.addEventListener('click', () => {
        initQuiz();
    });

    btnCloseQuiz.addEventListener('click', () => {
        quizOverlay.classList.add('hidden');
    });

    btnRestartQuiz.addEventListener('click', () => {
        initQuiz();
    });

    function initQuiz() {
        currentQuizWords = getRandomSelection(VOCABULARY_DATA, 20);
        currentQuestionIndex = 0;
        quizResults = [];

        quizResultArea.classList.add('hidden');
        quizQuestionArea.classList.remove('hidden');
        quizOptions.classList.remove('hidden');
        quizOverlay.classList.remove('hidden');

        showQuestion();
    }

    function showQuestion() {
        const currentWordObj = currentQuizWords[currentQuestionIndex];
        quizProgress.textContent = `題目 ${currentQuestionIndex + 1} / 20`;

        // Mask sentence
        const masked = maskSentence(currentWordObj.sentence, currentWordObj.word);
        quizSentence.textContent = masked;
        quizTranslation.textContent = currentWordObj.translation;

        // Generate Options (8 options)
        const options = generateOptions(currentWordObj.word);
        quizOptions.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(opt));
            quizOptions.appendChild(btn);
        });
    }

    function maskSentence(sentence, word) {
        // Handle variations by checking for the word stem and common suffixes
        // We escape the word to be safe, then allow optional common endings
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWord}(s|es|ed|ing)?\\b`, 'gi');

        let masked = sentence.replace(regex, '_____');

        // If still not masked (e.g. irregular plurals or different stem), 
        // fallback to a simpler find-and-replace for the literal word
        if (masked === sentence) {
            const simpleRegex = new RegExp(escapedWord, 'gi');
            masked = sentence.replace(simpleRegex, '_____');
        }

        return masked;
    }

    function generateOptions(correctWord) {
        const distractors = [];
        const allWordsExceptCorrect = VOCABULARY_DATA.filter(item => item.word !== correctWord);

        const randomDistractors = getRandomSelection(allWordsExceptCorrect, 7);
        randomDistractors.forEach(item => distractors.push(item.word));

        const finalOptions = [correctWord, ...distractors];
        return shuffle(finalOptions);
    }

    function handleAnswer(selectedWord) {
        const correctWord = currentQuizWords[currentQuestionIndex].word;
        const isCorrect = selectedWord.toLowerCase() === correctWord.toLowerCase();

        quizResults.push({
            word: correctWord,
            selected: selectedWord,
            isCorrect: isCorrect,
            sentence: currentQuizWords[currentQuestionIndex].sentence
        });

        currentQuestionIndex++;
        if (currentQuestionIndex < 20) {
            showQuestion();
        } else {
            showQuizResults();
        }
    }

    function showQuizResults() {
        quizQuestionArea.classList.add('hidden');
        quizOptions.classList.add('hidden');
        quizOptions.innerHTML = ''; // Clear options
        quizResultArea.classList.remove('hidden');
        quizProgress.textContent = "測驗結果";

        const correctCount = quizResults.filter(r => r.isCorrect).length;
        const accuracy = Math.round((correctCount / 20) * 100);
        quizAccuracy.textContent = `${accuracy}%`;

        quizResultList.innerHTML = '';
        quizResults.forEach((res, index) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-status ${res.isCorrect ? 'status-correct' : 'status-incorrect'}">
                    ${res.isCorrect ? '✓' : '✗'}
                </div>
                <div class="result-info">
                    <strong>第 ${index + 1} 題：${res.word}</strong>
                    <span>${res.isCorrect ? '正確' : `錯誤 (你選了 ${res.selected})`}</span>
                    <div style="font-size: 0.85rem; color: #636e72; margin-top: 4px;">${res.sentence}</div>
                </div>
            `;
            quizResultList.appendChild(item);
        });
    }

    // Toggle Manual Area
    btnManual.addEventListener('click', () => {
        manualArea.classList.toggle('hidden');
    });

    // Auto-generate click - random selection + alphabetical sort
    btnAuto.addEventListener('click', () => {
        const random50 = getRandomSelection(VOCABULARY_DATA, 50);
        random50.sort((a, b) => a.word.localeCompare(b.word));
        generateCards(random50);
    });

    // Manual Submit
    btnSubmitManual.addEventListener('click', () => {
        const text = document.getElementById('manual-text').value;
        const manualData = parseManualInput(text);
        if (manualData.length > 0) {
            manualData.sort((a, b) => a.word.localeCompare(b.word));
            generateCards(manualData);
            manualArea.classList.add('hidden');
        } else {
            alert('請輸入正確格式的單字內容喔！');
        }
    });

    // Print
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Auto-generate on load - random selection + alphabetical sort
    const initialRandom50 = getRandomSelection(VOCABULARY_DATA, 50);
    initialRandom50.sort((a, b) => a.word.localeCompare(b.word));
    generateCards(initialRandom50);

    /**
     * Fisher-Yates Shuffle Algorithm
     */
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array]; // Work on a copy

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    }

    /**
     * Get a random selection of N items from an array
     */
    function getRandomSelection(array, count) {
        const shuffled = shuffle(array);
        return shuffled.slice(0, count);
    }

    function parseManualInput(text) {
        const lines = text.split('\n');
        const results = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.split('/');
            const head = parts[0] || "";
            const sample = parts[1] || "";

            const wordMatch = head.match(/^([^\[]+)/);
            const ipaMatch = head.match(/\[([^\]]+)\]/);
            const chiMatch = head.replace(/^[^\[]+(\[[^\]]+\])?/, "").trim();

            if (wordMatch) {
                results.push({
                    word: wordMatch[0].trim(),
                    ipa: ipaMatch ? `[${ipaMatch[1]}]` : "",
                    chinese: chiMatch || "無翻譯",
                    sentence: sample.trim().split(/[。！？\s]/)[0] || "No sentence.",
                    translation: sample.trim().replace(/^.+?[\.\?\!]\s*/, "") || ""
                });
            }
        });
        return results;
    }

    function generateCards(data) {
        cardGrid.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'vocab-card';
            card.innerHTML = `
                <div class="word-header">
                    <span class="word-main clickable-text">${item.word}</span>
                    <span class="word-ipa">${item.ipa}</span>
                </div>
                <div class="word-chinese">${item.chinese}</div>
                <div class="sentence-eng clickable-text">${item.sentence}</div>
                <div class="sentence-chi">${item.translation}</div>
            `;

            // Speak word on header click
            card.querySelector('.word-main').addEventListener('click', (e) => {
                e.stopPropagation();
                speak(item.word);
            });

            // Speak sentence on sentence click
            card.querySelector('.sentence-eng').addEventListener('click', (e) => {
                e.stopPropagation();
                speak(item.sentence);
            });

            // General card click = speak word (default behavior)
            card.addEventListener('click', () => {
                speak(item.word);
            });

            cardGrid.appendChild(card);
        });

        wordCount.textContent = data.length;
        statsBar.classList.remove('hidden');

        if (data.length > 0) {
            window.scrollTo({ top: statsBar.offsetTop - 20, behavior: 'smooth' });
        }
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
});
