// The system prompt and history stay on the frontend so each visitor has their own session
const SYSTEM_PROMPT = `You are a friendly AI assistant embedded in Hans Christopher D. Valentino's personal portfolio website. Your job is to help visitors learn about Hans but you should respond as if you are hans like in a first person POV.

Here is Hans's background:
- Full name: Hans Christopher D. Valentino
- Currently a 3rd-year BS Computer Engineering student at Saint Mary's University, Ramon, Isabela, Philippines
- Expected graduation: 2027
- Passionate about Web Development, Mobile Application Development, and Software Engineering
- Actively seeking an Internship / OJT opportunity

Tech stack:
- Frontend: HTML, CSS, JavaScript, React
- Backend: Node.js, PHP, Laravel, C#, C++, Java
- Databases: MySQL, MongoDB
- Tools: GitHub, VS Code, Figma, Antigravity (AI coding assistant)
- Skills: UI Design Basics, AI Integration (Learning)

Experience & Achievements:
- 2023: Started programming, joined tech community & school activities
- 2024: Programming foundations via self-learning, online courses, mini-projects
- 2025: Expanded tech stack (MySQL, Node.js, MongoDB, web dev); Competed in RegCon C++ Programming Competition at ICpEP Regional Convention 2025 Region 2 — earned 2nd Runner Up
- Currently (2027 target): BS CpE at Saint Mary's University

Guidelines:
- Keep answers concise, friendly, and conversational.
- If asked about something unrelated to Hans or his portfolio, politely redirect the conversation back to Hans.
- Use emojis occasionally to keep things friendly.
- Never make up information about Hans that isn't listed above.`;

const conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

// DOM Elements
const toggleBtn  = document.getElementById('chatToggleBtn');
const closeBtn   = document.getElementById('chatCloseBtn');
const chatPanel  = document.getElementById('chatPanel');
const chatInput  = document.getElementById('chatInput');
const sendBtn    = document.getElementById('chatSendBtn');
const messagesEl = document.getElementById('chatMessages');
const charCount  = document.getElementById('charCount');
const openIcon   = toggleBtn.querySelector('.open-icon');
const closeIcon  = toggleBtn.querySelector('.close-icon');

let isOpen = false;

function openChat() {
    isOpen = true;
    chatPanel.classList.add('open');
    openIcon.style.display = 'none';
    closeIcon.style.display = 'flex';
    chatInput.focus();
}

function closeChat() {
    isOpen = false;
    chatPanel.classList.remove('open');
    openIcon.style.display = 'flex';
    closeIcon.style.display = 'none';
}

toggleBtn.addEventListener('click', () => isOpen ? closeChat() : openChat());
closeBtn.addEventListener('click', closeChat);

chatInput.addEventListener('input', () => {
    charCount.textContent = chatInput.value.length;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
sendBtn.addEventListener('click', sendMessage);

function appendMessage(text, sender) {
    const wrap   = document.createElement('div');
    wrap.className = `chat-message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
}

function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-message bot';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = `<div class="chat-bubble typing"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function setInputLocked(locked) {
    chatInput.disabled = locked;
    sendBtn.disabled   = locked;
    sendBtn.style.opacity = locked ? '0.5' : '1';
}

// THIS IS THE NEW FUNCTION THAT CALLS YOUR BACKEND
async function callBackend(userMessage) {
    // Add user message to history
    conversationHistory.push({ role: "user", content: userMessage });

    // Call YOUR server, not Groq directly
    const res = await fetch('http://localhost:3000/api/chat', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: conversationHistory
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) throw new Error("Empty response from backend.");

    // Add bot reply to history
    conversationHistory.push({ role: "assistant", content: reply });
    return reply;
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    charCount.textContent  = '0';

    setInputLocked(true);
    showTyping();

    try {
        const reply = await callBackend(text);
        hideTyping();
        appendMessage(reply, 'bot');
    } catch (err) {
        hideTyping();
        appendMessage(`❌ Something went wrong: Dipa siya nagana dto yah`, 'bot');
        console.error("[Chatbot Error]", err);
    } finally {
        setInputLocked(false);
        chatInput.focus();
    }
}