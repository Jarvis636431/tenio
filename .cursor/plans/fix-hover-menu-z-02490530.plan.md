<!-- 02490530-8d35-48a4-9d2d-f39d06010e96 56b75707-6a0c-45f5-9ea7-f138d170edad -->
# Fix Hover Menu Z-Index Issue

## Problem
The hover dropdown menu in the collapsed sidebar is being hidden behind the main page content because it's rendered within the sidebar's stacking context.

## Solution
Use React Portal to render the hover menu at the document root level, ensuring it appears above all page content while maintaining its visual position relative to the sidebar icon.

## Implementation Steps

### 1. Update AppSidebar.tsx
- Import `createPortal` from `react-dom`
- Add state to track the position of the hovered menu trigger element
- Update `handleMouseEnter` to calculate and store the trigger element's position
- Wrap the hover menu in a Portal using `createPortal`
- Change menu positioning from `absolute left-full` to `fixed` with calculated coordinates
- Increase z-index to `z-[9999]` to ensure it's above all page content

### Key Changes
```tsx
// Import Portal
import { createPortal } from 'react-dom';

// Add position state
const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);

// Calculate position on hover
const handleMouseEnter = (itemId: string, event: React.MouseEvent) => {
  const rect = event.currentTarget.getBoundingClientRect();
  setMenuPosition({
    top: rect.top,
    left: rect.right + 8 // 8px gap
  });
  // ... existing code
};

// Render menu via Portal with fixed positioning
{hoveredItem === item.id && menuPosition && createPortal(
  <div 
    style={{ top: menuPosition.top, left: menuPosition.left }}
    className="fixed z-[9999] w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2"
    // ... rest of menu
  />,
  document.body
)}
```

This ensures the menu is rendered at the document root, outside the sidebar's stacking context, and will always appear on top of page content.
