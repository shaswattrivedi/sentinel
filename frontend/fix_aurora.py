import re

with open("src/components/Aurora.tsx", "r") as f:
    content = f.read()

content = content.replace("export default function Aurora(props) {", "export default function Aurora(props: any) {")
content = content.replace("const ctnDom = useRef(null);", "const ctnDom = useRef<HTMLDivElement | null>(null);")
content = content.replace("let program;", "let program: any;")
content = content.replace("const colorStopsArray = colorStops.map(hex => {", "const colorStopsArray = colorStops.map((hex: string) => {")
content = content.replace("const update = t => {", "const update = (t: number) => {")
content = content.replace("program.uniforms.uColorStops.value = stops.map(hex => {", "program.uniforms.uColorStops.value = stops.map((hex: string) => {")

with open("src/components/Aurora.tsx", "w") as f:
    f.write(content)
