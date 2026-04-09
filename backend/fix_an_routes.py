with open("src/routes/analytics.ts", "r") as f:
    content = f.read()

content = content.replace(
    "const loadAnalytics = async (filter: FilterType, date: Date) => {",
    "const loadAnalytics = async (filter: FilterType, date: Date, req: any) => {"
)

content = content.replace(
    "const result = await loadAnalytics(filter, date);",
    "const result = await loadAnalytics(filter, date, req);"
)

with open("src/routes/analytics.ts", "w") as f:
    f.write(content)

