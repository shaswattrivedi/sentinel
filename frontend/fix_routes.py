with open("src/main.tsx", "r") as f:
    main_content = f.read()

# Add the import if not present
if "import Analytics" not in main_content:
    main_content = main_content.replace('import Dashboard from "@/pages/Dashboard";', 'import Dashboard from "@/pages/Dashboard";\nimport Analytics from "@/pages/Analytics";')

# Add the route if not present
if "path=\"/analytics\"" not in main_content:
    main_content = main_content.replace('<Route path="/dashboard" element={<Dashboard />} />', '<Route path="/dashboard" element={<Dashboard />} />\n                  <Route path="/analytics" element={<Analytics />} />')

with open("src/main.tsx", "w") as f:
    f.write(main_content)
