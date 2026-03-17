let resources = [];

const resourceNav = document.getElementById("resource-nav");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");
const welcomeScreen = document.getElementById("welcome-screen");
const viewerArea = document.getElementById("viewer-area");

const CUSTOM_TESTS_KEY = "jpn_n345_custom_tests_v1";
let homeFlashcards = [];
let homeFlashcardIndex = 0;
let homeFlashcardInteractionsBound = false;
let homeFlashcardIsAnimating = false;
let homeQuestionPool = [];
let homeQuestionPoolReady = false;
let currentHomeQuestion = null;

// Get base path - only add for GitHub Pages subdir repos
const getBasePath = () => {
	const hostname = window.location.hostname;
	const pathname = window.location.pathname;
	
	// If on GitHub Pages with subdirectory (e.g., quodoo.github.io/nihongo/)
	if (hostname.includes("github.io") && pathname !== "/" && !pathname.endsWith("index.html")) {
		// Extract repo name from pathname (e.g., /nihongo/path -> /nihongo/)
		const parts = pathname.split("/").filter(Boolean);
		if (parts.length > 0) {
			return "/" + parts[0] + "/";
		}
	}
	// Local or user.github.io (no subdir) -> relative fetch
	return "";
};
const basePath = getBasePath();

// Detect file type from extension
function getFileType(path) {
	if (!path) return "ABOUT";
	if (path.endsWith(".md")) return "Markdown";
	if (path.endsWith(".json")) return "JSON";
	if (path.endsWith(".html")) return "HTML";
	return "Text";
}

// Load resources from JSON file
async function loadResources() {
	try {
		const response = await fetch(basePath + "resources.json", { cache: "no-store" });
		if (!response.ok) throw new Error("Không thể tải resources.json");
		resources = await response.json();
		renderSidebar();
		await initializeHomeWidgets();
	} catch (err) {
		console.error("Lỗi khi tải resources:", err);
		alert("Lỗi: Không thể tải danh sách tài liệu");
	}
}

// Initialize on page load
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", loadResources);
} else {
	loadResources();
}

async function openMiniTest() {
	await loadDocument("minitest.html", "Mini Test Tiếng Nhật");
}

function openQuizApp() {
	const quizAppUrl = "https://japan-quiz.erpblogs.com/index.html";
	const link = document.createElement("a");
	link.href = quizAppUrl;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.remove();
}

window.openMiniTest = openMiniTest;
window.openQuizApp = openQuizApp;

window.prevHomeFlashcard = prevHomeFlashcard;
window.nextHomeFlashcard = nextHomeFlashcard;
window.showRandomHomeQuestion = showRandomHomeQuestion;
window.selectHomeOption = selectHomeOption;

// Logo button - go back to home/welcome screen
document.getElementById("logo-btn").addEventListener("click", (e) => {
	e.preventDefault();
	// Hide viewer, show welcome screen
	viewerArea.classList.add("d-none");
	welcomeScreen.classList.remove("d-none");
	// Clear active nav items
	resourceNav.querySelectorAll(".nav-item-btn").forEach((b) => b.classList.remove("active"));
	showRandomHomeQuestion();
});

async function initializeHomeWidgets() {
	await loadHomeFlashcards();
	bindHomeFlashcardInteractions();
	renderHomeFlashcard();
	await loadHomeQuestionPool();
	showRandomHomeQuestion();
}

async function loadHomeFlashcards() {
	const fallback = [
		{ front: "に", back: "Trợ từ chỉ đích đến / thời điểm" },
		{ front: "で", back: "Trợ từ chỉ nơi diễn ra hành động" },
		{ front: "を", back: "Trợ từ chỉ tân ngữ trực tiếp" }
	];

	try {
		const item = resources.find((r) => r.id === "trotu-sheet" && r.path);
		if (!item) {
			homeFlashcards = fallback;
			return;
		}
		const response = await fetch(basePath + item.path, { cache: "no-store" });
		if (!response.ok) throw new Error("Không thể tải bộ thẻ trợ từ");
		const data = await response.json();
		const mapped = Array.isArray(data)
			? data
					.map((it) => ({
						front: String(it.front || "").trim(),
						back: String(it.back || "").trim()
					}))
					.filter((it) => it.front && it.back)
			: [];
		homeFlashcards = mapped.length > 0 ? mapped : fallback;
	} catch (error) {
		homeFlashcards = fallback;
	}
}

