with open("src/scripts/seedAnalytics.ts", "r") as f:
    content = f.read()

if "organizationId" not in content:
    content = content.replace("timestamp: { type: Date, required: true, index: true },", "organizationId: { type: String, required: true, index: true },\n    timestamp: { type: Date, required: true, index: true },")
    content = content.replace("const snapshots: any[] = [];", "const user1Org = \"ORG_A\";\n    const user2Org = \"ORG_B\";\n    const snapshots: any[] = [];")
    content = content.replace("snapshots.push({", "snapshots.push({\n      organizationId: Math.random() > 0.5 ? user1Org : user2Org,")
    
    with open("src/scripts/seedAnalytics.ts", "w") as f:
        f.write(content)
