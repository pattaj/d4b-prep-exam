let currentFilter = "ALL";

function toggleMenu() {
    if(window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.toggle("open");
        document.getElementById("overlay").classList.toggle("active");
    }
}

function buildMenu() {
    const menuContainer = document.getElementById("menuContainer");
    menuContainer.innerHTML = `<button class="menu-btn active" onclick="filterQuestions('ALL', this)">📂 Show All Topics</button>`;

    let topics = [...new Set(quizData.map(q => q.topic))];
    topics.forEach(topic => {
        menuContainer.innerHTML += `<button class="menu-btn" onclick="filterQuestions('${topic}', this)">📁 ${topic}</button>`;
    });
}

function renderQuiz(filter = "ALL") {
    currentFilter = filter;
    const container = document.getElementById("quizContainer");
    container.innerHTML = "";

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
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    retakeQuiz(topic);
    if(window.innerWidth <= 768) {
        toggleMenu();
    }
}

function gradeQuiz() {
    let score = 0;
    let answeredCount = 0;
    let topicStats = {};

    quizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;

        const selected = document.querySelector(`input[name="question_${qIndex}"]:checked`);
        const expDiv = document.getElementById(`exp_${qIndex}`);
        if (expDiv) expDiv.style.display = "block";

        let topic = q.topic || "General Review";
        if (!topicStats[topic]) {
            topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total++;

        if (selected) {
            answeredCount++;
            if (selected.value === q.correct_answer) {
                score++;
                topicStats[topic].correct++;
                selected.parentElement.style.background = "#d4edda";
            } else {
                selected.parentElement.style.background = "#f8d7da";
            }
        }
    });

    if (answeredCount === 0) {
        alert("Please answer at least one question before submitting!");
        return;
    }

    let percentage = Math.round((score / answeredCount) * 100);
    document.getElementById("overallScoreCircle").innerHTML = `${percentage}%<br><small>${score}/${answeredCount}</small>`;
    
    let feedback = "";
    if(percentage >= 80) feedback = "🌟 Excellent work! You're mastering this.";
    else if(percentage >= 60) feedback = "👍 Good effort! A little more review needed.";
    else feedback = "📚 Needs more review. Don't give up!";
    document.getElementById("overallScoreText").innerHTML = feedback;

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
    document.getElementById("submitQuizBtn").style.display = "block";
    document.getElementById("instructionsText").style.display = "block";
    document.getElementById("mainTitle").style.display = "block";
    document.getElementById("reviewActionBtns").style.display = "none";
    window.scrollTo(0, 0);
}

window.onload = () => {
    buildMenu();
    renderQuiz("ALL");
};
