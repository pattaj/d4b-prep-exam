// =========================================================
// 1. STATE & CONFIGURATION
// =========================================================
let currentQuizData = []; // Holds the fetched JSON data
let currentFilter = "NONE"; 

// Define your JSON files here (must match the names in your /data/ folder)
const availableModules = [
    { id: "generative-ai", title: "Generative AI" },
    { id: "ai-business", title: "AI for Business" }
];

// =========================================================
// 2. UI NAVIGATION & MENU LOGIC
// =========================================================
window.toggleMenu = () => {
    if(window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.toggle("open");
        document.getElementById("overlay").classList.toggle("active");
    }
};

const buildModuleMenu = () => {
    const modContainer = document.getElementById("moduleContainer");
    modContainer.innerHTML = "";
    
    availableModules.forEach(mod => {
        // Creates a button that will trigger the async fetch
        modContainer.innerHTML += `<button class="menu-btn module-btn" onclick="loadModule('${mod.id}', this)">📁 ${mod.title}</button>`;
    });
};

const buildTopicMenu = () => {
    const menuContainer = document.getElementById("menuContainer");
    menuContainer.innerHTML = `<button class="menu-btn topic-btn active" onclick="filterQuestions('ALL', this)">📂 Show All Topics</button>`;

    // Extract unique topics from the currently loaded JSON data
    let topics = [...new Set(currentQuizData.map(q => q.topic))];
    topics.forEach(topic => {
        menuContainer.innerHTML += `<button class="menu-btn topic-btn" onclick="filterQuestions('${topic}', this)">📄 ${topic}</button>`;
    });
};

// =========================================================
// 3. ASYNC DATA FETCHING
// =========================================================
window.loadModule = async (moduleId, btnElement) => {
    // Highlight the selected module button
    document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    try {
        // Fetch the corresponding JSON file
        const response = await fetch(`./data/${moduleId}.json`);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        currentQuizData = await response.json();
        
        // Build the topics for this module and render everything
        buildTopicMenu();
        filterQuestions("ALL", document.querySelector('.topic-btn'));
        
    } catch (error) {
        console.error("Error loading module:", error);
        alert(`Could not load ${moduleId}.json. Remember, you must run this on a local server (like Live Server in VS Code) for fetch() to work!`);
    }
};

// =========================================================
// 4. QUIZ RENDERING LOGIC
// =========================================================
window.filterQuestions = (topic, btnElement) => {
    // Highlight the selected topic button
    document.querySelectorAll('.topic-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    
    window.retakeQuiz(topic);
    
    if(window.innerWidth <= 768) window.toggleMenu();
};

const renderQuiz = (filter) => {
    currentFilter = filter;
    const container = document.getElementById("quizContainer");
    container.innerHTML = "";

    if (filter === "NONE" || currentQuizData.length === 0) return;

    currentQuizData.forEach((q, qIndex) => {
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
};

// =========================================================
// 5. GRADING & ANALYTICS LOGIC
// =========================================================
window.gradeQuiz = () => {
    let score = 0, totalInView = 0, unanswered = 0;
    let topicStats = {};

    // Validation Pass
    currentQuizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;
        totalInView++;
        if (!document.querySelector(`input[name="question_${qIndex}"]:checked`)) unanswered++;
    });

    if (unanswered > 0) {
        alert(`Please answer all questions before submitting! You have ${unanswered} question(s) left.`);
        return;
    }

    // Grading Pass
    currentQuizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;

        const selected = document.querySelector(`input[name="question_${qIndex}"]:checked`);
        const expDiv = document.getElementById(`exp_${qIndex}`);
        if (expDiv) expDiv.style.display = "block";

        let topic = q.topic || "General Review";
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total++;

        if (selected.value === q.correct_answer) {
            score++;
            topicStats[topic].correct++;
            selected.parentElement.style.background = "#d4edda"; 
            selected.parentElement.style.borderColor = "#28a745";
        } else {
            selected.parentElement.style.background = "#f8d7da"; 
            selected.parentElement.style.borderColor = "#dc3545";
        }
        // Disable inputs after grading
        document.querySelectorAll(`input[name="question_${qIndex}"]`).forEach(input => input.disabled = true);
    });

    // Analytics Calculation
    let percentage = Math.round((score / totalInView) * 100);
    document.getElementById("overallScoreCircle").innerHTML = `${percentage}%<br><small>${score}/${totalInView}</small>`;
    
    let feedback = percentage >= 80 ? "🌟 Excellent work! You're mastering this." 
                 : percentage >= 60 ? "👍 Good effort! A little more review needed." 
                 : "📚 Needs more review. Don't give up!";
    document.getElementById("overallScoreText").innerHTML = feedback;

    // Build Analytics HTML
    let analyticsHtml = "";
    for (let topic in topicStats) {
        let stats = topicStats[topic];
        let topicPerc = Math.round((stats.correct / stats.total) * 100);
        let statusClass = topicPerc < 70 ? "focus-needed" : "mastered";
        let statusText = topicPerc < 70 ? "⚠️ Needs More Focus" : "✅ Mastered";

        analyticsHtml += `
            <div class="analytics-item ${statusClass}">
                <b>${topic}</b>: ${stats.correct}/${stats.total} correct (${topicPerc}%)<br><i>${statusText}</i>
            </div>`;
    }
    document.getElementById("analyticsContent").innerHTML = analyticsHtml;

    // View Switching
    document.getElementById("quizForm").style.display = "none";
    document.getElementById("instructionsText").style.display = "none";
    document.getElementById("mainTitle").style.display = "none";
    document.getElementById("fullAnalyticsView").style.display = "block";
    
    window.scrollTo(0, 0);
};

window.reviewAnswers = () => {
    document.getElementById("fullAnalyticsView").style.display = "none";
    document.getElementById("quizForm").style.display = "block";
    document.getElementById("submitQuizBtn").style.display = "none";
    document.getElementById("reviewActionBtns").style.display = "flex";
    window.scrollTo(0, 0);
};

window.showAnalytics = () => {
    document.getElementById("quizForm").style.display = "none";
    document.getElementById("fullAnalyticsView").style.display = "block";
    window.scrollTo(0, 0);
};

window.retakeQuiz = (topic = currentFilter) => {
    renderQuiz(topic);
    
    document.getElementById("fullAnalyticsView").style.display = "none";
    document.getElementById("quizForm").style.display = "block";
    document.getElementById("submitQuizBtn").style.display = "block";
    
    const instructionEl = document.getElementById("instructionsText");
    instructionEl.style.display = "block";
    instructionEl.innerText = "Tap your answers below and submit to view your score and analytics.";
    
    document.getElementById("mainTitle").style.display = "block";
    document.getElementById("reviewActionBtns").style.display = "none";
    
    window.scrollTo(0, 0);
};

// =========================================================
// 6. INITIALIZATION
// =========================================================
window.onload = () => {
    buildModuleMenu();
    renderQuiz("NONE"); 
};
