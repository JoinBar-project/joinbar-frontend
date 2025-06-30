# joinBar-frontend

🗺️ 🥂JoinBar 是一個酒吧社交地圖平台，整合了酒吧地圖、發起酒吧相關娛樂活動，亦可對活動留下評論，提供用戶搜尋酒吧、舉辦或參與活動、將官方活動加入購物車並購買、留下或觀看活動評論等功能。

---

### 前端使用套件

- Vue.js
- Pinia
- Tailwind CSS（搭配 DaisyUI）

---

### 團體專案協作流程

1. 使用 GitHub 加入專案
```
- 開啟 GitHub 專案頁面
- 點選「Code」> 複製 HTTPS/SSH 連結
- 使用 git clone 指令下載專案
  git clone <repo-url> 例如：git clone <https://github.com/JoinBar-project/joinbar-frontend.git>
```

2. 開票（issue）
```
- 到 GitHub 專案頁面
- 點選「Issues」>「New Issue」
- 填寫標題與說明（可加上 labels）
- 按「Submit new issue」
```

3. 組員取票
```
在 issue 中留言這張票要做的事，並由管理員指派你，或自行 assign
```

4. 確認目前專案資料夾中檔案為最新檔案
```
在專案目錄執行： git pull origin main
```

5. 建立功能分支
```
git checkout -b issue/號碼
例如：git checkout -b issue/1
```

6. 開始開發並 commit
```
git add 檔案名稱
git commit -m "feat: 加入登入頁面"
```

7. push 到遠端
```
git push origin issue/號碼
例如：git push origin issue/1
```

8. 發 Pull Request 並 Code Review
```
- 到 GitHub 專案頁面
- 點選「Pull Requests」>「New pull request」
- 選擇 base 為 dev 分支（開發階段都是選 dev 分支），compare 為你剛 push 的分支
- 填寫說明並送出
- 等待他人 Review
```

9. 合併（Merge）
```
Merge：(若需整合最新 main)
git checkout issue/號碼
git fetch origin
git merge origin/dev
若有衝突需解決後繼續： git add . → git merge --continue
```

---

### 執行方式

1. 專案 JoinBar-project 進入到 JoinBar-Frontend 資料夾
```
cd JoinBar-Frontend
```

2. JoinBar-Frontend 資料夾
```
npm install
```

3. 前端運行
```
npm run dev
```

---
### 組員分工

| 組員     | GitHub                                                 | 實現功能 |  
|----------|-------------------------------------------------------|------------|
| 卓訢妤   | [2xin15](https://github.com/2xin15)                    | 1. 登入、註冊、酒吧收藏頁面設計 <br> 2. footer、AI 聊天機器人、登入、註冊 RWD <br> 3. 串接 Google Map API<br> 4. 導入 Gemini AI 實現智慧酒吧推薦系統 |
| 鄭婉君   | [Bella-Cheng](https://github.com/Bella-Cheng)          | 1. 活動前端頁面設計 <br> 2. 訂閱頁面設計|
| 紀雅馨   | [rakku2code](https://github.com/rakku2code)            | 1. 活動功能模組化設計 <br> 2. 建立活動首頁資料取得 API <br> 3. 活動頁面設計|
| 陳紫婷   | [jasminecchen](https://github.com/jasminecchen)        | 1. 活動紀錄切版 |
| 戎彬     | [Benjung1215](https://github.com/Benjung1215)          | 1.  購物車、結帳頁面設計 <br> 2. 訂單管理頁面設計 |
| 蔡昌成   | [kirito489](https://github.com/kirito489)              | 1. 註銷帳號頁面設計 |
| 竇孝武   | [TouHsiaoWu](https://github.com/TouHsiaoWu)            | 1. 地圖關鍵字搜尋 <br> 2. 即時篩選更新、多重篩選設定 <br> 3. 酒吧資訊卡、酒吧詳情頁面設計 |

