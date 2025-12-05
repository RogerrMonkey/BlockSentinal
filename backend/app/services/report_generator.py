"""
Report generation service for different export formats
Supports: JSON, PDF, CSV, HTML
"""

import json
import csv
from io import StringIO, BytesIO
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import logging

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from jinja2 import Template

from app.models.scan import Scan
from app.models.finding import Finding

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate security reports in multiple formats"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom PDF styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Heading style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        # Critical finding style
        self.styles.add(ParagraphStyle(
            name='Critical',
            parent=self.styles['Normal'],
            textColor=colors.red,
            fontSize=12,
            spaceAfter=6
        ))
    
    def generate_json_report(self, scan: Scan, findings: List[Finding]) -> str:
        """Generate JSON format report"""
        report_data = self._build_report_data(scan, findings)
        return json.dumps(report_data, indent=2, default=str)
    
    def generate_csv_report(self, scan: Scan, findings: List[Finding]) -> str:
        """Generate CSV format report"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Finding ID', 'Vulnerability Type', 'Severity', 'Confidence',
            'Line Number', 'Description', 'Remediation', 'Source'
        ])
        
        # Write findings
        for finding in findings:
            writer.writerow([
                str(finding.id),
                finding.vulnerability_type,
                finding.severity,
                f"{finding.confidence:.2f}" if isinstance(finding.confidence, float) else finding.confidence,
                finding.line_number or 'N/A',
                finding.description,
                finding.remediation,
                finding.source
            ])
        
        return output.getvalue()
    
    def generate_html_report(self, scan: Scan, findings: List[Finding]) -> str:
        """Generate HTML format report"""
        report_data = self._build_report_data(scan, findings)
        
        template_str = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlockSentinel Security Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1e40af;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .critical { background: #fee; border-left: 4px solid #dc2626; }
        .high { background: #fff4e6; border-left: 4px solid #ea580c; }
        .medium { background: #fef9e7; border-left: 4px solid #eab308; }
        .low { background: #e8f4fd; border-left: 4px solid #3b82f6; }
        .summary-card h3 {
            margin: 0;
            font-size: 2em;
            color: #333;
        }
        .summary-card p {
            margin: 5px 0 0 0;
            color: #666;
        }
        .finding {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            background: #fafafa;
        }
        .finding-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .severity-badge {
            padding: 5px 15px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
            font-size: 0.85em;
        }
        .severity-critical { background: #dc2626; }
        .severity-high { background: #ea580c; }
        .severity-medium { background: #eab308; }
        .severity-low { background: #3b82f6; }
        .code-snippet {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin: 10px 0;
        }
        .meta {
            color: #666;
            font-size: 0.9em;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ BlockSentinel Security Report</h1>
        
        <div class="meta">
            <strong>Scan ID:</strong> {{ report.scan_id }}<br>
            {% if report.contract_address %}
            <strong>Contract Address:</strong> <code>{{ report.contract_address }}</code><br>
            {% endif %}
            <strong>Scan Date:</strong> {{ report.scan_date }}<br>
            <strong>Status:</strong> {{ report.status }}
        </div>
        
        <h2>📊 Summary</h2>
        <div class="summary">
            <div class="summary-card critical">
                <h3>{{ report.summary.critical }}</h3>
                <p>Critical</p>
            </div>
            <div class="summary-card high">
                <h3>{{ report.summary.high }}</h3>
                <p>High</p>
            </div>
            <div class="summary-card medium">
                <h3>{{ report.summary.medium }}</h3>
                <p>Medium</p>
            </div>
            <div class="summary-card low">
                <h3>{{ report.summary.low }}</h3>
                <p>Low</p>
            </div>
        </div>
        
        <h2>🔍 Findings ({{ report.summary.total_findings }} total)</h2>
        
        {% if report.findings %}
            {% for finding in report.findings %}
            <div class="finding">
                <div class="finding-header">
                    <h3 style="margin: 0;">{{ finding.type }}</h3>
                    <span class="severity-badge severity-{{ finding.severity }}">{{ finding.severity }}</span>
                </div>
                
                <p><strong>Description:</strong> {{ finding.description }}</p>
                
                {% if finding.line_number %}
                <p><strong>Line:</strong> {{ finding.line_number }} | <strong>Confidence:</strong> {{ "%.0f"|format(finding.confidence * 100) }}%</p>
                {% endif %}
                
                {% if finding.code_snippet %}
                <p><strong>Code Snippet:</strong></p>
                <pre class="code-snippet">{{ finding.code_snippet }}</pre>
                {% endif %}
                
                {% if finding.remediation %}
                <p><strong>💡 Remediation:</strong> {{ finding.remediation }}</p>
                {% endif %}
                
                <p style="color: #666; font-size: 0.85em; margin-top: 10px;">
                    <strong>Source:</strong> {{ finding.source }}
                </p>
            </div>
            {% endfor %}
        {% else %}
            <p style="text-align: center; padding: 40px; color: #666;">
                ✅ No vulnerabilities detected. This contract passed all security checks.
            </p>
        {% endif %}
        
        <div class="footer">
            <p>Generated by BlockSentinel - Smart Contract Security Scanner</p>
            <p>{{ report.completed_at or report.scan_date }}</p>
        </div>
    </div>
</body>
</html>
        """
        
        template = Template(template_str)
        return template.render(report=report_data)
    
    def generate_pdf_report(self, scan: Scan, findings: List[Finding]) -> bytes:
        """Generate PDF format report"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        story = []
        
        # Title
        story.append(Paragraph("BlockSentinel Security Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        
        # Metadata
        meta_data = [
            ['Scan ID:', str(scan.id)],
            ['Contract Address:', scan.contract_address or 'N/A'],
            ['Scan Date:', scan.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')],
            ['Completed:', scan.completed_at.strftime('%Y-%m-%d %H:%M:%S UTC') if scan.completed_at else 'In Progress'],
            ['Status:', scan.status],
        ]
        
        meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Summary
        story.append(Paragraph("Summary", self.styles['CustomHeading']))
        summary = self._calculate_summary(findings)
        
        summary_data = [
            ['Severity', 'Count'],
            ['Critical', str(summary['critical'])],
            ['High', str(summary['high'])],
            ['Medium', str(summary['medium'])],
            ['Low', str(summary['low'])],
            ['Total', str(summary['total_findings'])],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e5e7eb')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Findings
        if findings:
            story.append(Paragraph(f"Findings ({len(findings)} total)", self.styles['CustomHeading']))
            story.append(Spacer(1, 0.2 * inch))
            
            for idx, finding in enumerate(findings, 1):
                # Finding header
                severity_color = self._get_severity_color(finding.severity)
                story.append(Paragraph(
                    f"<b>{idx}. {finding.vulnerability_type}</b> - "
                    f"<font color='{severity_color}'>{finding.severity.upper()}</font>",
                    self.styles['Normal']
                ))
                
                # Finding details
                story.append(Spacer(1, 0.1 * inch))
                story.append(Paragraph(f"<b>Description:</b> {finding.description}", self.styles['Normal']))
                
                if finding.line_number:
                    # Handle confidence as either float or string
                    confidence_str = f"{float(finding.confidence):.0%}" if isinstance(finding.confidence, (int, float)) else finding.confidence
                    story.append(Paragraph(
                        f"<b>Line:</b> {finding.line_number} | "
                        f"<b>Confidence:</b> {confidence_str}",
                        self.styles['Normal']
                    ))
                
                if finding.remediation:
                    story.append(Paragraph(f"<b>Remediation:</b> {finding.remediation}", self.styles['Normal']))
                
                if finding.code_snippet:
                    story.append(Spacer(1, 0.05 * inch))
                    story.append(Paragraph("<b>Code Snippet:</b>", self.styles['Normal']))
                    # Add code snippet in a box
                    code_para = Paragraph(
                        f"<font name='Courier' size='8'>{finding.code_snippet.replace('<', '&lt;').replace('>', '&gt;')}</font>",
                        self.styles['Normal']
                    )
                    story.append(code_para)
                
                story.append(Spacer(1, 0.2 * inch))
                
                # Page break after every 3 findings to avoid cramming
                if idx % 3 == 0 and idx < len(findings):
                    story.append(PageBreak())
        else:
            story.append(Paragraph(
                "✅ No vulnerabilities detected. This contract passed all security checks.",
                self.styles['Normal']
            ))
        
        # Footer
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(
            f"<i>Generated by BlockSentinel on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</i>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.read()
    
    def _build_report_data(self, scan: Scan, findings: List[Finding]) -> Dict:
        """Build standardized report data structure"""
        summary = self._calculate_summary(findings)
        
        return {
            "scan_id": str(scan.id),
            "contract_address": scan.contract_address,
            "scan_date": scan.created_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "status": scan.status,
            "summary": summary,
            "findings": [
                {
                    "id": str(f.id),
                    "type": f.vulnerability_type,
                    "severity": f.severity,
                    "confidence": f.confidence,
                    "line_number": f.line_number,
                    "description": f.description,
                    "remediation": f.remediation,
                    "code_snippet": f.code_snippet,
                    "source": f.source
                }
                for f in findings
            ]
        }
    
    def _calculate_summary(self, findings: List[Finding]) -> Dict:
        """Calculate summary statistics"""
        summary = {
            "total_findings": len(findings),
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        for finding in findings:
            severity = finding.severity.lower() if finding.severity else "low"
            if severity in summary:
                summary[severity] += 1
        
        return summary
    
    def _get_severity_color(self, severity: str) -> str:
        """Get color hex code for severity"""
        color_map = {
            'critical': '#dc2626',
            'high': '#ea580c',
            'medium': '#eab308',
            'low': '#3b82f6'
        }
        return color_map.get(severity.lower(), '#666666')


# Singleton instance
report_generator = ReportGenerator()
