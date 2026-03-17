let resources = [];

const resourceNav = document.getElementById("resource-nav");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");
const welcomeScreen = document.getElementById("welcome-screen");
const viewerArea = document.getElementById("viewer-area");

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

// About button click handler
document.getElementById("about-btn").addEventListener("click", async () => {
	await loadDocument("", "Giới thiệu");
});

document.getElementById("minitest-btn").addEventListener("click", async () => {
	await openMiniTest();
});

async function openMiniTest() {
	await loadDocument("minitest.html", "Mini Test Tiếng Nhật");
}

window.openMiniTest = openMiniTest;

// Logo button - go back to home/welcome screen
document.getElementById("logo-btn").addEventListener("click", (e) => {
	e.preventDefault();
	// Hide viewer, show welcome screen
	viewerArea.classList.add("d-none");
	welcomeScreen.classList.remove("d-none");
	// Clear active nav items
	resourceNav.querySelectorAll(".nav-item-btn").forEach((b) => b.classList.remove("active"));
});

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