function renderHomeFlashcard() {
	if (!homeFlashcards.length) return;
	const card = homeFlashcards[homeFlashcardIndex];
	const frontEl = document.getElementById("home-flashcard-front");
	const backEl = document.getElementById("home-flashcard-back");
	const idxEl = document.getElementById("home-flashcard-index");
	const cardEl = document.getElementById("home-flashcard");
	if (!frontEl || !backEl || !idxEl || !cardEl) return;

	frontEl.textContent = card.front;
	backEl.textContent = card.back;
	idxEl.textContent = `${homeFlashcardIndex + 1} / ${homeFlashcards.length}`;
	cardEl.classList.remove("is-flipped");
}

function bindHomeFlashcardInteractions() {
	if (homeFlashcardInteractionsBound) return;
	const cardEl = document.getElementById("home-flashcard");
	if (!cardEl) return;

	homeFlashcardInteractionsBound = true;

	let startX = 0;
	let startY = 0;
	let pointerActive = false;
	const swipeThreshold = 56;
	const tapThreshold = 10;

	const endGesture = () => {
		pointerActive = false;
		cardEl.classList.remove("is-pressing");
	};

	cardEl.addEventListener("pointerdown", (event) => {
		if (event.pointerType === "mouse" && event.button !== 0) return;
		startX = event.clientX;
		startY = event.clientY;
		pointerActive = true;
		cardEl.classList.add("is-pressing");
	});

	cardEl.addEventListener("pointerup", (event) => {
		if (!pointerActive) return;
		if (homeFlashcardIsAnimating) {
			endGesture();
			return;
		}

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;
		const absX = Math.abs(deltaX);
		const absY = Math.abs(deltaY);

		endGesture();

		if (absX >= swipeThreshold && absX > absY) {
			if (deltaX < 0) {
				nextHomeFlashcard();
			} else {
				prevHomeFlashcard();
			}
			return;
		}

		if (absX <= tapThreshold && absY <= tapThreshold) {
			cardEl.classList.toggle("is-flipped");
		}
	});

	cardEl.addEventListener("pointercancel", endGesture);
	cardEl.addEventListener("pointerleave", (event) => {
		if (pointerActive && event.pointerType === "mouse") {
			endGesture();
		}
	});
	cardEl.addEventListener("dragstart", (event) => event.preventDefault());
	cardEl.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			cardEl.classList.toggle("is-flipped");
			return;
		}

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			prevHomeFlashcard();
			return;
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			nextHomeFlashcard();
		}
	});
}

function prevHomeFlashcard() {
	animateHomeFlashcardTransition(-1);
}

function nextHomeFlashcard() {
	animateHomeFlashcardTransition(1);
}

function animateHomeFlashcardTransition(step) {
	if (!homeFlashcards.length || !Number.isInteger(step) || step === 0) return;
	if (homeFlashcardIsAnimating) return;

	const cardEl = document.getElementById("home-flashcard");
	if (!cardEl) {
		homeFlashcardIndex = (homeFlashcardIndex + step + homeFlashcards.length) % homeFlashcards.length;
		renderHomeFlashcard();
		return;
	}

	homeFlashcardIsAnimating = true;
	const outClass = step > 0 ? "swipe-out-left" : "swipe-out-right";
	const inClass = step > 0 ? "swipe-in-right" : "swipe-in-left";

	cardEl.classList.remove("swipe-out-left", "swipe-out-right", "swipe-in-left", "swipe-in-right");
	cardEl.classList.add(outClass);

	const handleOut = () => {
		cardEl.classList.remove(outClass);
		homeFlashcardIndex = (homeFlashcardIndex + step + homeFlashcards.length) % homeFlashcards.length;
		renderHomeFlashcard();
		cardEl.classList.add(inClass);
		cardEl.addEventListener("animationend", handleIn, { once: true });
	};

	const handleIn = () => {
		cardEl.classList.remove(inClass);
		homeFlashcardIsAnimating = false;
	};

	cardEl.addEventListener("animationend", handleOut, { once: true });
}

