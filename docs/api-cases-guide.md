# API Cases 新增操作指南

本文档说明如何在 FlowPatch 中新增一个 API、一个或多个 case，以及每个 case 的多版本 request/response（含 BAU 与 Current）。

## 1. 数据根目录

在 `API Cases` 页面点击 `Select Folder` 选择数据根目录。目录结构要求如下：

```text
<root>/
  AuthLogin/
  TransferCreate/
  ...
```

每个子目录代表一个 API。

## 2. 新增一个 API

以 `PaymentCreate` 为例：

1. 新建目录：

```text
<root>/PaymentCreate/
```

2. 在目录下创建 `_index.json`：

```json
{
  "id": "payment-create",
  "name": "Payment Create",
  "method": "POST",
  "path": "/api/v1/payments",
  "cases": {
    "INFT.payment.success": {
      "name": "INFT Payment Success",
      "desc": "Payment success path.",
      "bau": "20260404122322",
      "current": "20260407153010"
    }
  }
}
```

## 3. 新增一个 case（最少两版）

文件命名规范：

- `request--{caseId}--{timestamp}.json`
- `response--{caseId}--{timestamp}.json`

例如 caseId 为 `INFT.payment.success`，新增两个版本：

```text
request--INFT.payment.success--20260404122322.json
response--INFT.payment.success--20260404122322.json
request--INFT.payment.success--20260407153010.json
response--INFT.payment.success--20260407153010.json
```

说明：

- `timestamp` 建议用纯数字时间戳（如 `YYYYMMDDHHmmss`）。
- `bau/current` 由 `_index.json` 指向，不由文件名决定。

## 4. 新增更多版本

只需要继续追加新文件对：

```text
request--INFT.payment.success--20260410120000.json
response--INFT.payment.success--20260410120000.json
```

然后按需更新 `_index.json` 里的 `current`（或 `bau`）。

## 5. 新增更多 case

1. 在 `_index.json` 的 `cases` 增加新 caseId 条目。
2. 为这个 caseId 新增对应的 request/response 文件（至少 1 版，建议 2 版）。

## 6. 在页面查看

在 `API Cases` 页面：

- 点击 `Reload` 重新加载目录。
- 切换视图：
  - `BAU`：展示 `_index.json` 指定的 BAU 版本。
  - `Current`：展示 `_index.json` 指定的 Current 版本。
  - `All Versions`：展示该 case 所有版本。

## 7. 常见问题

1. 看不到新 API
- 检查是否在已选择的根目录下。
- 检查 API 是否是子目录（不是文件）。

2. case 没有内容
- 检查文件名是否严格符合：`request--...--timestamp.json` / `response--...--timestamp.json`。
- 检查 `caseId` 是否与 `_index.json` 里完全一致（区分大小写）。

3. BAU/Current 不生效
- 检查 `_index.json` 中 `bau/current` 是否对应已有 timestamp。
- 若不存在，系统会回退到最早/最新版本。

## 8. 最小可用清单

新增一个 API 最少需要：

- 一个 API 目录（如 `PaymentCreate`）
- 一个 `_index.json`
- 至少一个 case 的 request/response 文件对

建议生产使用：

- 每个 case 至少两版（BAU + Current）
- `_index.json` 明确填写 `bau/current`
