# 出包 SOP Checklist

> 每次出包，按顺序执行，全部打勾才算完成。
> 目的：保护自己，留证据，QA 无法说"没收到"。

---

## 出包前

- [ ] 确认当前 branch 正确（不是错误的 branch）
- [ ] 确认包含的 story / ticket 范围（对应哪些 ADO ticket）
- [ ] 确认 build number 正确，与 ADO ticket 对应
- [ ] Build 开始前，在 group 里确认 App Version：

```
Starting build with version 23.0.0.

Please confirm if different version is needed.

Build in progress.

Will update if any review is triggered.
```

- [ ] 若 App Version 有特殊要求，已确认并记录
- [ ] TestFlight 上确认包已上传成功
- [ ] App Store Connect · TestFlight 截图（证明包存在，时间戳可见）

---

## 出包后 · 四件事（按顺序）

### 1. Teams · @QA

```
Hi @QA [名字],

[市场][项目] [阶段] package is ready on TestFlight.

Build: XXXXX
Stories covered:
- [ADO ticket 编号] Story 标题
- [ADO ticket 编号] Story 标题

TestFlight screenshot: [截图或链接]

Please reply to confirm receipt. Thanks.
```

- [ ] 已发送
- [ ] 已 @正确的 QA 负责人
- [ ] 包含 build number
- [ ] 包含 story 列表
- [ ] 包含 TestFlight 截图
- [ ] 已加 "Please reply to confirm receipt"

---

### 2. Confluence · Table 更新

- [ ] 已更新对应 release 的 package 记录
- [ ] 包含：日期 / build number / story 范围 / 出包人

---

### 3. ADO · Comment 更新

- [ ] 每个相关 ticket 都已更新 comment
- [ ] Comment 内容包含：build number / 出包时间 / TestFlight 截图

---

### 4. 邮件通知

```
Subject: [市场][项目] SIT · Package | MVPX · YYYY-MM-DD

Hi team,

[项目] [阶段] package is available on TestFlight.

Build: XXXXX
Date: YYYY-MM-DD HH:MM SGT
Stories:
- [ADO ticket] Story 标题
- [ADO ticket] Story 标题

TestFlight screenshot: [截图附件]

Please reach out if any issues.

Hans
```

- [ ] 已发送
- [ ] 收件人包含：QA / PO / BFF / SL（视情况）
- [ ] 附上 TestFlight 截图
- [ ] 标题符合邮件标题规范

---

## 出包后 · 跟进

- [ ] QA 已回复确认收到（若 24 小时未回复，Teams 再 ping 一次）
- [ ] 若 QA 无回复，记录在 Confluence：已通知，未收到确认回复

---

## 快速模板（复制即用）

### Teams 消息

```
Hi @[QA名字],

[SG][WISE] SIT package is ready on TestFlight.

Build: XXXXX
Stories:
- ADO#XXXX Story 标题
- ADO#XXXX Story 标题

[附 TestFlight 截图]

Please reply to confirm receipt. Thanks.
```

### ADO Comment

```
SIT Package ready.
Build: XXXXX
Date: YYYY-MM-DD HH:MM SGT
Notified: QA via Teams + Email
TestFlight: [截图]
```

### Confluence Table 一行

| Date | Build | Stories | Stage | Notified | QA Confirmed |
|---|---|---|---|---|---|
| 2026-04-13 | XXXXX | ADO#1, ADO#2 | SIT | Teams + Email | Pending |

---

*SOP 版本 v1.0 · 2026年4月*
*原则：每一步都有记录，QA 无法说没收到，出了问题责任清楚。*
