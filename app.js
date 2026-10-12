// =========================================================
// 1. STATE & CONFIGURATION
// =========================================================
let loadedModules = {}; // Caches fetched modules: { "generative-ai": [data], "ai-business": [data] }
let currentQuizData = []; 
let currentFilter = "NONE"; 
let currentModuleId = null; // Tracks which module is active

const availableModules = [
    { id: "gen-ai", title: "Generative AI" },
    { id: "ai-for-business", title: "AI for Business" }
];

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const showQuizView = () => {
    document.getElementById("fullAnalyticsView").style.display = "none";
    document.getElementById("quizForm").style.display = "block";
    document.getElementById("submitQuizBtn").style.display = "block";
    document.getElementById("instructionsText").style.display = "block";
    document.getElementById("instructionsText").innerText = "Tap your answers below and submit to view your score and analytics.";
    document.getElementById("mainTitle").style.display = "block";
    document.getElementById("reviewActionBtns").style.display = "none";
    window.scrollTo(0, 0);
};

window.toggleMenu = () => {
    if(window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.toggle("open");
        document.getElementById("overlay").classList.toggle("active");
    }
};

// =========================================================
// 2. UI NAVIGATION & MENU LOGIC (COLLAPSIBLE)
// =========================================================
const buildModuleMenu = () => {
    const modContainer = document.getElementById("moduleContainer");
    modContainer.innerHTML = "";
    
    availableModules.forEach(mod => {
        // Build the Module Button and an empty container for its topics underneath
        modContainer.innerHTML += `
            <div class="module-group">
                <button class="menu-btn module-btn" onclick="toggleModule('${mod.id}', this)">📁 ${mod.title}</button>
                <div id="topics-${mod.id}" class="topics-container"></div>
            </div>
        `;
    });
};

