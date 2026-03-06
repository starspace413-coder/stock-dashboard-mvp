import './globals.css';

export const metadata = {
  title: 'Stock Dashboard (MVP)'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="container">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>股市戰情室 MVP</div>
              <div className="small">TW:2330 / US:AAPL · free-first · 延遲資料 · build: 2026-03-06-02</div>
            </div>
            <a className="small" href="/" style={{ opacity: 0.9 }}>Dashboard</a>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
