const resources = [
	{
		id: "dongtu-khung",
		title: "Khung chương trình Động từ (N5-N3)",
		description: "Tài liệu định hướng biên soạn chương, mục tiêu đầu ra, lộ trình triển khai.",
		type: "Markdown",
		path: "dongtu/yeucau.md",
		category: "Động từ"
	},
	{
		id: "trotu-cam-nang",
		title: "Cẩm nang Trợ từ và chia thể",
		description: "Tài liệu học trọng tâm trợ từ theo ngữ cảnh và mẫu dùng thực tế.",
		type: "Markdown",
		path: "trotu/taileu-ontap-trotu.md",
		category: "Trợ từ"
	},
	{
		id: "trotu-minitest-md",
		title: "Mini test Trợ từ 100 câu (Markdown)",
		description: "Ngân hàng câu hỏi luyện tập theo định dạng JLPT từ N5 đến N3.",
		type: "Markdown",
		path: "trotu/mini-test-tro-tu-100-cau.md",
		category: "Luyện tập"
	},
	{
		id: "trotu-sheet",
		title: "Bảng tra nhanh Trợ từ (Quizlet Flip)",
		description: "Bộ thẻ lật học nhanh được xuất từ Quizlet, tối ưu để học trực tiếp trên web.",
		type: "JSON",
		path: "trotu/quizlet-tro-tu-import.json",
		category: "Bảng tra"
	},
	{
		id: "trotu-quiz-html",
		title: "Mini test Trợ từ (Trang làm bài)",
		description: "Mở giao diện làm bài trực tiếp bằng HTML có sẵn trong repo.",
		type: "HTML",
		path: "trotu/minitest_trotu.html",
		category: "Kiểm tra"
	}
];

const resourceGrid = document.getElementById("resource-grid");
const viewerStatus = document.getElementById("viewer-status");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");
const openFileLink = document.getElementById("open-file-link");

renderCards();

function renderCards() {
	resources.forEach((item, index) => {
		const card = document.createElement("article");
		card.className = "resource-card";
		card.style.animationDelay = `${index * 90}ms`;

		card.innerHTML = `
			<span class="tag">${item.category}</span>
			<h3>${item.title}</h3>
			<p>${item.description}</p>
			<div class="card-actions">
				<button type="button" data-view-path="${item.path}" data-view-title="${item.title}" data-view-type="${item.type}">Xem nhanh</button>
				<a href="${item.path}" target="_blank" rel="noopener noreferrer">Mở file</a>
			</div>
		`;

		resourceGrid.appendChild(card);
	});

	resourceGrid.addEventListener("click", async (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		if (target.matches("button[data-view-path]")) {
			const path = target.getAttribute("data-view-path");
			const title = target.getAttribute("data-view-title");
			const type = target.getAttribute("data-view-type");
			if (path && title && type) {
				await loadDocument(path, title, type);
			}
		}
	});
}

async function loadDocument(path, title, type) {
	viewerStatus.textContent = `Đang tải: ${title}`;
	viewerTitle.textContent = title;
	openFileLink.href = path;
	openFileLink.hidden = false;

	try {
		const normalizedType = type.toLowerCase();

		if (normalizedType === "markdown") {
			const response = await fetch(path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			viewerContent.innerHTML = marked.parse(text);
		} else if (normalizedType === "html") {
			renderHtmlPreview(path, title);
		} else if (normalizedType === "json") {
			const response = await fetch(path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const items = await response.json();
			renderFlashcards(items);
		} else if (normalizedType === "tsv") {
			const response = await fetch(path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			renderFlashcardsFromTsv(text);
		} else {
			const response = await fetch(path, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Không thể đọc file: ${path}`);
			}
			const text = await response.text();
			viewerContent.textContent = text;
		}

		viewerStatus.textContent = `Đang xem: ${title}`;
		document.getElementById("xem-nhanh")?.scrollIntoView({ behavior: "smooth", block: "start" });
	} catch (error) {
		viewerContent.innerHTML = `<p class="muted">Không tải được tài liệu. Hãy mở file trực tiếp bằng nút "Mở file".</p>`;
		viewerStatus.textContent = "Lỗi tải tài liệu";
	}
}

function renderHtmlPreview(path, title) {
	viewerContent.innerHTML = `
		<div class="html-preview-wrap">
			<p class="muted">Đang hiển thị bản xem nhanh của: ${escapeHtml(title)}</p>
			<iframe class="html-preview-frame" src="${encodeURI(path)}" title="${escapeHtml(title)}"></iframe>
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
