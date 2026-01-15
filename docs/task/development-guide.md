# Truth 插件开发指南

> 用真金白银验证页面内容的真实还是虚伪

## 项目概述

开发一个 Chrome 浏览器插件，能够：
1. 捕获当前页面的关键信息
2. 通过 Polymarket 查找相关预测市场
3. 在页面中展示市场押注情况

---

## 阶段一：Chrome 插件基础框架

### 目标
搭建最小可运行的 Chrome 插件，验证开发环境配置正确。

### 任务清单
- [x] 创建 `plugin/manifest.json` 配置文件
- [x] 创建 `plugin/popup.html` 弹出界面
- [x] 创建 `plugin/popup.js` 基础逻辑
- [x] 创建 `plugin/styles.css` 样式文件

### 测试方法
1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择 `plugin/` 目录
4. 点击插件图标，确认弹窗正常显示

### 预期结果
- 插件图标出现在浏览器工具栏
- 点击图标弹出一个简单的界面

---

## 阶段二：页面内容捕获

### 目标
实现 Content Script，能够提取当前页面的关键信息（标题、正文摘要、关键词）。

### 任务清单
- [x] 创建 `plugin/content.js` 内容脚本
- [x] 实现页面标题提取
- [x] 实现页面正文提取（取前 500 字符）
- [x] 实现 meta 信息提取（description、keywords）
- [x] 更新 `manifest.json` 添加 content_scripts 配置
- [x] 在 popup 中显示捕获的内容

### 测试方法
1. 重新加载插件
2. 访问任意新闻网站（如 BBC、CNN）
3. 点击插件图标
4. 查看弹窗中是否显示页面信息

### 预期结果
- 弹窗显示当前页面的标题
- 弹窗显示页面摘要内容
- 弹窗显示提取的关键词（如有）

---

## 阶段三：本地测试页面

### 目标
创建本地测试页面，模拟不同类型的新闻内容，便于开发调试。

### 任务清单
- [x] 创建 `test/index.html` 测试页面入口
- [x] 创建 `test/news-politics.html` 政治类新闻
- [x] 创建 `test/news-crypto.html` 加密货币类新闻
- [x] 创建 `test/news-sports.html` 体育类新闻
- [x] 页面内容应包含可能在 Polymarket 上有市场的话题

### 测试方法
1. 用浏览器直接打开 `test/index.html`
2. 点击不同测试页面链接
3. 在测试页面上使用插件，验证内容捕获功能

### 预期结果
- 测试页面正常显示
- 插件能正确捕获测试页面的内容

---

## 阶段四：Polymarket API 集成

### 目标
接入 Polymarket API，根据页面关键词搜索相关市场。

### 前置研究
- Polymarket API 文档：https://docs.polymarket.com/
- 主要使用的接口：市场搜索、市场详情

### 任务清单
- [x] 创建 `plugin/api/polymarket.js` API 封装
- [x] 实现市场搜索功能（基于关键词）
- [x] 实现市场详情获取功能
- [x] 创建 `plugin/background.js` 后台脚本处理 API 请求
- [x] 更新 `manifest.json` 添加必要权限（网络请求）
- [x] 在 popup 中展示搜索到的市场列表

### 测试方法
1. 重新加载插件
2. 访问包含热门话题的页面（如选举、加密货币价格）
3. 点击插件图标
4. 查看是否显示相关的预测市场

### 预期结果
- 能够根据页面内容找到相关市场
- 显示市场标题和基本信息

---

## 阶段五：市场数据展示

### 目标
获取并展示市场的押注详情（Yes/No 比例、交易量、到期时间）。

### 任务清单
- [x] 扩展 API 封装，获取市场详细数据
- [x] 设计数据展示 UI 组件
- [x] 实现 Yes/No 比例可视化（进度条/饼图）
- [x] 显示市场流动性和交易量
- [x] 显示市场结束时间
- [x] 优化 popup 界面布局

### 测试方法
1. 重新加载插件
2. 在测试页面或真实新闻页面使用插件
3. 点击某个市场查看详情
4. 验证数据展示的准确性

### 预期结果
- 清晰展示市场的 Yes/No 押注比例
- 显示市场的关键统计数据
- 界面美观易读

---

## 阶段六：页面内嵌展示（可选增强）

### 目标
将市场信息直接注入到当前页面中显示，而不仅仅在 popup 中展示。

### 任务清单
- [x] 创建 `plugin/inject/widget.js` 注入脚本
- [x] 创建 `plugin/inject/widget.css` 样式文件
- [x] 设计浮动小部件 UI
- [x] 实现小部件的展开/收起功能
- [x] 处理与页面样式的冲突

### 测试方法
1. 重新加载插件
2. 访问新闻页面
3. 观察页面角落是否出现 Truth 小部件
4. 点击小部件查看市场信息

### 预期结果
- 页面右下角出现浮动小部件
- 点击可展开查看相关市场
- 不影响原页面的正常浏览

---

## 技术架构

```
plugin/
├── manifest.json        # 插件配置文件
├── popup.html           # 弹出窗口 HTML
├── popup.js             # 弹出窗口逻辑
├── styles.css           # 样式文件
├── content.js           # 内容脚本（页面注入）
├── background.js        # 后台服务脚本
├── api/
│   └── polymarket.js    # Polymarket API 封装
├── inject/
│   ├── widget.js        # 页面注入小部件
│   └── widget.css       # 小部件样式
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

test/
├── index.html           # 测试页面入口
├── news-politics.html   # 政治新闻测试
├── news-crypto.html     # 加密货币新闻测试
└── news-sports.html     # 体育新闻测试
```

---

## 注意事项

### 开发建议
1. **每个阶段完成后都要测试**，确保功能正常再进入下一阶段
2. **使用 Chrome DevTools** 调试插件（右键插件图标 → 检查弹出内容）
3. **查看 background 日志**（在 chrome://extensions/ 点击「服务工作进程」）
4. **Content Script 调试** 在目标页面的开发者工具 Console 中查看

### 常见问题
- **API 跨域问题**：需要在 manifest.json 中配置 host_permissions
- **Content Script 不生效**：检查 matches 配置，确保匹配目标页面
- **样式冲突**：使用 Shadow DOM 或添加特定前缀避免

### 参考资源
- [Chrome Extension 开发文档](https://developer.chrome.com/docs/extensions/)
- [Polymarket API 文档](https://docs.polymarket.com/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 版本规划

| 版本 | 包含阶段 | 状态 |
|------|----------|------|
| v0.1 | 阶段一、二、三 | 待开发 |
| v0.2 | 阶段四 | 待开发 |
| v0.3 | 阶段五 | 待开发 |
| v1.0 | 阶段六 | 待开发 |

---

*开始开发时，请先完成阶段一，确认插件能正常加载后再继续。*
