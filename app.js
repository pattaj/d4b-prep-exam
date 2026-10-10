let currentFilter = "NONE"; // Start with no topic selected

function toggleMenu() {
    if(window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.toggle("open");
        document.getElementById("overlay").classList.toggle("active");
    }
}

function buildMenu() {
    const menuContainer = document.getElementById("menuContainer");
    
    // Build menu without highlighting anything by default
    menuContainer.innerHTML = `<button class="menu-btn" onclick="filterQuestions('ALL', this)">📂 Show All Topics</button>`;

    let topics = [...new Set(quizData.map(q => q.topic))];
    topics.forEach(topic => {
        menuContainer.innerHTML += `<button class="menu-btn" onclick="filterQuestions('${topic}', this)">📁 ${topic}</button>`;
    });
}

function renderQuiz(filter) {
    currentFilter = filter;
    const container = document.getElementById("quizContainer");
    container.innerHTML = "";

    if (filter === "NONE") return; // Render nothing if no topic is selected yet

    quizData.forEach((q, qIndex) => {
        if (filter !== "ALL" && q.topic !== filter) return;

        let qDiv = document.createElement("div");
        qDiv.className = "question-card";

        if (filter === "ALL" && q.topic) {
            let topicDiv = document.createElement("div");
            topicDiv.className = "topic-header";
            topicDiv.innerText = "📁 " + q.topic;
            qDiv.appendChild(topicDiv);
        }

        let titleDiv = document.createElement("div");
        titleDiv.className = "question-title";
        titleDiv.innerText = q.question;
        qDiv.appendChild(titleDiv);
        
        for (let key in q.options) {
            let optText = q.options[key];
            qDiv.innerHTML += `
                <label>
                    <input type="radio" name="question_${qIndex}" value="${key}">
                    <b>${key}:</b> ${optText}
                </label>`;
        }
        
        let expDiv = document.createElement("div");
        expDiv.className = "explanation";
        expDiv.id = `exp_${qIndex}`;
        expDiv.innerHTML = `💡 <b>Explanation:</b><br>${q.explanation}`;
        qDiv.appendChild(expDiv);

        container.appendChild(qDiv);
    });
}

function filterQuestions(topic, btnElement) {
    // Highlight the selected menu button
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    // Load the quiz
    retakeQuiz(topic);
    
    // Close menu on mobile
    if(window.innerWidth <= 768) {
        toggleMenu();
    }
}

function gradeQuiz() {
    let score = 0;
    let totalInView = 0;
    let unanswered = 0;
    let topicStats = {};

    // 1. Validation Pass: Check if all questions are answered
    quizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;
        
        totalInView++;
        const selected = document.querySelector(`input[name="question_${qIndex}"]:checked`);
        if (!selected) {
            unanswered++;
        }
    });

    // If unanswered questions exist, block submission
    if (unanswered > 0) {
        alert(`Please answer all questions before submitting! You still have ${unanswered} question(s) left to answer.`);
        return;
    }

    // 2. Grading Pass
    quizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;

        const selected = document.querySelector(`input[name="question_${qIndex}"]:checked`);
        const expDiv = document.getElementById(`exp_${qIndex}`);
        if (expDiv) expDiv.style.display = "block"; // Show explanation

        let topic = q.topic || "General Review";
        if (!topicStats[topic]) {
            topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total++;

        // Grade correct/incorrect
        if (selected.value === q.correct_answer) {
            score++;
            topicStats[topic].correct++;
            selected.parentElement.style.background = "#d4edda"; // Green
        } else {
            selected.parentElement.style.background = "#f8d7da"; // Red
        }
    });

    // 3. Calculate & Display Analytics
    let percentage = Math.round((score / totalInView) * 100);
    document.getElementById("overallScoreCircle").innerHTML = `${percentage}%<br><small>${score}/${totalInView}</small>`;
    
    let feedback = "";
    if(percentage >= 80) feedback = "🌟 Excellent work! You're mastering this.";
    else if(percentage >= 60) feedback = "👍 Good effort! A little more review needed.";
    else feedback = "📚 Needs more review. Don't give up!";
    document.getElementById("overallScoreText").innerHTML = feedback;

    // Build Topic Breakdown HTML
    let analyticsHtml = "";
    for (let topic in topicStats) {
        let stats = topicStats[topic];
        if (stats.total === 0) continue;
        let topicPerc = Math.round((stats.correct / stats.total) * 100);
        let statusClass = topicPerc < 70 ? "focus-needed" : "mastered";
        let statusText = topicPerc < 70 ? "⚠️ Needs More Focus" : "✅ Mastered";

        analyticsHtml += `
            <div class="analytics-item ${statusClass}">
                <b>${topic}</b>: ${stats.correct}/${stats.total} correct (${topicPerc}%)<br><i>${statusText}</i>
            </div>`;
    }
    document.getElementById("analyticsContent").innerHTML = analyticsHtml;

    // Switch Views (Hide Quiz, Show Analytics Dashboard)
    document.getElementById("quizForm").style.display = "none";
    document.getElementById("instructionsText").style.display = "none";
    document.getElementById("mainTitle").style.display = "none";
    document.getElementById("fullAnalyticsView").style.display = "block";
    
    window.scrollTo(0, 0);
}

function reviewAnswers() {
    document.getElementById("fullAnalyticsView").style.display = "none";
    document.getElementById("quizForm").style.display = "block";
    document.getElementById("submitQuizBtn").style.display = "none";
    document.getElementById("reviewActionBtns").style.display = "flex";
    window.scrollTo(0, 0);
}

function showAnalytics() {
    document.getElementById("quizForm").style.display = "none";
    document.getElementById("fullAnalyticsView").style.display = "block";
    window.scrollTo(0, 0);
}

function retakeQuiz(topic = currentFilter) {
    renderQuiz(topic);
    
    document.getElementById("fullAnalyticsView").style.display = "none";
    document.getElementById("quizForm").style.display = "block";
    document.getElementById("submitQuizBtn").style.display = "block"; // Show submit button
    
    // Update instructions
    const instructionEl = document.getElementById("instructionsText");
    instructionEl.style.display = "block";
    instructionEl.innerText = "Tap your answers below and submit to view your score and analytics.";
    
    document.getElementById("mainTitle").style.display = "block";
    document.getElementById("reviewActionBtns").style.display = "none";
    
    window.scrollTo(0, 0);
}

// Initialize on load
window.onload = () => {
    buildMenu();
    renderQuiz("NONE"); // Start with a blank slate!
};
