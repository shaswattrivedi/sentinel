with open("src/services/snapshotService.ts", "r") as f:
    content = f.read()

# For a background process, we will default it to the common org or ignore it if we are mocking tenants.
content = content.replace("timestamp: new Date(),", "organizationId: \"org_1\", // Default org for live snapshots\n      timestamp: new Date(),")

with open("src/services/snapshotService.ts", "w") as f:
    f.write(content)
