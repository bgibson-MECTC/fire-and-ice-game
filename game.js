/* =======================================================
   FIRE & ICE NURSING GAME (Ch 50/51)
   Main Game Engine
   ======================================================= */

// Leaderboard disabled for now to avoid Firebase issues
// import { savePlayerScore, loadLeaderboard } from "./leaderboard.js";

/* =======================================================
   GLOBAL VARIABLES
   ======================================================= */

let playerName = "";
let currentScore = 0;
let currentQuestionIndex = 0;
let allQuestions = [];
let timer = 30;
let timerInterval;
let doublePoints = false;
let halfPoints = false;
let autoRationale = false;
let instructorMode = false;

let skipCooldown = 0;
let hintCooldown = false;

/* Chaos */
let chaosIndex = 0;
let chaosTimer = 15;
let chaosInterval;

/* Blitz */
let blitzCaseIndex = 0;
let blitzCases = [];
let selectedSteps = [];

/* Sabotage */
let sabotageIndex = 0;
let sabotageTargets = [];

/* =======================================================
   SCREEN HANDLING
   ======================================================= */

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    document.getElementById(id).classList.add("visible");
}

/* =======================================================
   LOAD QUESTIONS (JSON)
   ======================================================= */
async function loadQuestions() {
    const res = await fetch("questions_50_51.json");
    allQuestions = await res.json();
}

/* =======================================================
   START GAME
   ======================================================= */

function setupEventListeners() {
    console.log("Setting up event listeners...");
    console.log("Start button:", document.getElementById("startGameBtn"));
    
document.getElementById("startGameBtn").addEventListener("click", async () => {
    let nameInput = document.getElementById("playerNameInput").value.trim();
    if (nameInput === "") {
        alert("Enter a nickname to begin your Fire & Ice battle!");
        return;
    }
    playerName = nameInput;
    document.getElementById("playerNameLabel").textContent = playerName;

    currentScore = 0;
    currentQuestionIndex = 0;

    await startMainQuestion();
});

/* =======================================================
   INSTRUCTOR MODE (PASSWORD PROTECTED)
   ======================================================= */

// Snowflake trigger
document.getElementById("instructorSnowflake").addEventListener("click", () => {
    document.getElementById("instructorPasswordModal").classList.remove("hidden");
});

// Close modal
document.querySelectorAll(".closeModal").forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("instructorPasswordModal").classList.add("hidden");
    });
});

// Password logic
document.getElementById("instructorPasswordSubmit").addEventListener("click", () => {
    let pw = document.getElementById("instructorPasswordInput").value;
    if (pw === "CHAOSQUEEN") {
        instructorMode = true;
        alert("Instructor Mode Activated");
        document.getElementById("instructorPanel").classList.add("visible");
        document.getElementById("instructorPasswordModal").classList.add("hidden");
    } else {
        alert("Incorrect password.");
    }
});

// Close instructor panel
document.getElementById("closeInstructorPanel").addEventListener("click", () => {
    document.getElementById("instructorPanel").classList.remove("visible");
});

/* =======================================================
   INSTRUCTOR CONTROLS
   ======================================================= */

document.getElementById("showAnswersBtn").addEventListener("click", () => {
    document.querySelectorAll(".answerBtn").forEach(btn => {
        if (btn.dataset.correct === "true") {
            btn.style.background = "green";
        }
    });
});

document.getElementById("hideAnswersBtn").addEventListener("click", () => {
    document.querySelectorAll(".answerBtn").forEach(btn => {
        btn.style.background = "";
    });
});

document.getElementById("freezeTimerBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
});

document.getElementById("addTimeBtn").addEventListener("click", () => {
    timer += 10;
    updateTimerDisplay();
});

document.getElementById("removeTimeBtn").addEventListener("click", () => {
    timer = Math.max(0, timer - 10);
    updateTimerDisplay();
});

document.getElementById("bonusPointsBtn").addEventListener("click", () => {
    currentScore += 500;
    updateScore();
});

document.getElementById("penaltyPointsBtn").addEventListener("click", () => {
    currentScore -= 250;
    updateScore();
});

document.getElementById("doublePointsBtn").addEventListener("click", () => {
    doublePoints = true;
    halfPoints = false;
});

document.getElementById("halfPointsBtn").addEventListener("click", () => {
    halfPoints = true;
    doublePoints = false;
});