function readCustomTests() {
	try {
		const raw = localStorage.getItem(CUSTOM_TESTS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function extractQuestionsFromPayload(payload) {
	const looksLikeQuestion = (item) => item && typeof item === "object" && (item.q || item.question || item.text);

	if (Array.isArray(payload)) {
		if (payload.length > 0 && looksLikeQuestion(payload[0])) {
			return payload;
		}

		const merged = [];
		for (const pack of payload) {
			if (pack && Array.isArray(pack.questions)) {
				merged.push(...pack.questions);
			}
		}
		return merged;
	}

	if (!payload || typeof payload !== "object") {
		return [];
	}

	if (Array.isArray(payload.questions)) {
		return payload.questions;
	}

	if (Array.isArray(payload.quizzes)) {
		const merged = [];
		for (const pack of payload.quizzes) {
			if (pack && Array.isArray(pack.questions)) {
				merged.push(...pack.questions);
			}
		}
		return merged;
	}

	return [];
}

async function loadHomeQuestionPool() {
	if (homeQuestionPoolReady) return;
	homeQuestionPoolReady = true;
	homeQuestionPool = [];

	try {
		const response = await fetch(basePath + "test.json", { cache: "no-store" });
		if (response.ok) {
			const tests = await response.json();
			for (const test of Array.isArray(tests) ? tests : []) {
				if (!test || !test.file) continue;
				try {
					const qRes = await fetch(basePath + test.file, { cache: "no-store" });
					if (!qRes.ok) continue;
					const payload = await qRes.json();
					const questions = extractQuestionsFromPayload(payload);
					pushQuestionsToPool(questions, test.title || "Bộ có sẵn");
				} catch {
					// Skip broken test file
				}
			}
		}
	} catch {
		// Ignore built-in pool errors
	}

	const customTests = readCustomTests();
	for (const test of customTests) {
		pushQuestionsToPool(test.questions, test.title || "Bộ cá nhân");
	}
}

function pushQuestionsToPool(questions, sourceTitle) {
	if (!Array.isArray(questions)) return;
	for (const q of questions) {
		if (!q) continue;
		const text = String(q.q || q.question || "").trim();
		const opts = Array.isArray(q.opts) ? q.opts : Array.isArray(q.options) ? q.options : [];
		const answerRaw = typeof q.answer !== "undefined" && q.answer !== null ? q.answer : q.correct;
		const answerIndex = parseAnswerIndex(answerRaw, opts);
		const explanation = String(q.explain || q.explanation || "").trim();
		if (!text || opts.length < 2) continue;
		if (answerIndex < 0 || answerIndex >= opts.length) continue;
		homeQuestionPool.push({
			question: text,
			options: opts.map((o) => String(o)),
			answerIndex,
			explanation,
			source: sourceTitle
		});
	}
}

function parseAnswerIndex(answer, options) {
	if (Number.isInteger(answer)) return answer;
	if (typeof answer === "string") {
		const t = answer.trim();
		if (/^[A-Za-z]$/.test(t)) {
			return t.toUpperCase().charCodeAt(0) - 65;
		}
		if (/^\d+$/.test(t)) {
			return parseInt(t, 10);
		}
		const idx = options.findIndex((o) => String(o).trim() === t);
		if (idx >= 0) return idx;
	}
	return -1;
}

function renderFurigana(text) {
	return escapeHtml(String(text || "")).replace(/([\u4E00-\u9FFF々〆ヵヶ\u3040-\u309F\u30A0-\u30FF]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
}

function showRandomHomeQuestion() {
	const sourceEl = document.getElementById("home-random-source");
	const qEl = document.getElementById("home-random-question");
	const optEl = document.getElementById("home-random-options");
	const feedbackEl = document.getElementById("home-random-feedback");
	if (!sourceEl || !qEl || !optEl || !feedbackEl) return;

	if (!homeQuestionPool.length) {
		sourceEl.textContent = "Nguồn: chưa có dữ liệu";
		qEl.textContent = "Chưa tải được câu hỏi ngẫu nhiên.";
		optEl.innerHTML = "";
		feedbackEl.textContent = "";
		currentHomeQuestion = null;
		return;
	}

	const pick = homeQuestionPool[Math.floor(Math.random() * homeQuestionPool.length)];
	currentHomeQuestion = pick;
	sourceEl.textContent = `Nguồn: ${pick.source}`;
	qEl.innerHTML = renderFurigana(pick.question);
	optEl.innerHTML = pick.options
		.map((opt, idx) => `<button type="button" class="opt" onclick="window.selectHomeOption && window.selectHomeOption(${idx})"><strong>${String.fromCharCode(65 + idx)}.</strong> ${renderFurigana(opt)}</button>`)
		.join("");
	feedbackEl.textContent = "Hãy chọn 1 đáp án.";
	feedbackEl.className = "small mt-2 text-muted";
}

function selectHomeOption(selectedIndex) {
	if (!currentHomeQuestion) return;
	const optionNodes = Array.from(document.querySelectorAll("#home-random-options .opt"));
	if (!optionNodes.length) return;

	const correctIndex = currentHomeQuestion.answerIndex;
	optionNodes.forEach((node, idx) => {
		node.disabled = true;
		node.classList.remove("correct", "incorrect");
		if (idx === correctIndex) node.classList.add("correct");
		if (idx === selectedIndex && idx !== correctIndex) node.classList.add("incorrect");
	});

	const feedbackEl = document.getElementById("home-random-feedback");
	if (!feedbackEl) return;
	if (selectedIndex === correctIndex) {
		const explanationHtml = currentHomeQuestion.explanation ? `<div class="mt-1">💡 ${renderFurigana(currentHomeQuestion.explanation)}</div>` : "";
		feedbackEl.innerHTML = `✅ Chính xác${explanationHtml}`;
		feedbackEl.className = "small mt-2 text-success fw-semibold";
	} else {
		const explanationHtml = currentHomeQuestion.explanation ? `<div class="mt-1">💡 ${renderFurigana(currentHomeQuestion.explanation)}</div>` : "";
		feedbackEl.innerHTML = `❌ Sai rồi. Đáp án đúng là ${String.fromCharCode(65 + correctIndex)}.${explanationHtml}`;
		feedbackEl.className = "small mt-2 text-danger fw-semibold";
	}
}

function renderSidebar() {
	// Group resources by category
	const groups = {};
	resources.forEach((item) => {
		if (item.category === "Minitest") return;
		if (!groups[item.category]) groups[item.category] = [];
		groups[item.category].push(item);
	});

	Object.entries(groups).forEach(([cat, items], idx) => {
		const itemId = `accordion-item-${idx}`;
		const headerId = `accordion-header-${idx}`;
		const collapseId = `accordion-collapse-${idx}`;

		// Accordion item
		const accordionItem = document.createElement("div");
		accordionItem.className = "accordion-item";

		// Header (button)
		const header = document.createElement("h2");
		header.className = "accordion-header";
		header.id = headerId;

		const headerBtn = document.createElement("button");
		headerBtn.className = "accordion-button";
		// Expand by default for "Tài liệu học tập"
		if (cat !== "Tài liệu học tập") {
			headerBtn.classList.add("collapsed");
		}
		headerBtn.type = "button";
		headerBtn.setAttribute("data-bs-toggle", "collapse");
		headerBtn.setAttribute("data-bs-target", `#${collapseId}`);
		headerBtn.setAttribute("aria-expanded", cat === "Tài liệu học tập" ? "true" : "false");
		headerBtn.setAttribute("aria-controls", collapseId);
		headerBtn.textContent = cat;

		header.appendChild(headerBtn);

		// Collapse body
		const collapseDiv = document.createElement("div");
		collapseDiv.id = collapseId;
		collapseDiv.className = `accordion-collapse collapse${cat === "Tài liệu học tập" ? " show" : ""}`;
		collapseDiv.setAttribute("aria-labelledby", headerId);
		collapseDiv.setAttribute("data-bs-parent", "#resource-nav");

		const bodyDiv = document.createElement("div");
		bodyDiv.className = "accordion-body p-0";

		// Add items to body
		items.forEach((item) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "nav-item-btn";
			btn.dataset.id = item.id;
			const fileType = getFileType(item.path);
			btn.innerHTML = `
				<span class="nav-item-title">${escapeHtml(item.title)}</span>
			`;
			btn.addEventListener("click", async () => {
				// Mark active
				resourceNav.querySelectorAll(".nav-item-btn").forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");

				// Close offcanvas on mobile
				const sidebarEl = document.getElementById("sidebar");
				const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
				if (bsOffcanvas) bsOffcanvas.hide();

				await loadDocument(item.path, item.title);
			});
			bodyDiv.appendChild(btn);
		});

		collapseDiv.appendChild(bodyDiv);
		accordionItem.appendChild(header);
		accordionItem.appendChild(collapseDiv);
		resourceNav.appendChild(accordionItem);
	});
}

async function loadDocument(path, title) {
	// Show viewer panel; hide welcome
	welcomeScreen.classList.add("d-none");
	viewerArea.classList.remove("d-none");

	viewerTitle.textContent = title;
	viewerContent.innerHTML = `<p class="text-muted">Đang tải…</p>`;

	try {
		const fileType = getFileType(path);
		const normalizedType = fileType.toLowerCase();

		if (normalizedType === "about" || path === "") {
			// Load about.html
			const response = await fetch(basePath + "about.html", { cache: "no-store" });
			if (!response.ok) {
				throw new Error("Không thể tải trang About");
			}
			const html = await response.text();
			viewerContent.innerHTML = html;
		} else if (normalizedType === "markdown") {
			const response = await fetch(basePath + path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			viewerContent.innerHTML = marked.parse(text);
		} else if (normalizedType === "html") {
			renderHtmlPreview(path, title);
		} else if (normalizedType === "json") {
			const response = await fetch(basePath + path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const items = await response.json();
			renderFlashcards(items);
		} else if (normalizedType === "tsv") {
			const response = await fetch(basePath + path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			renderFlashcardsFromTsv(text);
		} else {
			const response = await fetch(basePath + path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			viewerContent.textContent = text;
		}

	} catch (error) {
		viewerContent.innerHTML = `<div class="alert alert-danger">Không tải được tài liệu. Hãy dùng nút <strong>Mở file gốc</strong> phía trên để xem trực tiếp.</div>`;
	}
}

function renderHtmlPreview(path, title) {
	viewerContent.innerHTML = `
		<div class="html-preview-wrap">
			<iframe class="html-preview-frame" src="${encodeURI(basePath + path)}" title="${escapeHtml(title)}"></iframe>
		</div>
	`;
}

function renderFlashcardsFromTsv(rawText) {
	const lines = rawText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const items = lines
		.map((line, index) => {
			const parts = line.split("\t");
			if (parts.length < 2) {
				return null;
			}
			return {
				id: index + 1,
				front: parts[0].trim(),
				back: parts.slice(1).join("\t").trim()
			};
		})
		.filter((item) => item && item.front && item.back);

	renderFlashcards(items);
}

function renderFlashcards(items) {
	if (!Array.isArray(items) || items.length === 0) {
		viewerContent.innerHTML = `<p class="muted">Chưa có dữ liệu hợp lệ để tạo thẻ lật.</p>`;
		return;
	}

	const cardsHtml = items
		.map(
			(item, index) => `
			<button type="button" class="flashcard" data-card-index="${index}" aria-label="Lật thẻ ${index + 1}">
				<div class="flashcard-inner">
					<div class="flashcard-face flashcard-front">${escapeHtml(item.front || "")}</div>
					<div class="flashcard-face flashcard-back">${escapeHtml(item.back || "")}</div>
				</div>
			</button>
		`
		)
		.join("");

	viewerContent.innerHTML = `
		<div class="flashcards-meta">
			<p><strong>${items.length}</strong> thẻ lật. Bấm vào từng thẻ để xem đáp án.</p>
		</div>
		<div class="flashcard-grid">${cardsHtml}</div>
	`;

	const allCards = viewerContent.querySelectorAll(".flashcard");
	allCards.forEach((card) => {
		card.addEventListener("click", () => {
			card.classList.toggle("is-flipped");
		});
	});
}

function escapeHtml(text) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;"
	};

	return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
