# DaisyUI Integration Guide - CortexBuild Ultimate

## Overview

This guide explains how to migrate existing components to use the new DaisyUI component library integrated into CortexBuild Ultimate.

## What's Been Added

### 1. Custom Themes

Two custom CortexBuild themes have been added to `tailwind.config.js`:

- **`cortexbuild`** - Dark theme (default) with amber primary, blue secondary, emerald accent
- **`cortex-light`** - Light theme variant

Plus 8 additional DaisyUI built-in themes:
- `light`, `dark`, `corporate`, `synthwave`, `cyberpunk`, `dracula`, `nord`, `sunset`

### 2. Reusable Components

Located in `src/components/daisyui/`:

| Component | Description | Usage |
|-----------|-------------|-------|
| `Button` | Enhanced button with variants | `<Button variant="primary" size="lg">Click</Button>` |
| `Card` | Card container with optional image/title/actions | `<Card title="Title" shadow="xl">Content</Card>` |
| `Table` | Data table with sorting/striping | `<Table data={rows} columns={cols} striped />` |
| `Badge` | Status badges | `<Badge variant="success">Active</Badge>` |
| `Modal` | Dialog modal | `<Modal id="myModal" title="Title">Content</Modal>` |
| `Input` | Form input with label/error | `<Input label="Email" error={error} />` |
| `Select` | Dropdown select | `<Select options={[{value, label}]} />` |
| `Checkbox` | Checkbox with label | `<Checkbox label="Remember me" />` |
| `Toggle` | Toggle switch | `<Toggle label="Enable notifications" />` |
| `Alert` | Alert banners | `<Alert variant="success">Success!</Alert>` |
| `Tabs` | Tab navigation | `<Tabs tabs={[{id, label, active}]} />` |
| `Breadcrumbs` | Navigation breadcrumbs | `<Breadcrumbs items={[{label, href}]} />` |
| `Stats` | Statistics cards | `<Stats stats={[{title, value, desc}]} />` |
| `Skeleton` | Loading skeleton | `<Skeleton variant="text" width={200} />` |
| `Avatar` | User avatar | `<Avatar src="url" fallback="JD" />` |
| `Dropdown` | Dropdown menu | `<Dropdown trigger={<Button>} items={[]} />` |
| `ThemeSwitcher` | Theme selector | `<ThemeSwitcher />` |

### 3. Theme Switcher

Added to the Header component (desktop only). Click the theme icon (🏗️) to switch between themes.

## Migration Examples

### Button Migration

**Before:**
```jsx
<button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors">
  Save Project
</button>
```

**After:**
```jsx
import { Button } from '../daisyui';

<Button variant="primary" onClick={handleSave}>
  Save Project
</Button>
```

### Card Migration

**Before:**
```jsx
<div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 hover:shadow-2xl transition-shadow">
  <h3 className="text-lg font-semibold text-slate-100 mb-2">Project Name</h3>
  <p className="text-slate-400">Description here</p>
  <div className="mt-4 flex gap-2">
    <button className="px-3 py-1.5 bg-amber-500 rounded-lg text-sm">Edit</button>
    <button className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm">Delete</button>
  </div>
</div>
```

**After:**
```jsx
import { Card, Button } from '../daisyui';

<Card 
  title="Project Name" 
  subtitle="Description here"
  actions={
    <>
      <Button variant="primary" size="sm">Edit</Button>
      <Button variant="ghost" size="sm">Delete</Button>
    </>
  }
  shadow="xl"
>
  {/* Additional content */}
</Card>
```

### Table Migration

**Before:**
```jsx
<table className="min-w-full divide-y divide-slate-700">
  <thead className="bg-slate-800">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Name</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-700">
    {data.map((row) => (
      <tr key={row.id} className="hover:bg-slate-800/50">
        <td className="px-6 py-4 text-slate-200">{row.name}</td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
            {row.status}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```jsx
import { Table, Badge } from '../daisyui';

<Table
  data={data}
  columns={[
    { key: 'name', title: 'Name' },
    { 
      key: 'status', 
      title: 'Status',
      render: (value) => <Badge variant="success">{value}</Badge>
    }
  ]}
  striped
  hover
  onRowClick={(row) => handleRowClick(row)}
