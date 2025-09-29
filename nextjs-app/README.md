# Next.js TypeScript 独立项目

这是一个简化的 Next.js TypeScript 项目，使用 Next 自带脚本和单一 Docker 构建流程，可作为独立项目运行。

## 🚀 技术栈

- **Next.js 15.5.4** - React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **ESLint** - 代码质量检查
- **Docker** - 单一镜像容器化部署
- **GitHub Actions** - 简洁的 CI/CD 自动化

## 📁 项目结构

```
nextjs-app/
├── src/
│   └── app/
│       ├── api/
│       │   └── health/      # 健康检查 API
│       ├── globals.css      # 全局样式
│       ├── layout.tsx       # 根布局组件
│       └── page.tsx         # 首页组件
├── public/                  # 静态资源
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml          # 自动部署配置
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml          # 自动部署配置
├── Dockerfile              # 生产镜像（单一环境）
├── .dockerignore           # Docker 忽略文件
├── .env.example            # 环境变量示例
├── next.config.ts          # Next.js 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目依赖
```

## 🛠️ 开发命令

### 基础命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
npm run lint:fix

# 类型检查
npm run type-check

# 运行测试套件
npm run test

# 清理构建文件
npm run clean
```

### Docker 使用
```bash
# 构建镜像（在 nextjs-app 目录下）
docker build -t nextjs-app .

# 运行容器
docker run -p 3000:3000 nextjs-app
```

## 🐳 Docker 部署

使用上面的 Docker 命令即可完成部署，无需区分多环境。

本地开发优先使用 Next 自带脚本：`npm run dev`。

## 🚀 自动化部署

项目配置了 GitHub Actions 自动部署：

1. **触发条件**: 推送到 `main` 分支或手动触发
2. **构建流程**: 
   - 安装依赖
   - 运行代码检查和测试
   - 构建 Docker 镜像
   - 推送到阿里云容器镜像服务
   - 触发生产环境部署

### 环境变量配置
在 GitHub Secrets 中配置：
- `DOCKER_USERNAME`: Docker 注册表用户名
- `DOCKER_PASSWORD`: Docker 注册表密码
- `DEPLOY_WEBHOOK_SECRET`: 部署 Webhook 密钥

## 🔧 配置文件

### Next.js 配置 (`next.config.ts`)
- 启用 standalone 输出模式（Docker 优化）
- 安全头配置
- 生产环境优化

### Docker 配置
- **多阶段构建**: 优化镜像大小
- **非 root 用户**: 提高安全性

## 🏥 健康检查

应用提供健康检查端点：
- **URL**: `/api/health`
- **方法**: GET, HEAD
- **返回**: 应用状态、内存使用、运行时间等信息

## 🔒 安全特性

- CSP (Content Security Policy) 头设置
- XSS 保护
- 点击劫持防护
- MIME 类型嗅探防护
- 速率限制
- 安全的 Docker 镜像（非 root 用户）

## 📊 监控和日志

- Docker 健康检查
- Nginx 访问日志
- 应用错误日志
- 性能监控端点

## 🚀 生产环境部署步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd nextjs-app
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件
   ```

3. **验证部署**
   ```bash
   curl http://localhost/api/health
   ```

## 🧪 测试

```bash
# 运行完整测试套件
npm run test

# 单独运行各种检查
npm run lint          # 代码质量检查
npm run type-check    # TypeScript 类型检查
npm run build         # 构建测试
npm audit             # 安全漏洞检查
```

## 📝 开发指南

1. **代码规范**: 使用 ESLint 和 TypeScript 确保代码质量
2. **提交规范**: 建议使用语义化提交信息
3. **分支策略**: 使用 `main` 分支作为生产分支
4. **部署流程**: 推送到 `main` 分支自动触发部署

## 🆘 故障排除

### 常见问题
1. **构建失败**: 检查 Node.js 版本和依赖
2. **Docker 构建失败**: 确保 Docker 版本支持多阶段构建
3. **部署失败**: 检查环境变量和网络连接
4. **健康检查失败**: 查看应用日志和端口配置

### 日志查看
```bash
# Docker 容器日志
docker logs nextjs-app

# Docker Compose 日志
docker-compose logs -f

# Nginx 日志
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

**项目状态**: ✅ 生产就绪  
**最后更新**: 2025年1月  
**维护者**: 开发团队