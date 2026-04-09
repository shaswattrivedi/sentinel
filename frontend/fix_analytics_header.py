with open("src/pages/Analytics.tsx", "r") as f:
    content = f.read()

old_header = r'''<div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: "#f8fafc", fontSize: 32, fontWeight: 800, fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif", letterSpacing: 1.5, lineHeight: 0.8, flexShrink: 0 }}>
            SENTINEL <span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontWeight: 500, fontFamily: "var(--font-dashboard)", letterSpacing: 0, marginLeft: 8 }}>Analytics</span>
          </span>
        </div>'''

new_header = r'''<div
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => {
            if (typeof logout === "function") {
              logout();
            }
            navigate("/");
          }}
        >
          <span style={{ color: "#f8fafc", fontSize: 32, fontWeight: 800, fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif", letterSpacing: 1.5, lineHeight: 0.8, flexShrink: 0 }}>
            SENTINEL
          </span>
        </div>'''

content = content.replace(old_header, new_header)

with open("src/pages/Analytics.tsx", "w") as f:
    f.write(content)
