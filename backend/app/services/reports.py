import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from typing import Dict, Any, List

def generate_pdf_report(
    output_path: str,
    contract_name: str,
    contract_type: str,
    clauses: List[Dict[str, Any]],
    risk_assessments: List[Dict[str, Any]],
    compliance_reports: List[Dict[str, Any]],
    missing_clauses: List[Dict[str, Any]],
    summary: Dict[str, Any]
) -> None:
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom colors
    navy = colors.HexColor("#0f172a")
    teal = colors.HexColor("#0d9488")
    charcoal = colors.HexColor("#334155")
    red = colors.HexColor("#be123c")
    yellow = colors.HexColor("#b45309")
    green = colors.HexColor("#15803d")
    
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=navy,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        textColor=teal,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        "SubSectionHeading",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=navy,
        spaceBefore=8,
        spaceAfter=5,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        textColor=charcoal,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        "BulletTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=charcoal,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=5
    )
    
    # Title
    story.append(Paragraph("LexGuard AI - Contract Audit Report", title_style))
    story.append(Paragraph(f"<b>Contract:</b> {contract_name}", body_style))
    story.append(Paragraph(f"<b>Type:</b> {contract_type}", body_style))
    story.append(Paragraph(f"<b>Generated on:</b> 2026-06-19", body_style))
    story.append(Spacer(1, 15))
    
    # Executive Summary Section
    story.append(Paragraph("Executive Summary", h1_style))
    story.append(Paragraph(summary.get("executive_summary", "No executive summary available."), body_style))
    story.append(Spacer(1, 10))
    
    # Risk Assessment Heatmap summary table
    story.append(Paragraph("Risk Assessment Matrix", h1_style))
    risk_data = [["Risk Category", "Score", "Severity"]]
    for r in risk_assessments:
        risk_data.append([
            r["risk_type"],
            str(r["risk_score"]),
            r["severity"]
        ])
        
    t_risk = Table(risk_data, colWidths=[200, 100, 150])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 15))
    
    # Obligations Section
    story.append(Paragraph("Key Obligations & Commitments", h1_style))
    for ob in summary.get("obligations", []):
        story.append(Paragraph(f"• {ob}", bullet_style))
    story.append(Spacer(1, 10))
    
    # Renewal & Financial Section
    if summary.get("renewal_conditions"):
        story.append(Paragraph("Renewal Conditions", h2_style))
        story.append(Paragraph(summary["renewal_conditions"], body_style))
    if summary.get("financial_commitments"):
        story.append(Paragraph("Financial Commitments", h2_style))
        story.append(Paragraph(summary["financial_commitments"], body_style))
    story.append(Spacer(1, 15))

    story.append(PageBreak())  # Next page for detailed clause audits

    # Clauses Review Section
    story.append(Paragraph("Detailed Clause Audits & Recommendations", h1_style))
    for c in clauses:
        story.append(Paragraph(f"Clause: {c['clause_type']}", h2_style))
        score = c['risk_score']
        color_hex = "#15803d"  # green
        if score >= 70:
            color_hex = "#be123c"  # red
        elif score >= 40:
            color_hex = "#b45309"  # yellow
            
        story.append(Paragraph(f"<b>Risk Score:</b> <font color='{color_hex}'><b>{score}/100</b></font>", body_style))
        story.append(Paragraph(f"<b>Extracted Text:</b> <i>\"{c['clause_text']}\"</i>", body_style))
        story.append(Paragraph(f"<b>Recommendation:</b> {c.get('recommendation', 'N/A')}", body_style))
        story.append(Spacer(1, 10))
        
    story.append(PageBreak())
    
    # Compliance Audit Section
    story.append(Paragraph("Regulatory Compliance Audit", h1_style))
    comp_data = [["Framework", "Compliance Score", "Status"]]
    for comp in compliance_reports:
        score = comp["score"]
        status_txt = "Compliant"
        if score < 40:
            status_txt = "Non-Compliant"
        elif score < 80:
            status_txt = "Partially Compliant"
            
        comp_data.append([
            comp["framework"],
            f"{score}%",
            status_txt
        ])
        
    t_comp = Table(comp_data, colWidths=[200, 100, 150])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 15))
    
    # Missing Clauses Section
    story.append(Paragraph("Missing Clauses Audit", h1_style))
    if not missing_clauses:
        story.append(Paragraph("No critical clauses identified as missing from this document. It conforms to general industry benchmarks.", body_style))
    else:
        for mc in missing_clauses:
            story.append(Paragraph(f"Missing Clause: <b>{mc['missing_clause']}</b>", h2_style))
            story.append(Paragraph(f"<b>Why It Matters:</b> {mc['why_it_matters']}", body_style))
            story.append(Paragraph(f"<b>Suggested Clause Wording:</b>", body_style))
            story.append(Paragraph(f"<code>{mc['suggested_clause']}</code>", body_style))
            story.append(Spacer(1, 8))

    doc.build(story)
