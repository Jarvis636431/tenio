# 代码分割优化需求文档

## Introduction

本文档定义了对建筑工程项目管理平台进行代码分割和性能优化的需求。当前应用打包后的 JavaScript 文件达到 6.6MB（gzip 后 1.45MB），导致首次加载时间过长，严重影响用户体验。通过实施路由级别和组件级别的代码分割，以及优化第三方库的打包策略，可以显著减少初始加载时间，提升应用性能。

## Glossary

- **System**: 建筑工程项目管理平台前端应用
- **Bundle**: 打包后的 JavaScript 文件
- **Code Splitting**: 代码分割，将代码拆分成多个小块按需加载
- **Lazy Loading**: 懒加载，延迟加载非关键资源
- **Route**: 应用路由，对应不同的页面
- **Chunk**: 代码块，分割后的独立文件
- **Vendor**: 第三方依赖库
- **Critical Path**: 关键渲染路径，首次渲染必需的资源
- **FCP**: First Contentful Paint，首次内容绘制时间
- **LCP**: Largest Contentful Paint，最大内容绘制时间
- **TTI**: Time to Interactive，可交互时间

## Requirements

### Requirement 1

**User Story:** As a user, I want the application to load quickly on first visit, so that I can start using the platform without long waiting times.

#### Acceptance Criteria

1. WHEN the user first visits the application THEN the System SHALL load only the critical resources needed for the initial route
2. WHEN the initial bundle is loaded THEN the System SHALL have a size less than 500KB (gzipped)
3. WHEN the user navigates to a different route THEN the System SHALL load the route-specific code on demand
4. WHEN measuring FCP THEN the System SHALL achieve a time less than 1.5 seconds on a standard 3G connection
5. WHEN measuring LCP THEN the System SHALL achieve a time less than 2.5 seconds on a standard 3G connection

### Requirement 2

**User Story:** As a developer, I want route-level code splitting implemented, so that each page loads only its required code.

#### Acceptance Criteria

1. WHEN the application builds THEN the System SHALL create separate chunks for each route component
2. WHEN a user navigates to the Index page THEN the System SHALL load only the Index route chunk
3. WHEN a user navigates to the ProjectManagement page THEN the System SHALL load only the ProjectManagement route chunk
4. WHEN a user navigates to the ProjectDetail page THEN the System SHALL load only the ProjectDetail route chunk
5. WHEN a route chunk loads THEN the System SHALL display a loading indicator to provide user feedback

### Requirement 3

**User Story:** As a developer, I want heavy components to be lazy loaded, so that they don't block the initial render.

#### Acceptance Criteria

1. WHEN the ModelViewer component is needed THEN the System SHALL load it on demand as a separate chunk
2. WHEN the GanttChart component is needed THEN the System SHALL load it on demand as a separate chunk
3. WHEN the AIAssistant component is needed THEN the System SHALL load it on demand as a separate chunk
4. WHEN a lazy component is loading THEN the System SHALL display a fallback UI component
5. WHEN a lazy component fails to load THEN the System SHALL display an error message and provide a retry option

### Requirement 4

**User Story:** As a developer, I want third-party libraries to be split into logical chunks, so that they can be cached efficiently by the browser.

#### Acceptance Criteria

1. WHEN the application builds THEN the System SHALL create a separate chunk for React core libraries (react, react-dom, react-router-dom)
2. WHEN the application builds THEN the System SHALL create a separate chunk for UI libraries (all @radix-ui packages)
3. WHEN the application builds THEN the System SHALL create a separate chunk for chart libraries (echarts, echarts-for-react, recharts)
4. WHEN the application builds THEN the System SHALL create a separate chunk for 3D libraries (three, web-ifc, web-ifc-three, web-ifc-viewer)
5. WHEN the application builds THEN the System SHALL create a separate chunk for data fetching libraries (@tanstack/react-query)
6. WHEN vendor chunks are created THEN the System SHALL ensure each chunk is smaller than 500KB (gzipped)

### Requirement 5

**User Story:** As a user, I want smooth transitions between lazy-loaded components, so that the application feels responsive.

#### Acceptance Criteria

1. WHEN a lazy component is loading THEN the System SHALL display a loading spinner or skeleton UI
2. WHEN a lazy component loads successfully THEN the System SHALL render it with a smooth fade-in transition
3. WHEN multiple lazy components load simultaneously THEN the System SHALL prioritize visible components
4. WHEN a lazy component is in the viewport THEN the System SHALL preload it before user interaction
5. WHEN the user hovers over a navigation link THEN the System SHALL prefetch the target route's code

### Requirement 6

**User Story:** As a developer, I want build configuration optimized for code splitting, so that the bundler produces optimal chunks.

#### Acceptance Criteria

1. WHEN the application builds THEN the System SHALL use Vite's manual chunk configuration
2. WHEN the application builds THEN the System SHALL enable tree-shaking for all dependencies
3. WHEN the application builds THEN the System SHALL minify all JavaScript code
4. WHEN the application builds THEN the System SHALL generate source maps for debugging
5. WHEN the application builds THEN the System SHALL output a bundle analysis report showing chunk sizes

### Requirement 7

**User Story:** As a developer, I want to monitor bundle sizes, so that I can prevent regressions.

#### Acceptance Criteria

1. WHEN the application builds THEN the System SHALL generate a visual bundle size report
2. WHEN a build produces chunks larger than 500KB THEN the System SHALL emit a warning
3. WHEN the total bundle size increases by more than 10% THEN the System SHALL fail the build in CI
4. WHEN analyzing the bundle THEN the System SHALL identify the largest dependencies
5. WHEN analyzing the bundle THEN the System SHALL suggest optimization opportunities

### Requirement 8

**User Story:** As a user, I want the application to cache static assets efficiently, so that subsequent visits are faster.

#### Acceptance Criteria

1. WHEN the application builds THEN the System SHALL generate content-hashed filenames for all chunks
2. WHEN a chunk's content changes THEN the System SHALL generate a new hash for that chunk only
3. WHEN a chunk's content remains unchanged THEN the System SHALL keep the same hash to leverage browser cache
4. WHEN serving static assets THEN the System SHALL set appropriate cache headers (max-age=31536000 for hashed files)
5. WHEN the application updates THEN the System SHALL invalidate only the changed chunks in the browser cache
