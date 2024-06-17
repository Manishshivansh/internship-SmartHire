document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quiz-container');
    const questionContainer = document.getElementById('question-container');
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-button');
    const timerElement = document.getElementById('timer');
    const fullscreenMessage = document.getElementById('fullscreen-message');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const resultContainer = document.getElementById('result-container');

    let questions = [];
    let currentQuestionIndex = 0;
    let timer;
    let timeLeft = 600; // 10 minutes in seconds

    // Fetch questions from JSON file
    fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        console.log("Questions loaded:", questions);
        loadQuizState();
        // Start the quiz if in fullscreen mode
        if (document.fullscreenElement && questions.length > 0) {
            startQuiz();
        }
    })
    .catch(error => {
        console.error("Error loading questions:", error);
    });

    function startQuiz() {
        console.log("Starting quiz");
        hideFullscreenMessage();
        if (questions.length > 0) {
            showQuestion();
            startTimer();
            saveQuizState();
        } else {
            console.error("No questions available to start the quiz.");
        }
    }

    function showFullscreenMessage() {
        fullscreenMessage.classList.remove('hidden');
        quizContainer.classList.add('hidden');
        console.log("Showing fullscreen message");
    }

    function hideFullscreenMessage() {
        fullscreenMessage.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        console.log("Hiding fullscreen message and showing quiz container");
    }

    function showQuestion() {
        console.log("Showing question at index:", currentQuestionIndex);
        if (questions.length > 0) {
            const question = questions[currentQuestionIndex];
            console.log("Showing question:", question);
            questionContainer.textContent = question.question;
            optionsContainer.innerHTML = '';
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.innerHTML = `<input type="radio" name="option${currentQuestionIndex}" value="${option}" id="option${currentQuestionIndex}-${index}">
                                           <label for="option${currentQuestionIndex}-${index}">${option}</label>`;
                optionsContainer.appendChild(optionElement);
            });

            // Load selected option if it exists
            const savedState = JSON.parse(localStorage.getItem('quizState'));
            if (savedState && savedState.selectedOptions && savedState.selectedOptions[currentQuestionIndex] !== undefined) {
                document.getElementById(`option${currentQuestionIndex}-${savedState.selectedOptions[currentQuestionIndex]}`).checked = true;
            }
        } else {
            console.error("No questions available to show.");
        }
    }

    function showResult() {
        quizContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');

        // Calculate score based on correct answers
        const score = calculateScore();
        resultContainer.innerHTML = `<h2>Quiz Results</h2>
                                     <p>You scored ${score} out of ${questions.length}.</p>`;

        console.log("Quiz completed. Score:", score);
    }

    function calculateScore() {
        let score = 0;
        questions.forEach((question, index) => {
            const selectedOption = document.querySelector(`input[name="option${index}"]:checked`);
            if (selectedOption && selectedOption.value === question.answer) {
                score++;
            }
        });
        return score;
    }

    function startTimer() {
        timerElement.textContent = formatTime(timeLeft);
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert('Time is up!');
                // Handle end of quiz
                showResult();
            }
            saveQuizState();
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secondsRemaining = seconds % 60;
        return `Time left: ${minutes}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;
    }

    nextButton.addEventListener('click', () => {
        const selectedOption = document.querySelector(`input[name="option${currentQuestionIndex}"]:checked`);
        if (selectedOption) {
            const selectedIndex = [...selectedOption.parentElement.parentElement.children].indexOf(selectedOption.parentElement);
            saveSelectedOption(currentQuestionIndex, selectedIndex);

            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion();
            } else {
                alert('Quiz completed!');
                showResult();
            }
            saveQuizState();
        } else {
            alert('Please select an option.');
        }
    });

    function saveQuizState() {
        const selectedOptions = [];
        questions.forEach((question, index) => {
            const selectedOption = document.querySelector(`input[name="option${index}"]:checked`);
            if (selectedOption) {
                selectedOptions[index] = [...selectedOption.parentElement.parentElement.children].indexOf(selectedOption.parentElement);
            }
        });

        localStorage.setItem('quizState', JSON.stringify({
            currentQuestionIndex,
            timeLeft,
            selectedOptions
        }));
        console.log("Quiz state saved:", { currentQuestionIndex, timeLeft, selectedOptions });
    }

    function loadQuizState() {
        const savedState = JSON.parse(localStorage.getItem('quizState'));
        if (savedState) {
            currentQuestionIndex = savedState.currentQuestionIndex;
            timeLeft = savedState.timeLeft;
            console.log("Loaded saved quiz state:", savedState);
        }
    }

    function saveSelectedOption(questionIndex, selectedIndex) {
        const savedState = JSON.parse(localStorage.getItem('quizState')) || {};
        const selectedOptions = savedState.selectedOptions || [];
        selectedOptions[questionIndex] = selectedIndex;
        localStorage.setItem('quizState', JSON.stringify({
            ...savedState,
            selectedOptions
        }));
        console.log("Selected option saved:", { questionIndex, selectedIndex });
    }

    fullscreenButton.addEventListener('click', () => {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            console.log("Entered fullscreen mode");
            if (questions.length > 0) {
                startQuiz();
            } else {
                console.error("No questions loaded yet.");
            }
        } else {
            console.log("Exited fullscreen mode");
            showFullscreenMessage();
            clearInterval(timer);
        }
    });

    // Check if the page is already in fullscreen mode (rare case)
    if (document.fullscreenElement) {
        startQuiz();
    }
});
