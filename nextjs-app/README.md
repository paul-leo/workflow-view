# Next.js TypeScript Subproject

这是一个在 workflow-view 项目中创建的 Next.js TypeScript 子项目。

## 技术栈

- **Next.js 15.5.4** - React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **ESLint** - 代码质量检查
- **App Router** - Next.js 13+ 的新路由系统

## 项目结构

```
nextjs-app/
├── src/
│   └── app/
│       ├── globals.css      # 全局样式
│       ├── layout.tsx       # 根布局组件
│       └── page.tsx         # 首页组件
├── public/                  # 静态资源
├── next.config.ts          # Next.js 配置
├── tsconfig.json           # TypeScript 配置
├── eslint.config.mjs       # ESLint 配置
└── package.json            # 项目依赖

```

## 开发命令

```bash
# 进入项目目录
cd nextjs-app

# 安装依赖（已完成）
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行 ESLint 检查
npm run lint
```

## 开发服务器

运行 `npm run dev` 后，打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 特性

- ✅ TypeScript 支持
- ✅ Tailwind CSS 集成
- ✅ ESLint 配置
- ✅ App Router (Next.js 13+)
- ✅ 自动代码分割
- ✅ 优化的生产构建
- ✅ 源目录结构 (`src/` 目录)
- ✅ 路径别名 (`@/*` 指向 `./src/*`)

## 开始开发

编辑 `src/app/page.tsx` 开始修改首页，保存后会自动热重载。