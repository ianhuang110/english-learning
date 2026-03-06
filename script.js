
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

    // Spelling Game DOM
    const btnSpelling = document.getElementById('btn-spelling');
    const spellingOverlay = document.getElementById('spelling-overlay');
    const btnCloseSpelling = document.getElementById('btn-close-spelling');
    const btnRestartSpelling = document.getElementById('btn-restart-spelling');
    const spellingProgress = document.getElementById('spelling-progress');
    const spellingTranslationDisplay = document.getElementById('spelling-translation-display');
    const spellingIpaDisplay = document.getElementById('spelling-ipa-display');
    const spellingInputArea = document.getElementById('spelling-input-area');
    const letterPool = document.getElementById('letter-pool');
    const btnSpellingReset = document.getElementById('btn-spelling-reset');
    const btnSpellingDelete = document.getElementById('btn-spelling-delete');
    const btnSpellingSubmit = document.getElementById('btn-spelling-submit');
    const spellingResultArea = document.getElementById('spelling-result-area');
    const spellingAccuracy = document.getElementById('spelling-accuracy');
    const spellingResultList = document.getElementById('spelling-result-list');
    const spellingQuestionArea = document.getElementById('spelling-question-area');

    let currentQuizWords = [];
    let currentQuestionIndex = 0;
    let quizResults = [];
    let currentDifficulty = 'low';

    // Spelling Game State
    let currentSpellingWords = [];
    let currentSpellingIndex = 0;
    let currentSpellingInput = [];
    let spellingResults = [];

    // Difficulty Toggle Events
    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentDifficulty = e.target.value;
            refreshCurrentCards();
        });
    });

    function refreshCurrentCards() {
        const cards = document.querySelectorAll('.vocab-card');
        if (cards.length > 0) {
            // Re-render based on current data to ensure difficulty logic applies
            // For simplicity, we can just trigger a regeneration if we store the latest data
            // But let's just update visibility classes for existing cards if possible
            // Actually, regenerate is cleaner to handle the "Hint" button injection
            btnAuto.click(); // Re-trigger auto-gen or just use cached data
        }
    }

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

    // Spelling Game Events
    btnSpelling.addEventListener('click', () => {
        initSpellingGame();
    });

    btnCloseSpelling.addEventListener('click', () => {
        spellingOverlay.classList.add('hidden');
    });

    btnRestartSpelling.addEventListener('click', () => {
        initSpellingGame();
    });

    btnSpellingReset.addEventListener('click', () => {
        currentSpellingInput = [];
        updateSpellingUI();
    });

    btnSpellingDelete.addEventListener('click', () => {
        currentSpellingInput.pop();
        updateSpellingUI();
    });

    btnSpellingSubmit.addEventListener('click', () => {
        checkSpellingAnswer();
    });

    function initQuiz() {
        currentQuizWords = getRandomSelection(VOCABULARY_DATA, 3);
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
        quizProgress.textContent = `題目 ${currentQuestionIndex + 1} / 3`;

        // Mask sentence
        const masked = maskSentence(currentWordObj.sentence, currentWordObj.word);
        quizSentence.textContent = masked;

        quizTranslation.textContent = currentWordObj.translation;
        if (currentDifficulty === 'high') {
            quizTranslation.classList.add('hidden-translation');

            // Add hint button if not exists
            let hintBtn = document.getElementById('quiz-hint-btn');
            if (!hintBtn) {
                hintBtn = document.createElement('button');
                hintBtn.id = 'quiz-hint-btn';
                hintBtn.className = 'quiz-hint-btn';
                hintBtn.textContent = '💡 顯示中文提示';
                hintBtn.onclick = () => {
                    quizTranslation.classList.add('revealed');
                    hintBtn.classList.add('hidden');
                };
                quizTranslation.parentNode.insertBefore(hintBtn, quizTranslation.nextSibling);
            } else {
                hintBtn.classList.remove('hidden');
                quizTranslation.classList.remove('revealed');
            }
        } else {
            quizTranslation.classList.remove('hidden-translation', 'revealed');
            const hintBtn = document.getElementById('quiz-hint-btn');
            if (hintBtn) hintBtn.classList.add('hidden');
        }

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
        if (currentQuestionIndex < 3) {
            showQuestion();
        } else {
            showQuizResults();
        }
    }

    // Spelling Game Functions
    function initSpellingGame() {
        currentSpellingWords = getRandomSelection(VOCABULARY_DATA, 5);
        currentSpellingIndex = 0;
        spellingResults = [];

        spellingResultArea.classList.add('hidden');
        spellingQuestionArea.classList.remove('hidden');
        spellingOverlay.classList.remove('hidden');

        showSpellingQuestion();
    }

    function showSpellingQuestion() {
        const currentWordObj = currentSpellingWords[currentSpellingIndex];
        const word = currentWordObj.word.toLowerCase().replace(/[^a-z]/g, '');

        spellingProgress.textContent = `題目 ${currentSpellingIndex + 1} / 5`;
        spellingTranslationDisplay.textContent = currentWordObj.chinese;
        spellingIpaDisplay.textContent = currentWordObj.ipa;

        currentSpellingInput = [];

        // Generate letter pool
        const letters = word.split('');
        const shuffledLetters = shuffle(letters).map((char, index) => ({
            char,
            id: `letter-${index}`
        }));

        renderLetterPool(shuffledLetters);
        updateSpellingUI(word.length);
    }

    function renderLetterPool(letters) {
        letterPool.innerHTML = '';
        letters.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'letter-btn';
            btn.textContent = item.char;
            btn.dataset.letterId = item.id;
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('used')) {
                    currentSpellingInput.push({
                        char: item.char,
                        id: item.id
                    });
                    btn.classList.add('used');
                    updateSpellingUI();
                }
            });
            letterPool.appendChild(btn);
        });
    }

    function updateSpellingUI(forcedTotal = null) {
        const currentWord = currentSpellingWords[currentSpellingIndex].word.toLowerCase().replace(/[^a-z]/g, '');
        const totalLetters = forcedTotal || currentWord.length;

        spellingInputArea.innerHTML = '';
        for (let i = 0; i < totalLetters; i++) {
            const box = document.createElement('div');
            box.className = 'spell-box';
            if (currentSpellingInput[i]) {
                box.textContent = currentSpellingInput[i].char;
                box.classList.add('filled');
            }
            spellingInputArea.appendChild(box);
        }

        // Sync used status of buttons
        document.querySelectorAll('.letter-btn').forEach(btn => {
            const isUsed = currentSpellingInput.some(input => input.id === btn.dataset.letterId);
            if (isUsed) {
                btn.classList.add('used');
            } else {
                btn.classList.remove('used');
            }
        });
    }

    function checkSpellingAnswer() {
        const correctWord = currentSpellingWords[currentSpellingIndex].word.toLowerCase().replace(/[^a-z]/g, '');
        const userInput = currentSpellingInput.map(i => i.char).join('');

        const isCorrect = userInput === correctWord;

        spellingResults.push({
            word: currentSpellingWords[currentSpellingIndex].word,
            userInput: userInput,
            isCorrect: isCorrect,
            translation: currentSpellingWords[currentSpellingIndex].chinese
        });

        currentSpellingIndex++;
        if (currentSpellingIndex < 5) {
            showSpellingQuestion();
        } else {
            showSpellingResults();
        }
    }

    function showSpellingResults() {
        spellingQuestionArea.classList.add('hidden');
        spellingResultArea.classList.remove('hidden');
        spellingProgress.textContent = "拼字挑戰結果";

        const correctCount = spellingResults.filter(r => r.isCorrect).length;
        const accuracy = Math.round((correctCount / 5) * 100);
        spellingAccuracy.textContent = `${accuracy}%`;

        spellingResultList.innerHTML = '';
        spellingResults.forEach((res, index) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-status ${res.isCorrect ? 'status-correct' : 'status-incorrect'}">
                    ${res.isCorrect ? '✓' : '✗'}
                </div>
                <div class="result-info">
                    <strong>第 ${index + 1} 題：${res.word}</strong>
                    <span>${res.isCorrect ? '正確' : `錯誤 (你拼成 ${res.userInput || '空白'})`}</span>
                    <div style="font-size: 0.85rem; color: #636e72; margin-top: 4px;">${res.translation}</div>
                </div>
            `;
            spellingResultList.appendChild(item);
        });
    }

    function showQuizResults() {
        quizQuestionArea.classList.add('hidden');
        quizOptions.classList.add('hidden');
        quizOptions.innerHTML = ''; // Clear options
        quizResultArea.classList.remove('hidden');
        quizProgress.textContent = "測驗結果";

        const correctCount = quizResults.filter(r => r.isCorrect).length;
        const accuracy = Math.round((correctCount / 3) * 100);
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
                <div class="word-chinese-area">
                    <div class="translation-wrapper">
                        <span class="word-chinese ${currentDifficulty === 'high' ? 'hidden-text' : ''}">${item.chinese}</span>
                        ${currentDifficulty === 'high' ? '<button class="btn-hint">單字翻譯</button>' : ''}
                    </div>
                </div>
                <div class="sentence-eng clickable-text">${item.sentence}</div>
                <div class="sentence-chi-area">
                    <div class="translation-wrapper">
                        <span class="sentence-chi ${currentDifficulty === 'high' ? 'hidden-text' : ''}">${item.translation}</span>
                        ${currentDifficulty === 'high' ? '<button class="btn-hint">造句翻譯</button>' : ''}
                    </div>
                </div>
            `;

            // Hint logic for high difficulty
            if (currentDifficulty === 'high') {
                card.querySelectorAll('.btn-hint').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Find the span that is hidden
                        const hiddenSpan = btn.parentElement.querySelector('.hidden-text');
                        if (hiddenSpan) hiddenSpan.classList.add('revealed');
                        btn.style.display = 'none';
                    });
                });
            }

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
