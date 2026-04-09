import re

# Update AnalyticsSnapshot model
with open("backend/src/models/analyticsSnapshot.ts", "r") as f:
    snapshot_model = f.read()

if "organizationId" not in snapshot_model:
    snapshot_model = snapshot_model.replace(
        "export interface IAnalyticsSnapshot extends Document {",
        "export interface IAnalyticsSnapshot extends Document {\n  organizationId: string;"
    ).replace(
        "const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(",
        "const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(\n  {\n    organizationId: { type: String, required: true, index: true },"
    ).replace(
        "{\n    timestamp: { type: Date, required: true, index: true },",
        "timestamp: { type: Date, required: true },\n"
    ).replace(
        "const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(\n  {\n    organizationId: { type: String, required: true, index: true },\n  {",
        "const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(\n  {\n    organizationId: { type: String, required: true, index: true },"
    )
    with open("backend/src/models/analyticsSnapshot.ts", "w") as f:
        f.write(snapshot_model)