window.toggleModule = async (moduleId, btnElement) => {
    const topicsContainer = document.getElementById(`topics-${moduleId}`);
    
    // Toggle active styles on module buttons
    document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // 1. If already loaded, just toggle visibility INSTANTLY
    if (loadedModules[moduleId]) {
        topicsContainer.classList.toggle('open');
        return;
    }

    // 2. Add visual loading feedback so the UI doesn't feel frozen
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = `⏳ Loading...`;
    btnElement.style.opacity = "0.7";

    // 3. Fetch the data
    try {
        const response = await fetch(`./data/${moduleId}.json`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const rawData = await response.json();
        // Save to cache with original index
        loadedModules[moduleId] = rawData.map((q, index) => ({ ...q, originalIndex: index }));
        
        // Build nested topic menu for this module
        buildTopicMenu(moduleId, topicsContainer);
        
        // Open the container
        topicsContainer.classList.add('open');
        
    } catch (error) {
        console.error("Error loading module:", error);
        alert(`Could not load ${moduleId}.json. Make sure you are running a local server.`);
    } finally {
        // 4. Restore the original button text instantly after it loads
        btnElement.innerHTML = originalText;
        btnElement.style.opacity = "1";
    }
};

const buildTopicMenu = (moduleId, container) => {
    let topics = [...new Set(loadedModules[moduleId].map(q => q.topic))];
    
    let html = `<button class="menu-btn topic-btn" onclick="filterQuestions('${moduleId}', 'ALL', this)">📂 All Topics</button>`;
    topics.forEach(topic => {
        html += `<button class="menu-btn topic-btn" onclick="filterQuestions('${moduleId}', '${topic}', this)">📄 ${topic}</button>`;
    });
    
    container.innerHTML = html;
};

// =========================================================
// 3. QUIZ RENDERING LOGIC
// =========================================================
window.filterQuestions = (moduleId, topic, btnElement) => {
    // Set active module data
    currentModuleId = moduleId;
    currentQuizData = loadedModules[moduleId];

    // Highlight topic
    document.querySelectorAll('.topic-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    
    renderQuiz(topic, false);
    showQuizView();
    
    if(window.innerWidth <= 768) window.toggleMenu();
};

window.retakeQuiz = (topic = currentFilter) => {
    renderQuiz(topic, true);
    showQuizView();
};

const renderQuiz = (filter, isRetake = false) => {
    currentFilter = filter;
    const container = document.getElementById("quizContainer");
    container.innerHTML = "";

    if (filter === "NONE" || currentQuizData.length === 0) return;

    let topicsToRender = filter === "ALL" 
        ? [...new Set(currentQuizData.map(q => q.topic))] 
        : [filter];

    topicsToRender.forEach(topicName => {
        let topicQuestions = currentQuizData.filter(q => q.topic === topicName);
        
        if (isRetake) {
            shuffleArray(topicQuestions);
        } else {
            topicQuestions.sort((a, b) => a.originalIndex - b.originalIndex);
        }

        if (filter === "ALL") {
            let topicDiv = document.createElement("div");
            topicDiv.className = "topic-header";
            topicDiv.innerText = "📁 " + topicName;
            container.appendChild(topicDiv);
        }

        topicQuestions.forEach((q, loopIndex) => {
            let qIndex = q.originalIndex; 
            let displayNumber = loopIndex + 1; 
            let cleanQuestionText = q.question.replace(/^\d+\.\s*/, '');

            let qDiv = document.createElement("div");
            qDiv.className = "question-card";

            let titleDiv = document.createElement("div");
            titleDiv.className = "question-title";
            titleDiv.innerText = `${displayNumber}. ${cleanQuestionText}`;
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
    });
};

// =========================================================
// 4. CUSTOM MODAL PROMISE LOGIC
// =========================================================
const confirmSubmission = (unansweredCount) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        document.getElementById('modalMessage').innerText = `You are about to submit the quiz, but you still have ${unansweredCount} question(s) unanswered.\n\nBlank questions will be marked as incorrect. Proceed?`;
        modal.classList.remove('hidden');

        document.getElementById('modalConfirmBtn').onclick = () => {
            modal.classList.add('hidden');
            resolve(true); // User clicked yes
        };
        document.getElementById('modalCancelBtn').onclick = () => {
            modal.classList.add('hidden');
            resolve(false); // User clicked no
        };
    });
};

// =========================================================
// 5. GRADING & ANALYTICS LOGIC (ASYNC)
// =========================================================
window.gradeQuiz = async () => { // <--- Note the async!
    let score = 0, totalInView = 0, unanswered = 0;
    let topicStats = {};

    currentQuizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;
        totalInView++;
        if (!document.querySelector(`input[name="question_${qIndex}"]:checked`)) unanswered++;
    });

    // Wait for custom modal response if there are unanswered questions
    if (unanswered > 0) {
        const proceed = await confirmSubmission(unanswered);
        if (!proceed) return;
    }

    currentQuizData.forEach((q, qIndex) => {
        if (currentFilter !== "ALL" && q.topic !== currentFilter) return;

        const selected = document.querySelector(`input[name="question_${qIndex}"]:checked`);
        const expDiv = document.getElementById(`exp_${qIndex}`);
        if (expDiv) expDiv.style.display = "block";

        let topic = q.topic || "General Review";
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total++;

        if (selected && selected.value === q.correct_answer) {
            score++;
            topicStats[topic].correct++;
            selected.parentElement.style.background = "#d4edda"; 
            selected.parentElement.style.borderColor = "#28a745";
        } else {
            if (selected) {
                selected.parentElement.style.background = "#f8d7da"; 
                selected.parentElement.style.borderColor = "#dc3545";
            }
            const correctInput = document.querySelector(`input[name="question_${qIndex}"][value="${q.correct_answer}"]`);
            if (correctInput) correctInput.parentElement.style.border = "2px solid #28a745";
        }
        
        document.querySelectorAll(`input[name="question_${qIndex}"]`).forEach(input => input.disabled = true);
    });

    let percentage = Math.round((score / totalInView) * 100);
    document.getElementById("overallScoreCircle").innerHTML = `${percentage}%<br><small>${score}/${totalInView}</small>`;
    
    let feedback = percentage >= 80 ? "🌟 Excellent work! You're mastering this." 
                 : percentage >= 60 ? "👍 Good effort! A little more review needed." 
                 : "📚 Needs more review. Don't give up!";
    document.getElementById("overallScoreText").innerHTML = feedback;

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

window.onload = () => {
    buildModuleMenu();
};