document.getElementById("autoRationaleBtn").addEventListener("click", () => {
    autoRationale = !autoRationale;
    alert("Auto-rationale: " + (autoRationale ? "ON" : "OFF"));
});

/* =======================================================
   MAIN GAME QUESTION FLOW
   ======================================================= */

async function startMainQuestion() {
    console.log("Starting main question. Questions available:", allQuestions.length);
    if (allQuestions.length === 0) {
        console.log("No questions loaded, loading now...");
        await loadQuestions();
    }
    console.log("Showing game screen");
    showScreen("gameScreen");
    console.log("Loading first question");
    loadQuestion();
}

function loadQuestion() {
    console.log("loadQuestion called. Index:", currentQuestionIndex, "Total:", allQuestions.length);
    if (currentQuestionIndex >= allQuestions.length) {
        endGame();
        return;
    }

    const q = allQuestions[currentQuestionIndex];
    console.log("Current question:", q);

    document.getElementById("questionText").textContent = q.question;
    const answersBox = document.getElementById("answersContainer");
    answersBox.innerHTML = "";

    q.answers.forEach((ans, i) => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;
        btn.dataset.correct = ans.correct;
        btn.classList.add("answerBtn");
        btn.addEventListener("click", () => selectAnswer(btn, q));
        answersBox.appendChild(btn);
    });

    // Reset rationale
    document.getElementById("rationaleBox").classList.add("hidden");

    // Restart Timer
    timer = 30;
    updateTimerDisplay();
    startTimer();

    // Reset controls visibility
    document.getElementById("nextBtn").classList.add("hidden");

    // Reset skip/hint states
    if (skipCooldown > 0) {
        document.getElementById("skipBtn").disabled = true;
        skipCooldown--;
    } else {
        document.getElementById("skipBtn").disabled = false;
    }

    document.getElementById("hintBtn").disabled = false;
}

/* =======================================================
   TIMER LOGIC + BEEPS
   ======================================================= */

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();

        if (timer <= 5) {
            playBeep();
        }

        if (timer <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById("timer").textContent = timer;
}

function playBeep() {
    const beep = new Audio("assets/beep.mp3");
    beep.volume = 0.4;
    beep.play();
}

function timeUp() {
    document.getElementById("rationaleBox").textContent = "⏰ Time's up!";
    document.getElementById("rationaleBox").classList.remove("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");
}

/* =======================================================
   SELECT ANSWER
   ======================================================= */

function selectAnswer(btn, q) {
    clearInterval(timerInterval);

    const correct = btn.dataset.correct === "true";

    if (correct) {
        btn.classList.add("correct");
        let pts = q.points || 100;

        if (doublePoints) pts *= 2;
        if (halfPoints) pts = Math.floor(pts / 2);

        currentScore += pts;
    } else {
        btn.classList.add("wrong");
        currentScore -= 50;
    }

    updateScore();

    // Show rationale
    const rationale = document.getElementById("rationaleBox");
    rationale.textContent = q.rationale;
    rationale.classList.remove("hidden");

    // Disable all buttons
    document.querySelectorAll(".answerBtn").forEach(b => b.disabled = true);

    // Show Next
    document.getElementById("nextBtn").classList.remove("hidden");
}

document.getElementById("nextBtn").addEventListener("click", () => {
    currentQuestionIndex++;
    loadQuestion();
});

/* =======================================================
   SCORE UPDATE
   ======================================================= */

function updateScore() {
    document.getElementById("currentScore").textContent = currentScore;
}

/* =======================================================
   HINT SYSTEM (−200 points)
   ======================================================= */

document.getElementById("hintBtn").addEventListener("click", () => {
    if (hintCooldown) return;

    const q = allQuestions[currentQuestionIndex];
    if (!q.hint) {
        alert("No hint available for this question.");
        return;
    }

    currentScore -= 200;
    updateScore();

    const rationale = document.getElementById("rationaleBox");
    rationale.textContent = "💡 Hint: " + q.hint;
    rationale.classList.remove("hidden");

    hintCooldown = true;
    document.getElementById("hintBtn").disabled = true;
});

/* =======================================================
   SKIP LOGIC (Cooldown 2 questions)
   ======================================================= */

document.getElementById("skipBtn").addEventListener("click", () => {
    if (skipCooldown > 0) return;

    skipCooldown = 2;
    currentQuestionIndex++;
    loadQuestion();
});

/* =======================================================
   CHAOS ROUND – THERMAL SHOCK
   ======================================================= */

