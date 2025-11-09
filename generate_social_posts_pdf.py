from pathlib import Path
from fpdf import FPDF

# Contenido de las publicaciones: (título, texto)
POSTS = [
    (
        "Martes - 8:00 a 9:00 AM (Twitter/X)",
        "ES:\nLanzamos TasaReal, una calculadora gratuita que convierte TNA a TEA para créditos en LATAM.\n- Calcula la TEA real en segundos\n- Compara hasta 3 ofertas\n- Genera tabla de amortización\n\nPruébala: https://tasareal-app.vercel.app\nCódigo: https://github.com/Toni872/tasareal\n#Finanzas #FinTech #LATAM #TEA #TNA\n\nEN:\nWe launched TasaReal, a free calculator that converts nominal to effective interest rates for LATAM loans.\n- Get the real EAR/TEA in seconds\n- Compare up to 3 offers\n- Generate amortization schedules\n\nTry it: https://tasareal-app.vercel.app\nCode: https://github.com/Toni872/tasareal\n#Finance #FinTech #LATAM #EAR #APR"
    ),
    (
        "Martes - 12:00 a 1:00 PM (LinkedIn)",
        "ES:\nPresento TasaReal: una calculadora TEA/TNA pensada para créditos en Latinoamérica.\n[OK] Convierte tasas nominales en efectivas\n[OK] Compara hasta tres propuestas bancarias\n[OK] Genera tabla de amortización y la exporta a CSV\n[OK] 100 % gratis y sin registro\n\nDemo: https://tasareal-app.vercel.app\nRepositorio: https://github.com/Toni872/tasareal\n\nBusco feedback de profesionales en banca, fintech o asesoría financiera para seguir mejorándola.\n\nEN:\nIntroducing TasaReal: a TEA/TNA calculator designed for LATAM loans.\n[OK] Convert nominal into effective rates\n[OK] Compare up to three offers side by side\n[OK] Generate and export amortization schedules (CSV)\n[OK] 100% free, no sign-up\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nLooking for feedback from banking, fintech, or financial advisory professionals to keep improving it."
    ),
    (
        "Martes - 5:00 a 6:00 PM (Reddit / Indie Hackers)",
        "ES:\n[Launch] TasaReal - Calculadora TEA para créditos en LATAM\n\nAcabo de publicar TasaReal, una herramienta gratuita que convierte la Tasa Nominal Anual (TNA) en Tasa Efectiva Anual (TEA), compara hasta tres ofertas (sistemas francés/alemán) y genera la tabla de amortización con opción a CSV.\n\nDemo: https://tasareal-app.vercel.app\nCódigo: https://github.com/Toni872/tasareal\n\nLa hice porque en LATAM los bancos anuncian TNA pero pocos incluyen el costo real con capitalización. ¿Qué función te gustaría ver después?\n\nEN:\n[Launch] TasaReal - TEA/EAR calculator for LATAM loans\n\nI just released TasaReal, a free tool that converts nominal APR to effective APR, compares up to three offers (French/German amortization), and generates downloadable CSV schedules.\n\nDemo: https://tasareal-app.vercel.app\nCode: https://github.com/Toni872/tasareal\n\nBuilt it because most LATAM banks show only nominal APR. Which feature should I add next?"
    ),
    (
        "Miércoles - 8:00 a 9:00 AM (Twitter/X)",
        "ES:\nComparar créditos solo por TNA es un error: la TEA real puede ser 20 % más alta.\nCon TasaReal puedes calcularla en segundos, comparar bancos y descargar la tabla completa.\n\nhttps://tasareal-app.vercel.app\n#EducacionFinanciera #Creditos #TEA #TNA\n\nEN:\nComparing loans only by nominal APR is risky: the effective rate can be 20% higher.\nTasaReal calculates it in seconds, compares lenders, and exports the full schedule.\n\nhttps://tasareal-app.vercel.app\n#FinancialLiteracy #Loans #EAR #APR"
    ),
    (
        "Miércoles - 12:00 a 1:00 PM (LinkedIn)",
        "ES:\nLATAM necesita más educación financiera al pedir créditos. TasaReal ayuda a:\n- Entender el costo real (TEA) frente a la TNA\n- Comparar hasta tres propuestas bancarias\n- Ver la amortización completa en sistemas francés o alemán\n- Exportar la información en CSV\n\nDemo: https://tasareal-app.vercel.app\nRepositorio: https://github.com/Toni872/tasareal\n\n¿Conoces equipos de fintech o banca que quieran integrar esta herramienta o aportar datos reales?\n\nEN:\nLATAM needs more financial education when applying for loans. TasaReal helps you:\n- Understand the real cost (EAR/TEA) vs nominal APR\n- Compare up to three offers (French & German systems)\n- View the full amortization table\n- Export everything to CSV\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nKnow any fintech or banking teams interested in integrating or providing real rate feeds?"
    ),
    (
        "Miércoles - 5:00 a 6:00 PM (Reddit / Indie Hackers)",
        "ES:\nShow IH: TasaReal - herramienta para elegir el crédito correcto\n\nTasaReal convierte TNA a TEA, compara ofertas y genera tablas de amortización. Estoy buscando:\n- Feedback sobre qué datos adicionales incluir (CFT, seguros, comisiones)\n- Ideas de monetización (ads, afiliados, leads)\n- Posibles alianzas con fintech/bancos\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nToda sugerencia o bug report será bienvenida.\n\nEN:\nShow IH: TasaReal - tool to pick the right loan\n\nTasaReal converts nominal APR to effective APR, compares offers, and generates amortization tables. I am looking for:\n- Feedback on additional data (total cost, insurance, fees)\n- Monetization ideas (ads, affiliates, leads)\n- Partnerships with fintechs/banks\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nAny suggestions or bug reports are appreciated."
    ),
    (
        "Jueves - 8:00 a 9:00 AM (Twitter/X)",
        "ES:\nAntes de firmar un crédito, revisa la TEA real.\nTasaReal: https://tasareal-app.vercel.app\n- Convierte TNA a TEA\n- Compara bancos\n- Guarda la tabla en CSV\nGratis y sin registro.\n\nEN:\nBefore signing a loan, check the real EAR.\nTasaReal: https://tasareal-app.vercel.app\n- Converts nominal APR to effective APR\n- Compares lenders\n- Exports schedules to CSV\nFree and no sign-up."
    ),
    (
        "Jueves - 12:00 a 1:00 PM (LinkedIn)",
        "ES:\nTasaReal ya está ayudando a usuarios a entender el costo real de sus préstamos:\n- Convierte TNA a TEA con un clic\n- Trabaja para México, Argentina, Colombia, Perú y Chile\n- Genera tabla de amortización en sistemas francés y alemán\n- Funciona 100 % en el navegador\n\nPrueba gratuita: https://tasareal-app.vercel.app\nRepositorio: https://github.com/Toni872/tasareal\n\n¿Te gustaría colaborar o integrarlo en procesos de originación de crédito?\n\nEN:\nTasaReal is helping borrowers grasp their true loan cost:\n- Converts nominal APR to effective APR instantly\n- Covers Mexico, Argentina, Colombia, Peru, Chile\n- Supports French & German amortization systems\n- Runs 100% in the browser\n\nFree demo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nInterested in collaborating or integrating it into credit origination workflows?"
    ),
    (
        "Jueves - 5:00 a 6:00 PM (Reddit / Indie Hackers)",
        "ES:\n[Feedback] TasaReal - buscando testers y sugerencias\n\nLa calculadora TEA/TNA ya funciona y permite comparar hasta tres créditos, pero quiero mejorarla. Ayúdame respondiendo:\n- ¿Qué métricas te gustaría ver (CFT, cargos, gráficos)?\n- ¿Qué países o bancos deberían tener presets?\n- ¿Qué modelo de ingresos te parece más viable?\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nGracias de antemano por cualquier comentario o test que puedas hacer.\n\nEN:\n[Feedback] TasaReal - looking for testers and suggestions\n\nThe TEA/EAR calculator is live and compares up to three loans, but I would love to refine it. Help me by sharing:\n- Which metrics would you add (total cost, fees, charts)?\n- Which countries or banks require presets?\n- Which revenue model seems more realistic?\n\nDemo: https://tasareal-app.vercel.app\nRepo: https://github.com/Toni872/tasareal\n\nThanks in advance for any review or test you can run."
    ),
]

pdf = FPDF(format="Letter")
pdf.set_auto_page_break(auto=True, margin=15)

# Fuentes (utilizamos Segoe UI Emoji para soportar íconos)
FONT_PATH = r"C:\\Windows\\Fonts\\seguiemj.ttf"
pdf.add_font("SegoeEmoji", "", FONT_PATH, uni=True)

for title, body in POSTS:
    pdf.add_page()
    pdf.set_font("Arial", size=16)
    pdf.multi_cell(0, 10, title)
    pdf.ln(2)
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 6, body)

output_file = Path("Social_Posts_TasaReal.pdf")
pdf.output(str(output_file))

print(f"PDF generado: {output_file.resolve()}")
