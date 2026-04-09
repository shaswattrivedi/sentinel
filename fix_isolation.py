with open("backend/src/models/analyticsSnapshot.ts", "r") as f:
    snapshot_model = f.read()

if "organizationId" not in snapshot_model:
    snapshot_model = snapshot_model.replace("export interface IAnalyticsSnapshot extends Document {", "export interface IAnalyticsSnapshot extends Document {\n  organizationId: string;")
    snapshot_model = snapshot_model.replace("timestamp: { type: Date, required: true, index: true },", "organizationId: { type: String, required: true, index: true },\n    timestamp: { type: Date, required: true, index: true },")
    with open("backend/src/models/analyticsSnapshot.ts", "w") as f:
        f.write(snapshot_model)
