import os

routes_dir = "backend/src/routes"

def inject_org_filter(file_path):
    with open(file_path, "r") as f:
        content = f.read()
    
    # We will just see if we can do something like .find({ organizationId: req.user?.organizationId })
    if "req.user?.organizationId" not in content and "AnalyticsSnapshot.find" in content:
        content = content.replace("AnalyticsSnapshot.find({", "AnalyticsSnapshot.find({ organizationId: req.user?.organizationId, ")
        with open(file_path, "w") as f:
            f.write(content)

inject_org_filter(os.path.join(routes_dir, "analytics.ts"))

