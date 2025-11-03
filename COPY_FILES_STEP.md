# 📁 파일 복사 단계

GitHub Desktop에 **"No local changes"**가 보이면, 프로젝트 파일을 복사해야 합니다.

## 🔍 단계별 가이드

### 1️⃣ GitHub Desktop에서 폴더 위치 확인

**GitHub Desktop 화면에서:**
1. 오른쪽 클릭 또는 휠 메뉴
2. **"Show in Explorer"** 클릭
   - 또는 단축키: `Ctrl + Shift + F`

폴더가 열립니다. 예: `C:\Users\user\Desktop\GwangjuTourApp` 또는 `C:\Users\user\Documents\GitHub\GwangjuTourApp`

---

### 2️⃣ 원본 프로젝트 폴더 열기

다른 창에서:
1. 파일 탐색기 열기
2. `C:\Users\user\GwangjuTourApp` 로 이동
3. 창 나란히 배열

---

### 3️⃣ 파일 복사하기

**주의사항:**
- `.git` 폴더는 복사하지 마세요
- `.gitignore`에 의해 불필요한 파일은 자동 제외됩니다

#### 방법 A: 모든 파일 복사

**원본 폴더(`C:\Users\user\GwangjuTourApp`)에서:**
1. `Ctrl + A` (모든 파일 선택)
2. `.git` 폴더만 선택 해제 (있으면)
3. `Ctrl + C` (복사)

**GitHub Desktop으로 Clone한 폴더로 이동:**
4. `Ctrl + V` (붙여넣기)
5. "확인" 클릭 (덮어쓰기)

#### 방법 B: 수동으로 폴더 복사

복사할 폴더들:
- `backend/`
- `frontend/`
- `.gitignore`
- `README.md`
- `PROJECT_PORTFOLIO.md`
- `create_cloudflare_exe.py`
- `open_cloudflare_tunnel.py`
- `export_to_csv.py`
- `create_exe.py`
- `GITHUB_*.md`
- `QUICK_START.md`

---

### 4️⃣ GitHub Desktop에서 확인

파일을 붙여넣은 후:
1. GitHub Desktop 창으로 돌아가기
2. 자동으로 "Changes" 탭에 파일 목록 표시
3. 왼쪽: "0 changed files" → 많은 파일로 변경됨

---

### 5️⃣ 커밋 & 푸시

**Changes 탭에서:**
1. 하단 Summary 입력: "Add complete project files"
2. **"Commit to main"** 클릭
3. 위쪽 **"Push origin"** 클릭

대기 후 업로드 완료.

---

## ✅ 예상 결과

업로드 후 GitHub에서:
- `backend/` 폴더와 파일들
- `frontend/` 폴더와 파일들
- 설정 파일들
- 문서 파일들

**제외됨:**
- `*.db` (데이터베이스)
- `node_modules/`
- `venv/`
- `__pycache__/`
- `build/`, `dist/`
- `*.exe`
- 그 외 `.gitignore`에 명시된 파일

---

## 🚨 문제 해결

### 파일이 너무 많음
→ `.gitignore`가 작동해 불필요한 파일은 자동 제외

### 데이터베이스 파일 업로드 오류
→ `.gitignore`에서 `.db` 확인

### "Push origin" 버튼이 안 눌림
→ 최상단 "Fetch origin" 클릭 후 재시도

### 충돌 오류
→ Repository → Pull 클릭

