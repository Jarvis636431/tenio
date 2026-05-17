# Backend Module Architecture Notes

本文档目录用于说明当前 `apps/api` 与 `packages/shared` 的主要模块设计。

当前范围：

- `auth`
- `projects`
- `files`
- `storage`
- `prisma`
- `shared`

阅读顺序建议：

1. [Prisma Module](./prisma-module.md)
2. [Auth Module](./auth-module.md)
3. [Projects Module](./projects-module.md)
4. [Storage Module](./storage-module.md)
5. [Files Module](./files-module.md)
6. [Shared Package](./shared-package.md)

这些文档关注的是：

- 模块职责
- 为什么这样设计
- 当前方案的优点和缺点
- 替代方案及其取舍
