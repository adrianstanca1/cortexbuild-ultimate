#!/usr/bin/env python3
"""
Add breadcrumbs to all CortexBuild modules - Proper JSX wrapping version
Usage: python3 scripts/add-breadcrumbs-final.py
"""

import os
import re
from pathlib import Path

MODULES_DIR = Path("/Users/adrianstanca/cortexbuild-ultimate/src/components/modules")

# Module file to identifier mapping
MODULE_MAPPING = {
    "Accounting.tsx": "accounting",
    "AIAssistant.tsx": "ai-assistant",
    "AIVision.tsx": "ai-vision",
    "Analytics.tsx": "analytics",
    "AuditLog.tsx": "audit-log",
    "BIMViewer.tsx": "bim-viewer",
    "Calendar.tsx": "calendar",
    "Certifications.tsx": "certifications",
    "ChangeOrders.tsx": "change-orders",
    "CIS.tsx": "cis",
    "CostManagement.tsx": "cost-management",
    "CRM.tsx": "crm",
    "DailyReports.tsx": "daily-reports",
    "Defects.tsx": "defects",
    "DevSandbox.tsx": "dev-sandbox",
    "Documents.tsx": "documents",
    "Drawings.tsx": "drawings",
    "EmailHistory.tsx": "email-history",
    "ExecutiveReports.tsx": "executive-reports",
    "FieldView.tsx": "field-view",
    "FinancialReports.tsx": "financial-reports",
    "Insights.tsx": "insights",
    "Inspections.tsx": "inspections",
    "Invoicing.tsx": "invoicing",
    "Lettings.tsx": "lettings",
    "Marketplace.tsx": "marketplace",
    "Materials.tsx": "materials",
    "Measuring.tsx": "measuring",
    "Meetings.tsx": "meetings",
    "MyDesktop.tsx": "my-desktop",
    "PermissionsManager.tsx": "permissions",
    "PlantEquipment.tsx": "plant",
    "PredictiveAnalytics.tsx": "predictive-analytics",
    "Prequalification.tsx": "prequalification",
    "Procurement.tsx": "procurement",
    "Projects.tsx": "projects",
    "PunchList.tsx": "punch-list",
    "RAMS.tsx": "rams",
    "ReportTemplates.tsx": "report-templates",
    "RFIs.tsx": "rfis",
    "RiskRegister.tsx": "risk-register",
    "Safety.tsx": "safety",
    "Settings.tsx": "settings",
    "Signage.tsx": "signage",
    "SiteOperations.tsx": "site-ops",
    "Specifications.tsx": "specifications",
    "Subcontractors.tsx": "subcontractors",
    "SubmittalManagement.tsx": "submittal-management",
    "Sustainability.tsx": "sustainability",
    "Teams.tsx": "teams",
    "TempWorks.tsx": "temp-works",
    "Tenders.tsx": "tenders",
    "Timesheets.tsx": "timesheets",
    "Training.tsx": "training",
    "Valuations.tsx": "valuations",
    "Variations.tsx": "variations",
    "WasteManagement.tsx": "waste-management",
}

def add_breadcrumbs_to_file(file_path: Path, module_name: str) -> bool:
    """Add breadcrumbs import and component to a module file."""
    
    try:
        content = file_path.read_text()
        
        # Skip if already has breadcrumbs
        if "ModuleBreadcrumbs" in content:
            return False
        
        # 1. Add import after last import statement
        import_line = "import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';\n"
        
        imports = list(re.finditer(r"^import.*$", content, re.MULTILINE))
        if imports:
            last_import_end = imports[-1].end()
            content = content[:last_import_end] + "\n" + import_line + content[last_import_end:]
        else:
            content = import_line + content
        
        # 2. Find the main return statement and wrap content properly
        # Pattern: return (\n    <div className=...)
        # Replace with: return (\n    <>\n      <ModuleBreadcrumbs ... />\n      <div className=...
        
        def add_breadcrumbs(match):
            whitespace = match.group(1)
            div_tag = match.group(2)
            return f"{whitespace}<ModuleBreadcrumbs currentModule=\"{module_name}\" onNavigate={{() => {{}}}} />\n{whitespace}{div_tag}"
        
        # Match: return ( followed by whitespace and <div
        pattern = r"(return\s*\(\s*\n)(\s+<div)"
        content = re.sub(pattern, add_breadcrumbs, content, count=1)
        
        # Write back
        file_path.write_text(content)
        return True
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path.name}: {e}")
        return False

def main():
    print("🔧 Adding breadcrumbs to all CortexBuild modules...")
    print("")
    
    added = 0
    skipped = 0
    not_found = 0
    errors = 0
    
    for file_name, module_name in sorted(MODULE_MAPPING.items()):
        file_path = MODULES_DIR / file_name
        
        if not file_path.exists():
            print(f"⚠️  File not found: {file_name}")
            not_found += 1
            continue
        
        if add_breadcrumbs_to_file(file_path, module_name):
            print(f"✅ Added breadcrumbs: {file_name} ({module_name})")
            added += 1
        else:
            if "ModuleBreadcrumbs" in file_path.read_text():
                print(f"⏭️  Already has breadcrumbs: {file_name}")
                skipped += 1
            else:
                errors += 1
                print(f"❌ Error: {file_name}")
    
    print("")
    print("═" * 60)
    print(f"Summary:")
    print(f"  ✅ Added: {added} modules")
    print(f"  ⏭️  Skipped: {skipped} modules")
    print(f"  ⚠️  Not found: {not_found} modules")
    print(f"  ❌ Errors: {errors} modules")
    print("═" * 60)

if __name__ == "__main__":
    main()
