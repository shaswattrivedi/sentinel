with open("src/routes/analytics.ts", "r") as f:
    content = f.read()

content = content.replace("const payload = await loadAnalytics(filter, date);", "const payload = await loadAnalytics(filter, date, req);")
    
with open("src/routes/analytics.ts", "w") as f:
    f.write(content)