function startChaosRound() {
    chaosIndex = 0;
    chaosTimer = 15;
    showScreen("chaosScreen");
    loadChaosQuestion();
}

function loadChaosQuestion() {
    if (chaosIndex >= allQuestions.length) {
        showScreen("finalScreen");
        return;
    }

    const q = allQuestions[chaosIndex];
    document.getElementById("chaosQuestion").textContent = q.question;

    const answersBox = document.getElementById("chaosAnswers");
    answersBox.innerHTML = "";

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;
        btn.dataset.correct = ans.correct;
        btn.addEventListener("click", () => chaosSelect(btn, q));
        answersBox.appendChild(btn);
    });

    // Reset rationale
    document.getElementById("chaosRationale").classList.add("hidden");
    document.getElementById("chaosNextBtn").classList.add("hidden");

    startChaosTimer();
}

function startChaosTimer() {
    clearInterval(chaosInterval);
    chaosInterval = setInterval(() => {
        chaosTimer--;
        document.getElementById("chaosTimer").textContent = chaosTimer;

        if (chaosTimer <= 5) playBeep();

        if (chaosTimer <= 0) {
            clearInterval(chaosInterval);
            chaosTimeUp();
        }
    }, 1000);
}

function chaosSelect(btn, q) {
    clearInterval(chaosInterval);

    const correct = btn.dataset.correct === "true";
    if (correct) {
        btn.classList.add("correct");
        currentScore += 150;
    } else {
        btn.classList.add("wrong");
        currentScore -= 50;
    }

    updateScore();

    const rationale = document.getElementById("chaosRationale");
    rationale.textContent = q.rationale;
    rationale.classList.remove("hidden");

    document.querySelectorAll("#chaosAnswers button").forEach(b => b.disabled = true);

    document.getElementById("chaosNextBtn").classList.remove("hidden");
}

document.getElementById("chaosNextBtn").addEventListener("click", () => {
    chaosIndex++;
    loadChaosQuestion();
});

function chaosTimeUp() {
    const rationale = document.getElementById("chaosRationale");
    rationale.textContent = "⏰ Time's up!";
    rationale.classList.remove("hidden");
    document.getElementById("chaosNextBtn").classList.remove("hidden");
}

/* =======================================================
   INFERNO INTERFERENCE – SABOTAGE ROUND
   ======================================================= */

function startSabotage() {
    sabotageIndex = 0;

    // Build list of possible targets
    sabotageTargets = [playerName, "Student1", "Student2", "Student3"];

    showScreen("sabotageScreen");
    loadSabotageQuestion();
}

function loadSabotageQuestion() {
    const q = allQuestions[sabotageIndex];
    document.getElementById("sabotageQuestion").textContent = q.question;

    const box = document.getElementById("sabotageAnswers");
    box.innerHTML = "";

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;
        btn.dataset.correct = ans.correct;
        btn.addEventListener("click", () => sabotageSelect(btn, q));
        box.appendChild(btn);
    });

    document.getElementById("sabotageResults").classList.add("hidden");
    document.getElementById("sabotageNextBtn").classList.add("hidden");
}

function sabotageSelect(btn, q) {
    const correct = btn.dataset.correct === "true";
    let stolen = Math.floor(Math.random() * 200) + 100;

    if (correct) {
        currentScore += stolen;
    } else {
        currentScore -= 150;
    }

    updateScore();

    // Show steal message
    const results = document.getElementById("sabotageResults");
    results.classList.remove("hidden");

    let target = sabotageTargets[Math.floor(Math.random() * sabotageTargets.length)];

    results.innerHTML = correct ?
        `🔥 You stole <b>${stolen}</b> points from <b>${target}</b>!` :
        `🥶 Wrong! You lost 150 points!`;

    document.querySelectorAll("#sabotageAnswers button").forEach(b => b.disabled = true);
    document.getElementById("sabotageNextBtn").classList.remove("hidden");
}

document.getElementById("sabotageNextBtn").addEventListener("click", () => {
    sabotageIndex++;
    if (sabotageIndex >= 5) {
        showScreen("finalScreen");
    } else {
        loadSabotageQuestion();
    }
});

/* =======================================================
   BLITZ ROUND – BURN PROTOCOL ASSAULT
   ======================================================= */

function startBlitz() {
    blitzCaseIndex = 0;
    blitzCases = allQuestions.filter(q => q.type === "blitz");
    selectedSteps = [];
    showScreen("blitzScreen");
    loadBlitzCase();
}

