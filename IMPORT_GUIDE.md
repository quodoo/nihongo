# 📥 Hướng dẫn Import Đề Thi

## 📋 Format JSON

```json
{
  "id": "unique-quiz-id",
  "title": "Tên bài thi",
  "level": "n5",
  "totalQuestions": 10,
  "description": "Mô tả bài thi",
  "questions": [...]
}
```

### Cấu trúc câu hỏi

```json
{
  "q": "Câu hỏi (có thể dùng <ruby> cho furigana)",
  "options": [
    "a. Đáp án 1",
    "b. Đáp án 2",
    "c. Đáp án 3",
    "d. Đáp án 4"
  ],
  "correct": 0,
  "point": 1,
  "explain": "Giải thích chi tiết (có thể dùng HTML: <b>, <br>...)"
}
```

## ✅ Required Fields (Bắt buộc)

### Exam level:
- `id` (string): ID duy nhất
- `title` (string): Tên bài thi
- `questions` (array): Mảng câu hỏi

### Question level:
- `q` (string): Câu hỏi
- `options` (array): Mảng đáp án (2-6 options)
- `correct` (number): Index đáp án đúng (0-based)

## 🔄 Optional Fields (Tùy chọn)

### Exam level:
- `level` (string): n5, n4, n3, n2, n1 (default: n5)
- `totalQuestions` (number): Tự động tính nếu không có
- `description` (string): Mô tả bài thi

### Question level:
- `point` (number): Điểm của câu (default: 1)
- `explain` (string): Giải thích (default: "No explanation")

## 🎨 Sử dụng Furigana

### Format Đơn Giản (Khuyến nghị) ⭐

Chỉ cần viết: `漢字[ふりがな]`

```json
{
  "q": "私[わたし]は学生[がくせい]です。",
  "options": [
    "a. 日本語[にほんご]を勉強[べんきょう]します",
    "b. 本[ほん]を読[よ]みます",
    "c. 友達[ともだち]と遊[あそ]びます"
  ],
  "explain": "毎日[まいにち]日本語[にほんご]を勉強[べんきょう]しています。"
}
```