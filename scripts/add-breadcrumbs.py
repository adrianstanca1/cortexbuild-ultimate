#!/usr/bin/env python3
"""
Add breadcrumbs to all CortexBuild modules
Usage: python3 add-breadcrumbs.py
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
        
        # Add import after other ui imports or at end of imports
        import_line = "import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';\n"
        
        # Find best place to add import
        if "../ui/Breadcrumbs" not in content:
            # Look for other ui imports
            ui_import_match = re.search(r"import.*from.*['\"]\.\./ui/.*['\"];?", content)
            if ui_import_match:
                # Add after existing ui import
                insert_pos = ui_import_match.end()
                content = content[:insert_pos] + "\n" + import_line + content[insert_pos:]
            else:
                # Add after last import
                imports = list(re.finditer(r"^import.*$", content, re.MULTILINE))
                if imports:
                    last_import_end = imports[-1].end()
                    content = content[:last_import_end] + "\n" + import_line + content[last_import_end:]
                else:
                    # Add at beginning
                    content = import_line + content
        
        # Add breadcrumbs component after first return statement in main function
        # Look for pattern: return (\n    <div
        return_pattern = r"(return\s*\(\s*\n\s*)(<div)"
        breadcrumbs_component = f"{{/* Breadcrumbs */}}\n      <ModuleBreadcrumbs currentModule=\"{module_name}\" onNavigate={{() => {{}}}} />\n      "
        
        content = re.sub(return_pattern, r"\1" + breadcrumbs_component + r"\2", content, count=1)
        
        # Write back
        file_path.write_text(content)
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🔧 Adding breadcrumbs to all CortexBuild modules...")
    print("")
    
    added = 0
    skipped = 0
    errors = 0
    not_found = 0
    
    for file_name, module_name in MODULE_MAPPING.items():
        file_path = MODULES_DIR / file_name
        
        if not file_path.exists():
            print(f"⚠️  File not found: {file_name}")
            not_found += 1
            continue
        
        if add_breadcrumbs_to_file(file_path, module_name):
            print(f"✅ Added breadcrumbs: {file_name} ({module_name})")
            added += 1
        else:
            print(f"⏭️  Already has breadcrumbs: {file_name}")
            skipped += 1
    
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
