import React from 'react';
import './globals.css';

export const metadata = {
  title: '股市戰情室 — Stock Dashboard',
  description: '台股美股即時戰情室：K 線圖、技術指標、即時報價、AI 新聞摘要',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="app-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <h1>📊 戰情室</h1>
              <div className="subtitle">Stock Market Dashboard</div>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section">市場</div>
              <button className="nav-item active">
                <span className="nav-icon">🏠</span>
                總覽儀表板
              </button>
              <button className="nav-item" disabled>
                <span className="nav-icon">📈</span>
                個股詳情
              </button>
              <button className="nav-item" disabled>
                <span className="nav-icon">⭐</span>
                自選股清單
              </button>

              <div className="nav-section">工具</div>
              <button className="nav-item" disabled>
                <span className="nav-icon">🔍</span>
                技術篩選器
              </button>
              <button className="nav-item" disabled>
                <span className="nav-icon">🤖</span>
                AI 新聞摘要
              </button>
              <button className="nav-item" disabled>
                <span className="nav-icon">⚡</span>
                異常警告
              </button>

              <div className="nav-section">設定</div>
              <button className="nav-item" disabled>
                <span className="nav-icon">⚙️</span>
                偏好設定
              </button>
            </nav>

            <div className="sidebar-footer">
              v0.2.0 · free-first · 延遲資料
            </div>
          </aside>

          {/* Main */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
