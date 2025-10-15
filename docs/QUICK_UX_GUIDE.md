# Quick UX Implementation Guide

## 🎨 Dark Mode

### Setup (Already Done)
```tsx
// In app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <head>
    <meta name="theme-color" content="#ffffff" />
  </head>
  <body>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Add Theme Toggle
```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

// In your navbar
<ThemeToggle />
```

## ⏳ Loading States

### Table Loading
```tsx
import { TableSkeleton } from "@/components/LoadingSkeletons";

{isLoading ? <TableSkeleton rows={5} columns={6} /> : <DataTable />}
```

### Dashboard Loading
```tsx
import { DashboardSkeleton } from "@/components/LoadingSkeletons";

{isLoading ? <DashboardSkeleton /> : <Dashboard />}
```

### Card Grid Loading
```tsx
import { CardGridSkeleton } from "@/components/LoadingSkeletons";

{isLoading ? <CardGridSkeleton count={6} /> : <CardGrid />}
```

### Mobile Card Loading
```tsx
import { MobileCardGridSkeleton } from "@/components/LoadingSkeletons";

{isLoading ? <MobileCardGridSkeleton count={4} /> : <MobileCards />}
```

## ⚠️ Confirmation Dialogs

### Basic Usage
```tsx
import { ConfirmDialog } from "@/components/ConfirmDialog";

const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleAction}
  title="Confirm Action"
  description="Are you sure?"
  confirmText="Yes"
  cancelText="No"
/>
```

### Destructive Action
```tsx
<ConfirmDialog
  variant="destructive"
  title="Delete Item"
  description="This action cannot be undone."
  confirmText="Delete"
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

### Warning
```tsx
<ConfirmDialog
  variant="warning"
  title="Warning"
  description="This may affect other items."
/>
```

## 📭 Empty States

### Basic Empty State
```tsx
import { EmptyState } from "@/components/EmptyState";
import { PackageIcon } from "lucide-react";

<EmptyState
  icon={PackageIcon}
  title="No items found"
  description="Get started by creating your first item."
  action={{
    label: "Create Item",
    onClick: () => router.push("/items/new")
  }}
/>
```

### With Secondary Action
```tsx
<EmptyState
  icon={PackageIcon}
  title="No items found"
  description="Get started by creating your first item."
  action={{
    label: "Create Item",
    onClick: handleCreate
  }}
  secondaryAction={{
    label: "Import Items",
    onClick: handleImport
  }}
/>
```

## 📱 Mobile Responsiveness

### Hide on Mobile
```tsx
<div className="hidden md:block">
  Desktop only content
</div>
```

### Show on Mobile Only
```tsx
<div className="md:hidden">
  Mobile only content
</div>
```

### Responsive Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Mobile Bottom Navigation
```tsx
// Already implemented in Navbar.tsx
<div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
  {/* Navigation items */}
</div>
```

## ♿ Accessibility

### Focus Visible (Automatic)
All interactive elements automatically get focus indicators.

### Touch Targets (Automatic)
All buttons and links have minimum 44x44px touch targets.

### ARIA Labels
```tsx
<Button aria-label="Delete item">
  <TrashIcon />
</Button>
```

### Screen Reader Only Text
```tsx
<span className="sr-only">Loading...</span>
```

## 🎯 Common Patterns

### Page with Loading
```tsx
export function ItemsPage() {
  const { data, isLoading } = useItems();
  
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={PackageIcon}
        title="No items"
        description="Create your first item."
        action={{ label: "Create", onClick: handleCreate }}
      />
    );
  }
  
  return <ItemsTable data={data} />;
}
```

### Delete with Confirmation
```tsx
export function DeleteButton({ item }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useDeleteItem();
  
  const handleDelete = async () => {
    try {
      await mutateAsync(item.id);
      toast.success("Deleted successfully");
      setOpen(false);
    } catch {
      toast.error("Failed to delete");
    }
  };
  
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title="Delete Item"
        description={`Delete "${item.name}"?`}
        variant="destructive"
        loading={isPending}
      />
    </>
  );
}
```

### Form with Validation
```tsx
export function ItemForm() {
  const form = useForm({
    resolver: zodResolver(itemSchema),
  });
  
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              Enter the item name
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
```

## 🎨 Color Classes

### Background
- `bg-background` - Main background
- `bg-card` - Card background
- `bg-muted` - Muted background

### Text
- `text-foreground` - Main text
- `text-muted-foreground` - Secondary text
- `text-destructive` - Error text

### Borders
- `border` - Default border
- `border-destructive` - Error border

## 🚀 Performance Tips

1. **Use Suspense boundaries**
```tsx
<Suspense fallback={<TableSkeleton />}>
  <DataTable />
</Suspense>
```

2. **Lazy load heavy components**
```tsx
const HeavyChart = lazy(() => import("./HeavyChart"));
```

3. **Debounce search inputs**
```tsx
const debouncedSearch = useDebouncedValue(search, 300);
```

4. **Use React Query for caching**
```tsx
const { data } = useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## 📝 Checklist for New Pages

- [ ] Add loading skeleton
- [ ] Add empty state
- [ ] Add error state
- [ ] Test on mobile
- [ ] Test in dark mode
- [ ] Test keyboard navigation
- [ ] Add confirmation for destructive actions
- [ ] Add toast notifications
- [ ] Check touch target sizes
- [ ] Verify color contrast

## 🐛 Common Issues

### Dark mode not working
- Check `suppressHydrationWarning` on `<html>` tag
- Verify `ThemeProvider` wraps your app
- Check CSS variables are defined

### Skeleton doesn't match layout
- Use the same grid/flex layout
- Match column counts
- Adjust row heights

### Touch targets too small
- Use `min-h-[44px]` class
- Check on real mobile device
- Verify with Chrome DevTools mobile emulation

### Focus not visible
- Check if element is focusable
- Verify `:focus-visible` styles
- Test with keyboard navigation (Tab key)
