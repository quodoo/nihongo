const resources = [
	{
		id: "dongtu-khung",
		title: "Khung chương trình Động từ (N5-N3)",
		description: "Tài liệu định hướng biên soạn chương, mục tiêu đầu ra, lộ trình triển khai.",
		type: "Markdown",
		path: "dongtu/yeucau.md",
		category: "Tài liệu học tập"
	},
	{
		id: "trotu-cam-nang",
		title: "Cẩm nang Trợ từ và chia thể",
		description: "Tài liệu học trọng tâm trợ từ theo ngữ cảnh và mẫu dùng thực tế.",
		type: "Markdown",
		path: "trotu/taileu-ontap-trotu.md",
		category: "Tài liệu học tập"
	},
	{
		id: "trotu-sheet",
		title: "Bảng tra nhanh Trợ từ",
		description: "Bộ thẻ lật học nhanh được xuất từ Quizlet, tối ưu để học trực tiếp trên web.",
		type: "JSON",
		path: "trotu/quizlet-tro-tu-import.json",
		category: "Quizlet"
	},
	{
		id: "trotu-minitest-md",
		title: "Mini test Trợ từ 100 câu",
		description: "Ngân hàng câu hỏi luyện tập theo định dạng JLPT từ N5 đến N3.",
		type: "Markdown",
		path: "trotu/mini-test-tro-tu-100-cau.md",
		category: "Minitest"
	},
	{
		id: "trotu-quiz-html",
		title: "Mini test Trợ từ (Làm bài)",
		description: "Giao diện làm bài trực tiếp có tính điểm và phản hồi ngay.",
		type: "HTML",
		path: "trotu/minitest_trotu.html",
		category: "Minitest"
	},
	{
		id: "about",
		title: "Giới thiệu",
		description: "Thông tin về dự án tài liệu giảng dạy.",
		type: "ABOUT",
		path: "",
		category: "About"
	}
];

const resourceNav = document.getElementById("resource-nav");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");
const welcomeScreen = document.getElementById("welcome-screen");
const viewerArea = document.getElementById("viewer-area");

renderSidebar();

function renderSidebar() {
	// Group resources by category
	const groups = {};
	resources.forEach((item) => {
		if (!groups[item.category]) groups[item.category] = [];
		groups[item.category].push(item);
	});

	Object.entries(groups).forEach(([cat, items]) => {
		const catEl = document.createElement("div");
		catEl.className = "nav-category";
		catEl.textContent = cat;
		resourceNav.appendChild(catEl);

		items.forEach((item) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "nav-item-btn";
			btn.dataset.id = item.id;
			btn.innerHTML = `
				<span class="nav-item-title">${escapeHtml(item.title)}</span>
				${item.type !== "ABOUT" ? `<span class="badge rounded-pill text-bg-light border" style="font-size:0.68rem">${escapeHtml(item.type)}</span>` : ""}
			`;
			btn.addEventListener("click", async () => {
				// Mark active
				resourceNav.querySelectorAll(".nav-item-btn").forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");

				// Close offcanvas on mobile
				const sidebarEl = document.getElementById("sidebar");
				const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
				if (bsOffcanvas) bsOffcanvas.hide();

				await loadDocument(item.path, item.title, item.type);
			});
			resourceNav.appendChild(btn);
		});
	});
}

async function loadDocument(path, title, type) {
	// Show viewer panel; hide welcome
	welcomeScreen.classList.add("d-none");
	viewerArea.classList.remove("d-none");

	viewerTitle.textContent = title;
	viewerContent.innerHTML = `<p class="text-muted">Đang tải…</p>`;

	try {
		const normalizedType = type.toLowerCase();

		if (normalizedType === "about") {
			renderAbout();
		} else if (normalizedType === "markdown") {
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

	} catch (error) {
		viewerContent.innerHTML = `<div class="alert alert-danger">Không tải được tài liệu. Hãy dùng nút <strong>Mở file gốc</strong> phía trên để xem trực tiếp.</div>`;
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

function renderAbout() {
	viewerContent.innerHTML = `
		<div class="p-2">
			<h4 class="fw-bold mb-3">📖 Giới thiệu dự án</h4>
			<p>Trang này tập hợp các tài liệu giảng dạy tiếng Nhật từ trình độ <strong>N5 đến N3</strong>, tập trung vào hai mảng kiến thức trọng tâm:</p>
			<ul>
				<li><strong>Trợ từ:</strong> Học theo ngữ cảnh hành động — Làm gì → Ở đâu → Bằng gì → Với ai → Từ đâu → Đến đâu.</li>
				<li><strong>Động từ:</strong> Chia thể cơ bản đến nâng cao: masu, te, nai, ta, ukemi, shieki, kanou…</li>
			</ul>
			<hr>
			<h6 class="fw-bold">Cấu trúc tài liệu</h6>
			<table class="table table-bordered table-sm">
				<thead class="table-light">
					<tr><th>Mục</th><th>Nội dung</th></tr>
				</thead>
				<tbody>
					<tr><td>📚 Tài liệu học tập</td><td>Giáo trình chi tiết theo từng chương, có ví dụ phân tích và bài tập.</td></tr>
					<tr><td>🃏 Quizlet</td><td>Bộ thẻ lật ôn tập trợ từ, bấm để lật xem nghĩa và ví dụ.</td></tr>
					<tr><td>🎯 Minitest</td><td>100 câu trắc nghiệm JLPT từ N5–N3, có tính điểm và phản hồi ngay.</td></tr>
				</tbody>
			</table>
			<hr>
			<p class="text-muted small mb-0">Dự án được biên soạn và duy trì trên GitHub. Cập nhật nội dung bằng cách chỉnh sửa file Markdown trong repo.</p>
		</div>
	`;
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
