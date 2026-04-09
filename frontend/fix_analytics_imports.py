with open("src/pages/Analytics.tsx", "r") as f:
    content = f.read()

if "useAuth" not in content:
    content = content.replace('import { Link } from "react-router-dom";', 'import { Link, useNavigate } from "react-router-dom";\nimport { useAuth } from "@/context/AuthContext";')

if "const { logout } = useAuth();\n  const navigate = useNavigate();" not in content:
    content = content.replace('const Analytics: React.FC = () => {', 'const Analytics: React.FC = () => {\n  const { logout } = useAuth();\n  const navigate = useNavigate();')

with open("src/pages/Analytics.tsx", "w") as f:
    f.write(content)
