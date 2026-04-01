#!/usr/bin/env python3
"""
Add breadcrumbs to all CortexBuild modules - Final working version
Wraps content in fragment <>
"""

import re
from pathlib import Path

MODULES_DIR = Path("/Users/adrianstanca/cortexbuild-ultimate/src/components/modules")

MODULES = [
    "Accounting.tsx", "AIAssistant.tsx", "AIVision.tsx", "Analytics.tsx", "AuditLog.tsx",
    "BIMViewer.tsx", "Calendar.tsx", "Certifications.tsx", "ChangeOrders.tsx", "CIS.tsx",
    "CostManagement.tsx", "CRM.tsx", "DailyReports.tsx", "Defects.tsx", "DevSandbox.tsx",
    "Documents.tsx", "Drawings.tsx", "EmailHistory.tsx", "ExecutiveReports.tsx", "FieldView.tsx",
    "FinancialReports.tsx", "Insights.tsx", "Inspections.tsx", "Lettings.tsx",
    "Marketplace.tsx", "Materials.tsx", "Measuring.tsx", "Meetings.tsx", "MyDesktop.tsx",
    "PermissionsManager.tsx", "PlantEquipment.tsx", "PredictiveAnalytics.tsx", "Prequalification.tsx",
    "Procurement.tsx", "PunchList.tsx", "RAMS.tsx", "ReportTemplates.tsx", "RFIs.tsx",
    "RiskRegister.tsx", "Settings.tsx", "Signage.tsx", "SiteOperations.tsx", "Specifications.tsx",
    "Subcontractors.tsx", "SubmittalManagement.tsx", "Sustainability.tsx",
    "TempWorks.tsx", "Tenders.tsx", "Timesheets.tsx", "Training.tsx", "Valuations.tsx",
    "Variations.tsx", "WasteManagement.tsx",
]

SKIP_MODULES = ["Dashboard.tsx", "Projects.tsx", "Safety.tsx", "Invoicing.tsx", "Teams.tsx"]

def get_module_name(filename: str) -> str:
    name = filename.replace(".tsx", "")
    result = re.sub(r'([a-z])([A-Z])', r'\1-\2', name)
    return result.lower()

def add_breadcrumbs(filepath: Path, module_name: str) -> bool:
    try:
        content = filepath.read_text()
        
        if "ModuleBreadcrumbs" in content:
            return False
        
        # 1. Add import
        import_line = "\nimport { ModuleBreadcrumbs } from '../ui/Breadcrumbs';"
        
        ui_imports = list(re.finditer(r"^import.*from.*['\"]\.\./ui/.*['\"];?$", content, re.MULTILINE))
        if ui_imports:
            pos = ui_imports[-1].end()
            content = content[:pos] + import_line + content[pos:]
        else:
            imports = list(re.finditer(r"^import.*$", content, re.MULTILINE))
            if imports:
                pos = imports[-1].end()
                content = content[:pos] + import_line + content[pos:]
        
        # 2. Wrap return content in fragment and add breadcrumbs
        # Find: return (\n    <div
        # Replace with: return (\n    <>\n      <ModuleBreadcrumbs ... />\n      <div
        pattern = r"(return\s*\(\s*\n)(\s+)(<div[^>]*>)"
        
        replacement = f'\\1\\2<>\\n\\2  <ModuleBreadcrumbs currentModule="{module_name}" onNavigate={{() => {{}}}} />\\n\\2  \\3'
        
        content = re.sub(pattern, replacement, content, count=1)
        
        # 3. Find matching closing for the fragment - find last </div> before closing )
        # Add </> before the final );
        # This is tricky - find the last </div> followed by whitespace and );
        close_pattern = r"(\n\s*)(</div>\s*\n\s*\);)"
        close_replacement = f'\\1</div>\\n\\2</>;\\n'
        
        # Only apply to the main return, not nested ones
        # Find first occurrence after breadcrumbs
        parts = content.split('<ModuleBreadcrumbs')
        if len(parts) > 1:
            # Apply to second part only
            content = parts[0] + '<ModuleBreadcrumbs' + re.sub(close_pattern, close_replacement, parts[1], count=1)
        
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
            print(f"⏭️  Skip: {filename}")
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
                errors += 1
                print(f"❌ Error: {filename}")
    
    print("\n" + "="*60)
    print(f"Summary:")
    print(f"  ✅ Added: {added}")
    print(f"  ⏭️  Skipped: {skipped}")
    print(f"  ❌ Errors: {errors}")
    print("="*60)

if __name__ == "__main__":
    main()
