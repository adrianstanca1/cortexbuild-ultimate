#!/usr/bin/env python3
"""
Add breadcrumbs to all CortexBuild modules - Working version
Adds import and breadcrumbs component properly
"""

import re
from pathlib import Path

MODULES_DIR = Path("/Users/adrianstanca/cortexbuild-ultimate/src/components/modules")

MODULES = [
    "Accounting.tsx", "AIAssistant.tsx", "AIVision.tsx", "Analytics.tsx", "AuditLog.tsx",
    "BIMViewer.tsx", "Calendar.tsx", "Certifications.tsx", "ChangeOrders.tsx", "CIS.tsx",
    "CostManagement.tsx", "CRM.tsx", "DailyReports.tsx", "Defects.tsx", "DevSandbox.tsx",
    "Documents.tsx", "Drawings.tsx", "EmailHistory.tsx", "ExecutiveReports.tsx", "FieldView.tsx",
    "FinancialReports.tsx", "Insights.tsx", "Inspections.tsx", "Invoicing.tsx", "Lettings.tsx",
    "Marketplace.tsx", "Materials.tsx", "Measuring.tsx", "Meetings.tsx", "MyDesktop.tsx",
    "PermissionsManager.tsx", "PlantEquipment.tsx", "PredictiveAnalytics.tsx", "Prequalification.tsx",
    "Procurement.tsx", "PunchList.tsx", "RAMS.tsx", "ReportTemplates.tsx", "RFIs.tsx",
    "RiskRegister.tsx", "Settings.tsx", "Signage.tsx", "SiteOperations.tsx", "Specifications.tsx",
    "Subcontractors.tsx", "SubmittalManagement.tsx", "Sustainability.tsx", "Teams.tsx",
    "TempWorks.tsx", "Tenders.tsx", "Timesheets.tsx", "Training.tsx", "Valuations.tsx",
    "Variations.tsx", "WasteManagement.tsx",
]

SKIP_MODULES = ["Dashboard.tsx", "Projects.tsx", "Safety.tsx"]  # Already have breadcrumbs

def get_module_name(filename: str) -> str:
    """Convert filename to module identifier."""
    name = filename.replace(".tsx", "")
    # Convert camelCase to kebab-case
    result = re.sub(r'([a-z])([A-Z])', r'\1-\2', name)
    return result.lower()

def add_breadcrumbs(filepath: Path, module_name: str) -> bool:
    """Add breadcrumbs to a module file."""
    try:
        content = filepath.read_text()
        
        # Skip if already has breadcrumbs
        if "ModuleBreadcrumbs" in content:
            return False
        
        # 1. Add import after last import from ../ui
        import_line = "import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';\n"
        
        # Find last ui import
        ui_imports = list(re.finditer(r"^import.*from.*['\"]\.\./ui/.*['\"];?$", content, re.MULTILINE))
        if ui_imports:
            pos = ui_imports[-1].end()
            content = content[:pos] + "\n" + import_line + content[pos:]
        else:
            # Find last import line
            imports = list(re.finditer(r"^import.*$", content, re.MULTILINE))
            if imports:
                pos = imports[-1].end()
                content = content[:pos] + "\n" + import_line + content[pos:]
            else:
                content = import_line + content
        
        # 2. Add breadcrumbs component - find first return statement with div
        # Pattern: return (\n    <div className=...)
        pattern = r"(return\s*\(\s*\n\s*)(<div[^>]*>)"
        
        breadcrumbs = f'\\1<ModuleBreadcrumbs currentModule="{module_name}" onNavigate={{() => {{}}}} />\n\\1\\2'
        
        content = re.sub(pattern, breadcrumbs, content, count=1)
        
        filepath.write_text(content)
        return True
        
    except Exception as e:
        print(f"  ❌ {filepath.name}: {e}")
        return False

def main():
    print("🔧 Adding breadcrumbs to all CortexBuild modules...\n")
    
    added = 0
    skipped = 0
    errors = 0
    
    for filename in MODULES:
        if filename in SKIP_MODULES:
            print(f"⏭️  Skip (has breadcrumbs): {filename}")
            skipped += 1
            continue
            
        filepath = MODULES_DIR / filename
        if not filepath.exists():
            print(f"⚠️  Not found: {filename}")
            errors += 1
            continue
        
        module_name = get_module_name(filename)
        
        if add_breadcrumbs(filepath, module_name):
            print(f"✅ {filename} ({module_name})")
            added += 1
        else:
            if "ModuleBreadcrumbs" in filepath.read_text():
                print(f"⏭️  Already has: {filename}")
                skipped += 1
            else:
                print(f"❌ Error: {filename}")
                errors += 1
    
    print("\n" + "="*60)
    print(f"Summary:")
    print(f"  ✅ Added: {added}")
    print(f"  ⏭️  Skipped: {skipped}")
    print(f"  ❌ Errors: {errors}")
    print("="*60)

if __name__ == "__main__":
    main()
