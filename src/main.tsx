import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }
  
  // 动态导入，避免打包到生产环境
  const { worker } = await import('./mocks/browser')
  
  // 启动 worker
  return worker.start({
    onUnhandledRequest: 'bypass', // 未定义的接口直接透传，不报错
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />)
})
