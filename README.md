# Mercy Capital Court（MCC）— 90 分钟倒计时 AI 审判游戏原型

玩家扮演被告，在 90 分钟内通过「证据卡片」与「调查派遣」将罪责概率降到 92% 以下，否则触发处决结局。AI 法官（Judge Maddox）支持 OpenAI 兼容接口（例如 `https://cli.mmg.bio/v1`），可在 UI 中输入 Key 与刷新模型列表。

> 注：本项目为玩法/交互原型，世界观与案件元素参考《Mercy (2026)》的“Mercy Capital Court”设定，但不包含影片素材。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`

## 构建与预览

```bash
npm run build
npm run preview
```

## 玩法速览

- 证据链：点击卡片选中，点「提交证据」让法官审查并更新罪责概率
- 调查派遣：左侧派遣搭档获取新证据（任务完成后自动回传）
- AI 对话：底部抽屉与法官对话（无 Key 时可离线体验）
- 结局：时间到自动宣判；也可在罪责 < 92% 时点「申请宣判」提前结束

## AI 配置

右上角「配置」：

- Base URL：OpenAI 兼容 `.../v1`（默认 `https://cli.mmg.bio/v1`）
- API Key：仅保存在内存中，不会写入仓库
- 模型：可刷新 `GET /v1/models` 并选择；也可先填 `gemini` / `gpt-5.2` 作为“别名提示”，刷新后会自动匹配

## 调试（可选）

为了快速体验，可在 URL 加 `?t=300` 把倒计时改为 300 秒（5 分钟）。