function loadBlitzCase() {
    const c = blitzCases[blitzCaseIndex];

    document.getElementById("blitzCase").textContent = c.question;

    const stepsBox = document.getElementById("blitzSteps");
    stepsBox.innerHTML = "";

    selectedSteps = [];

    c.steps.forEach(step => {
        const btn = document.createElement("button");
        btn.textContent = step;
        btn.classList.add("stepBtn");
        btn.addEventListener("click", () => toggleStep(btn));
        stepsBox.appendChild(btn);
    });

    document.getElementById("blitzResult").classList.add("hidden");
    document.getElementById("blitzNextBtn").classList.add("hidden");
}

function toggleStep(btn) {
    if (selectedSteps.includes(btn.textContent)) {
        selectedSteps = selectedSteps.filter(s => s !== btn.textContent);
        btn.style.background = "";
    } else {
        selectedSteps.push(btn.textContent);
        btn.style.background = "#333";
    }
}

document.getElementById("blitzSubmitBtn").addEventListener("click", () => {
    const c = blitzCases[blitzCaseIndex];

    const correctSequence = JSON.stringify(c.correct);
    const userSequence = JSON.stringify(selectedSteps);

    const resultBox = document.getElementById("blitzResult");
    resultBox.classList.remove("hidden");

    if (correctSequence === userSequence) {
        currentScore += 300;
        resultBox.innerHTML = "🔥 PERFECT ORDER! +300";
    } else {
        currentScore -= 100;
        resultBox.innerHTML = "🥶 Incorrect order! -100";
    }

    updateScore();

    document.getElementById("blitzNextBtn").classList.remove("hidden");
});

document.getElementById("blitzNextBtn").addEventListener("click", () => {
    blitzCaseIndex++;
    if (blitzCaseIndex >= blitzCases.length) {
        endGame();
    } else {
        loadBlitzCase();
    }
});
/* =======================================================
   END GAME + TITLE AWARDING
   ======================================================= */

function endGame() {
    clearInterval(timerInterval);
    clearInterval(chaosInterval);

    document.getElementById("finalScore").textContent = currentScore;

    // Determine title
    let title = "";
    if (currentScore >= 7000) title = "🔥 Inferno Master";
    else if (currentScore >= 5000) title = "❄️ Ice Queen/King";
    else if (currentScore >= 3000) title = "⚕️ Clinical Annihilator";
    else if (currentScore >= 1500) title = "🔥 Firestarter";
    else title = "🥶 Frostbitten";

    document.getElementById("titleEarned").textContent = "Your Title: " + title;

    // Save score to Firebase (disabled for now)
    // if (savePlayerScore) {
    //     try {
    //         await savePlayerScore(playerName, currentScore);
    //     } catch (err) {
    //         console.warn("Could not save score:", err);
    //     }
    // }

    // Switch to final screen
    showScreen("finalScreen");
}

/* =======================================================
   LEADERBOARD NAVIGATION
   ======================================================= */

document.getElementById("viewLeaderboardBtn").addEventListener("click", async () => {
    alert("Leaderboard is temporarily disabled.");
    // if (loadLeaderboard) {
    //     try {
    //         await loadLeaderboard();
    //         showScreen("leaderboardScreen");
    //     } catch (err) {
    //         alert("Leaderboard unavailable. Firebase may be blocked or offline.");
    //     }
    // } else {
    //     alert("Leaderboard unavailable. Firebase may be blocked or offline.");
    // }
});

document.getElementById("leaderboardBackBtn").addEventListener("click", () => {
    showScreen("finalScreen");
});

/* =======================================================
   RESTART GAME
   ======================================================= */

document.getElementById("restartGameBtn").addEventListener("click", () => {
    currentScore = 0;
    currentQuestionIndex = 0;
    showScreen("introScreen");
});
} // End of setupEventListeners()

/* =======================================================
   GAME MODE BUTTON HOOKS (OPTIONAL FUTURE FEATURES)
   ======================================================= */

// Example: Add buttons for Chaos / Sabotage / Blitz
// startChaosRound();
// startSabotage();
// startBlitz();

/* =======================================================
   UTILITY FUNCTIONS
   ======================================================= */

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/* =======================================================
   INITIALIZE ON PAGE LOAD
   ======================================================= */

window.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM loaded!");
    await loadQuestions();
    console.log("Questions loaded:", allQuestions.length);
    setupEventListeners();
    console.log("Event listeners set up!");
});