/>
```

### Form Input Migration

**Before:**
```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
  <input
    type="email"
    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-200"
    placeholder="Enter email"
  />
  {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
</div>
```

**After:**
```jsx
import { Input } from '../daisyui';

<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  error={error}
  helperText={!error ? "We'll never share your email" : undefined}
/>
```

### Modal Migration

**Before:**
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
      <h3 className="text-xl font-bold text-slate-100 mb-4">Confirm Action</h3>
      <p className="text-slate-400 mb-6">Are you sure?</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-lg">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-amber-500 rounded-lg">Confirm</button>
      </div>
    </div>
  </div>
)}
```

**After:**
```jsx
import { Modal, Button } from '../daisyui';

<Modal
  id="confirmModal"
  title="Confirm Action"
  actions={
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm}>Confirm</Button>
    </>
  }
>
  <p className="text-base-content/70">Are you sure?</p>
</Modal>

// Open with: document.getElementById('confirmModal').showModal()
```

## Component Props Reference

### Button
```tsx
variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline'
size?: 'xs' | 'sm' | 'md' | 'lg'
loading?: boolean
active?: boolean
disabled?: boolean
fullWidth?: boolean
square?: boolean
circle?: boolean
```

### Card
```tsx
title?: React.ReactNode
subtitle?: React.ReactNode
actions?: React.ReactNode
image?: string
compact?: boolean
bordered?: boolean
shadow?: 'sm' | 'md' | 'lg' | 'xl'
onClick?: () => void
```

### Table
```tsx
data: any[]
columns: Array<{ key, title, render?, className? }>
striped?: boolean
hover?: boolean
pinRows?: boolean
pinCols?: boolean
size?: 'sm' | 'md' | 'lg'
onRowClick?: (row, index) => void
emptyMessage?: string
```

### Badge
```tsx
variant?: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
size?: 'xs' | 'sm' | 'md' | 'lg'
outline?: boolean
ghost?: boolean
```

## Theme Colors

### CortexBuild Dark Theme
- **Primary**: Amber (#f59e0b) - Main action color
- **Secondary**: Blue (#3b82f6) - Secondary actions
- **Accent**: Emerald (#10b981) - Success/positive
- **Base**: Slate dark palette (#080b12, #0d1117, etc.)
- **Info**: Blue (#3b82f6)
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

## Best Practices

1. **Use semantic variants**: Choose `variant="success"` instead of hardcoding colors
2. **Consistent sizing**: Use the provided size props (`sm`, `md`, `lg`) for consistency
3. **Accessibility**: DaisyUI components include proper ARIA attributes
4. **Theme awareness**: Components adapt to the current theme automatically
5. **Combine with Tailwind**: You can still use Tailwind utilities alongside DaisyUI classes

## Migration Priority

### High Priority (Core Components)
1. Dashboard.tsx
2. Projects.tsx
3. Invoicing.tsx
4. CRM.tsx
5. Safety.tsx

### Medium Priority (Frequently Used)
- RFIs.tsx
- Documents.tsx
- Teams.tsx
- Timesheets.tsx
- Procurement.tsx

### Low Priority (Specialized)
- BIM Viewer
- Analytics modules
- Settings
- Admin Dashboard

## Testing Checklist

After migrating a component:

- [ ] Component renders without errors
- [ ] All interactive elements work (buttons, inputs, etc.)
- [ ] Theme switching works correctly
- [ ] Dark and light themes both look correct
- [ ] Responsive design is maintained
- [ ] Accessibility is preserved (keyboard navigation, screen readers)
- [ ] No console errors or warnings

## Troubleshooting

### Styles not applying
- Ensure the component imports are correct
- Check that Tailwind is processing the files (content paths in tailwind.config.js)
- Verify the DaisyUI plugin is loaded

### Theme not changing
- Check localStorage for theme value
- Ensure `data-theme` attribute is set on `<html>` element
- Clear browser cache if needed

### Component looks different
- Check for conflicting custom CSS classes
- Verify you're using the correct variant/size props
- Inspect computed styles in DevTools

## Next Steps

1. Start with high-priority modules
2. Create a test branch for each migration
3. Test thoroughly before merging
4. Document any custom styling needed
5. Remove old custom CSS as components are migrated

## Resources

- [DaisyUI Documentation](https://daisyui.com)
- [DaisyUI Components](https://daisyui.com/components/)
- [Theme Generator](https://daisyui.com/theme-generator/)
- [Tailwind CSS Docs](https://tailwindcss.com)
