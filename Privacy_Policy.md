# Privacy Policy — Language Nudge Extension

**Last updated:** March 18, 2026

---

## Overview

Language Nudge ("the Extension") is a free, open-source Chrome Extension for vocabulary learning. This Privacy Policy explains what data the Extension accesses, how it is used, and what is shared with third parties.

---

## 1. Data We Collect

**We do not collect any personal data.**

The Extension does not:
- Collect your name, email, or any personally identifiable information
- Track your browsing history or visited URLs
- Send your vocabulary data to any server
- Use analytics, telemetry, or crash reporting tools

---

## 2. Data Stored Locally

All user data is stored **locally on your device** using the browser's built-in `chrome.storage.local` API. This includes:

| Data | Purpose |
|---|---|
| Vocabulary sets (words, answers, meanings) | Core learning functionality |
| Study progress (learned / not learned per word) | Progress tracking |
| Extension settings (intervals, timer, TTS toggle…) | User preferences |

This data **never leaves your device** unless you manually export it.

---

## 3. Third-Party API Calls

The Extension contacts external APIs **only when you explicitly tap the "Hint" (💡) button** during a quiz or study session:

| Service | URL | Purpose | Data Sent |
|---|---|---|---|
| **Jisho** | `https://jisho.org/api/v1/search/words` | Japanese dictionary lookup | The vocabulary word/prompt you are currently studying |


These requests are made directly from your browser. No data is routed through any intermediate server owned by this Extension or its developer.

Please refer to the privacy policies of these third-party services for more information:
- Jisho: [https://jisho.org](https://jisho.org)

---

## 4. Permissions Justification

| Permission | Why It Is Needed |
|---|---|
| `storage` | Save vocabulary sets and progress locally on your device |
| `alarms` | Schedule automatic quiz and study popup reminders |
| `tabs` | Open the quiz/study popup window |
| `windows` | Display the floating quiz and study windows |
| `host_permissions` (jisho.org, api.tatoeba.org) | Fetch dictionary hints and example sentences on demand |

---

## 5. Data Sharing

We do **not** sell, trade, or transfer any data to third parties.

The developer of this Extension:
- Does **not** collect or store any user data on external servers
- Does **not** use data for advertising or profiling purposes
- Does **not** share data with any third party beyond the on-demand API calls described in Section 3

---

## 6. Children's Privacy

This Extension does not knowingly collect data from children under the age of 13. It contains no advertising and no user account system.

---

## 7. Open Source

The full source code of this Extension is publicly available on GitHub:

**[https://github.com/quodoo](https://github.com/quodoo)**

You are welcome to review, audit, fork, or contribute to the codebase.

---

## 8. Changes to This Policy

If this Privacy Policy is updated, the "Last updated" date at the top of this document will be revised. Significant changes will also be noted in the release notes.

---

## 9. Contact

If you have any questions about this Privacy Policy, please contact:

**Developer:** Trinh Van Quang  
**Website:** [https://erpblogs.com](https://erpblogs.com)  
**GitHub:** [https://github.com/quodoo](https://github.com/quodoo)

---

*This Extension is released under the MIT License. It is free, open-source, and built for educational, non-commercial purposes.*
