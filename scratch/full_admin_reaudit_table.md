# Full Re-Audit of Admin Panel Components & Color Tokens

## 1. Structural Shades & Interactive Elevation Roles

| Original Shade | UI Role | Token Mapping | Purpose & Distinction |
|:---|:---|:---|:---|
| `#111` / `#0a0a0a` | **Layer 0: Page Root & Inputs** | `bg-background-dark` | Deepest backdrop behind cards; inner input fields (`bg-background-dark border-teal-600/30`). |
| `#1A1A1A` | **Layer 1: Card & Panel Surface** | `bg-teal-800` | Primary container cards, section panels, and modal content bodies (`bg-teal-800 border-teal-600/30`). |
| `#2A2A2A` | **Layer 2: Hover, Floating & Sub-surfaces** | `hover:bg-primary/5`, `bg-teal-950`, `hover:bg-primary/20` | Interactive elevation — table row hover (`hover:bg-primary/5`), floating dropdowns (`bg-teal-950 border-teal-600/50`), and nested timeline cards (`bg-background-dark/70`). **Never collapsed into Layer 1.** |

## 2. Hardcoded & Semantic Colors by File

### `src/pages/AdminAuditLog.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 128 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 128 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 131 | `text-white` | `<CardTitle className="text-2xl flex items-center gap-2 text-` | Decorative (Brand/Neutral) |
| 135 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 142 | `text-text-muted` | `<Search className="absolute left-3 top-1/2 -translate-y-1/2 ` | Decorative (Token Already Aligned) |
| 147 | `bg-background-dark` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Token Already Aligned) |
| 147 | `border-teal-600/30` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Token Already Aligned) |
| 147 | `text-white` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Brand/Neutral) |
| 151 | `border-teal-600/30` | `<Button onClick={handleExportCSV} variant="outline" classNam` | Decorative (Token Already Aligned) |
| 151 | `text-white` | `<Button onClick={handleExportCSV} variant="outline" classNam` | Decorative (Brand/Neutral) |
| 163 | `border-teal-600/30` | `<div className="rounded-lg border border-teal-600/30 overflo` | Decorative (Token Already Aligned) |
| 166 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 167 | `text-text-muted` | `<TableHead className="text-text-muted">Date</TableHead>` | Decorative (Token Already Aligned) |
| 168 | `text-text-muted` | `<TableHead className="text-text-muted">Admin</TableHead>` | Decorative (Token Already Aligned) |
| 169 | `text-text-muted` | `<TableHead className="text-text-muted">Action</TableHead>` | Decorative (Token Already Aligned) |
| 170 | `text-text-muted` | `<TableHead className="text-text-muted">Target</TableHead>` | Decorative (Token Already Aligned) |
| 171 | `text-text-muted` | `<TableHead className="text-text-muted text-right">Details</T` | Decorative (Token Already Aligned) |
| 177 | `text-text-muted` | `<TableCell colSpan={5} className="text-center py-8 text-text` | Decorative (Token Already Aligned) |
| 183 | `border-teal-600/30` | `<TableRow key={log.id} className="border-teal-600/30 hover:b` | Decorative (Token Already Aligned) |
| 186 | `text-white` | `<span className="text-white flex items-center gap-1">` | Decorative (Brand/Neutral) |
| 187 | `text-text-muted` | `<Calendar className="h-3 w-3 text-text-muted" />` | Decorative (Token Already Aligned) |
| 190 | `text-text-muted` | `<span className="text-xs text-text-muted ml-4">` | Decorative (Token Already Aligned) |
| 195 | `text-white` | `<TableCell className="text-white font-medium">` | Decorative (Brand/Neutral) |
| 203 | `text-text-muted` | `<TableCell className="text-text-muted">` | Decorative (Token Already Aligned) |
| 229 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 229 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 229 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 240 | `bg-background-dark` | `<pre className="bg-background-dark p-4 rounded-lg border bor` | Decorative (Token Already Aligned) |
| 240 | `border-teal-600/30` | `<pre className="bg-background-dark p-4 rounded-lg border bor` | Decorative (Token Already Aligned) |
| 240 | `text-green-400` | `<pre className="bg-background-dark p-4 rounded-lg border bor` | Decorative (Brand/Neutral) |

### `src/pages/AdminContact.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 115 | `bg-teal-800` | `<Card className="bg-teal-800 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 115 | `border-teal-600/30` | `<Card className="bg-teal-800 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 117 | `text-white` | `<CardTitle className="text-white">Contact Page Settings</Car` | Decorative (Brand/Neutral) |
| 118 | `text-text-muted` | `<CardDescription className="text-text-muted">Edit the contac` | Decorative (Token Already Aligned) |
| 135 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 135 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 135 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 144 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 144 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 144 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 159 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 159 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 159 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 173 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 173 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 173 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 190 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 190 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 190 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 199 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 199 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 199 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 208 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 208 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 208 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 217 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 217 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 217 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 223 | `border-teal-600/30` | `<div className="flex justify-end pt-4 border-t border-teal-6` | Decorative (Token Already Aligned) |
| 227 | `text-background-dark` | `className="bg-primary text-background-dark hover:bg-primary/` | Decorative (Token Already Aligned) |

### `src/pages/AdminContactSubmissions.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 233 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 233 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 237 | `text-white` | `<CardTitle className="flex items-center gap-2 text-white">` | Decorative (Brand/Neutral) |
| 241 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 260 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 260 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 275 | `text-text-muted` | `<Mail className="h-12 w-12 mx-auto text-text-muted mb-4" />` | Decorative (Token Already Aligned) |
| 276 | `text-text-muted` | `<p className="text-text-muted">` | Decorative (Token Already Aligned) |
| 281 | `border-teal-600/30` | `<div className="overflow-x-auto rounded-lg border border-tea` | Decorative (Token Already Aligned) |
| 284 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 291 | `text-text-muted` | `<TableHead className="text-text-muted">Name</TableHead>` | Decorative (Token Already Aligned) |
| 292 | `text-text-muted` | `<TableHead className="text-text-muted">Email</TableHead>` | Decorative (Token Already Aligned) |
| 293 | `text-text-muted` | `<TableHead className="text-text-muted">Use Case</TableHead>` | Decorative (Token Already Aligned) |
| 294 | `text-text-muted` | `<TableHead className="text-text-muted">Status</TableHead>` | Decorative (Token Already Aligned) |
| 295 | `text-text-muted` | `<TableHead className="text-text-muted">Attachments</TableHea` | Decorative (Token Already Aligned) |
| 296 | `text-text-muted` | `<TableHead className="text-text-muted">Date</TableHead>` | Decorative (Token Already Aligned) |
| 297 | `text-text-muted` | `<TableHead className="text-text-muted text-right">Actions</T` | Decorative (Token Already Aligned) |
| 302 | `border-teal-600/30` | `<TableRow key={contact.id} className="border-teal-600/30 hov` | Decorative (Token Already Aligned) |
| 309 | `text-white` | `<TableCell className="font-medium text-white">` | Decorative (Brand/Neutral) |
| 311 | `text-text-muted` | `<User className="h-4 w-4 text-text-muted" />` | Decorative (Token Already Aligned) |
| 323 | `text-text-muted` | `<TableCell className="text-text-muted">` | Decorative (Token Already Aligned) |
| 348 | `text-text-muted` | `<span className="text-text-muted">None</span>` | Decorative (Token Already Aligned) |
| 352 | `text-text-muted` | `<div className="flex items-center gap-2 text-sm text-text-mu` | Decorative (Token Already Aligned) |
| 366 | `text-text-muted` | `className="h-8 w-8 text-text-muted hover:text-white"` | Decorative (Token Already Aligned) |
| 374 | `text-text-muted` | `className="h-8 w-8 text-text-muted hover:text-red-400"` | Decorative (Token Already Aligned) |
| 389 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 389 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 391 | `text-white` | `<CardTitle className="text-white">Quick Tips</CardTitle>` | Decorative (Brand/Neutral) |
| 393 | `text-text-muted` | `<CardContent className="space-y-2 text-sm text-text-muted">` | Decorative (Token Already Aligned) |
| 404 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 404 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 404 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 407 | `text-text-muted` | `<DialogDescription className="text-text-muted">View and mana` | Decorative (Token Already Aligned) |
| 413 | `text-text-muted` | `<Label className="text-text-muted">Name</Label>` | Decorative (Token Already Aligned) |
| 414 | `text-white` | `<p className="text-white font-medium">{selectedContact.name}` | Decorative (Brand/Neutral) |
| 417 | `text-text-muted` | `<Label className="text-text-muted">Email</Label>` | Decorative (Token Already Aligned) |
| 418 | `text-white` | `<p className="text-white">{selectedContact.email}</p>` | Decorative (Brand/Neutral) |
| 421 | `text-text-muted` | `<Label className="text-text-muted">Use Case</Label>` | Decorative (Token Already Aligned) |
| 422 | `text-white` | `<p className="text-white">{selectedContact.use_case \|\| '-'}<` | Decorative (Brand/Neutral) |
| 425 | `text-text-muted` | `<Label className="text-text-muted">Team Size</Label>` | Decorative (Token Already Aligned) |
| 426 | `text-white` | `<p className="text-white">{selectedContact.team_size \|\| '-'}` | Decorative (Brand/Neutral) |
| 430 | `text-text-muted` | `<Label className="text-text-muted">Message</Label>` | Decorative (Token Already Aligned) |
| 431 | `text-white` | `<p className="text-white whitespace-pre-wrap bg-background-d` | Decorative (Brand/Neutral) |
| 431 | `bg-background-dark` | `<p className="text-white whitespace-pre-wrap bg-background-d` | Decorative (Token Already Aligned) |
| 431 | `border-teal-600/30` | `<p className="text-white whitespace-pre-wrap bg-background-d` | Decorative (Token Already Aligned) |
| 437 | `text-text-muted` | `<Label className="text-text-muted">Attachments</Label>` | Decorative (Token Already Aligned) |
| 445 | `border-teal-600/30` | `className="border-teal-600/30 text-primary hover:bg-primary/` | Decorative (Token Already Aligned) |
| 454 | `border-teal-600/30` | `<div className="flex items-center justify-between pt-4 borde` | Decorative (Token Already Aligned) |
| 456 | `text-text-muted` | `<Label className="text-text-muted">Status</Label>` | Decorative (Token Already Aligned) |
| 464 | `bg-background-dark` | `<SelectTrigger className="w-32 bg-background-dark border-tea` | Decorative (Token Already Aligned) |
| 464 | `border-teal-600/30` | `<SelectTrigger className="w-32 bg-background-dark border-tea` | Decorative (Token Already Aligned) |
| 467 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 467 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 475 | `text-text-muted` | `<div className="text-text-muted text-sm">` | Decorative (Token Already Aligned) |

### `src/pages/AdminContent.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 219 | `text-background-dark` | `<Button onClick={resetForm} className="bg-primary hover:bg-p` | Decorative (Token Already Aligned) |
| 224 | `bg-teal-900` | `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 224 | `border-teal-600/30` | `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 226 | `text-white` | `<DialogTitle className="text-white">` | Decorative (Brand/Neutral) |
| 232 | `text-white` | `<Label htmlFor="title" className="text-white">Title *</Label` | Decorative (Brand/Neutral) |
| 239 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 239 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 239 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 244 | `text-white` | `<Label htmlFor="description" className="text-white">Descript` | Decorative (Brand/Neutral) |
| 251 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 251 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 251 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 256 | `text-white` | `<Label htmlFor="contentType" className="text-white">Content ` | Decorative (Brand/Neutral) |
| 261 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 261 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 261 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 264 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 264 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 274 | `text-white` | `<Label htmlFor="videoFile" className="text-white">Upload Vid` | Decorative (Brand/Neutral) |
| 280 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 280 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 280 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 283 | `text-text-muted` | `<p className="text-sm text-text-muted">` | Decorative (Token Already Aligned) |
| 292 | `text-white` | `<Label htmlFor="contentText" className="text-white">Content ` | Decorative (Brand/Neutral) |
| 300 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 300 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 300 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 307 | `text-white` | `<Label htmlFor="videoFile" className="text-white">Upload Ani` | Decorative (Brand/Neutral) |
| 313 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 319 | `text-white` | `<Label htmlFor="displayOrder" className="text-white">Display` | Decorative (Brand/Neutral) |
| 326 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 326 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 326 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 328 | `text-text-muted` | `<p className="text-xs text-text-muted">Lower numbers appear ` | Decorative (Token Already Aligned) |
| 337 | `text-white` | `<Label htmlFor="published" className="text-white">Published<` | Decorative (Brand/Neutral) |
| 348 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 348 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 352 | `text-background-dark` | `<Button type="submit" disabled={isSubmitting} className="bg-` | Decorative (Token Already Aligned) |
| 374 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 374 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 376 | `text-text-muted` | `<p className="text-text-muted">No content yet. Create your f` | Decorative (Token Already Aligned) |
| 381 | `border-teal-600/30` | `<Card key={content.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 381 | `bg-teal-800` | `<Card key={content.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 387 | `text-white` | `<CardTitle className="text-white">{content.title}</CardTitle` | Decorative (Brand/Neutral) |
| 389 | `bg-yellow-500/10` | `<span className="text-xs bg-yellow-500/10 text-yellow-500 px` | Decorative (Brand/Neutral) |
| 389 | `text-yellow-500` | `<span className="text-xs bg-yellow-500/10 text-yellow-500 px` | Decorative (Brand/Neutral) |
| 395 | `text-text-muted` | `<p className="text-sm text-text-muted">{content.description}` | Decorative (Token Already Aligned) |
| 397 | `text-text-muted` | `<p className="text-xs text-text-muted">Order: {content.displ` | Decorative (Token Already Aligned) |
| 404 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 404 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |

### `src/pages/AdminLearn.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 489 | `bg-background-dark` | `<TabsList className="grid w-full grid-cols-3 bg-background-d` | Decorative (Token Already Aligned) |
| 500 | `text-background-dark` | `<Button onClick={resetArticleForm} className="bg-primary hov` | Decorative (Token Already Aligned) |
| 504 | `bg-teal-900` | `<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 504 | `border-teal-600/30` | `<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 506 | `text-white` | `<DialogTitle className="text-white">{editingArticle ? 'Edit ` | Decorative (Brand/Neutral) |
| 510 | `bg-background-dark` | `<TabsList className="grid w-full grid-cols-3 bg-background-d` | Decorative (Token Already Aligned) |
| 519 | `text-white` | `<Label className="text-white">Title *</Label>` | Decorative (Brand/Neutral) |
| 520 | `bg-background-dark` | `<Input value={artTitle} onChange={(e) => { setArtTitle(e.tar` | Decorative (Token Already Aligned) |
| 520 | `border-teal-600/30` | `<Input value={artTitle} onChange={(e) => { setArtTitle(e.tar` | Decorative (Token Already Aligned) |
| 520 | `text-white` | `<Input value={artTitle} onChange={(e) => { setArtTitle(e.tar` | Decorative (Brand/Neutral) |
| 523 | `text-white` | `<Label className="text-white">Slug</Label>` | Decorative (Brand/Neutral) |
| 524 | `bg-background-dark` | `<Input value={artSlug} onChange={(e) => setArtSlug(e.target.` | Decorative (Token Already Aligned) |
| 524 | `border-teal-600/30` | `<Input value={artSlug} onChange={(e) => setArtSlug(e.target.` | Decorative (Token Already Aligned) |
| 524 | `text-white` | `<Input value={artSlug} onChange={(e) => setArtSlug(e.target.` | Decorative (Brand/Neutral) |
| 529 | `text-white` | `<Label className="text-white">Category</Label>` | Decorative (Brand/Neutral) |
| 531 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 531 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 531 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 534 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 534 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 542 | `text-white` | `<Label className="text-white">Author</Label>` | Decorative (Brand/Neutral) |
| 543 | `bg-background-dark` | `<Input value={artAuthor} onChange={(e) => setArtAuthor(e.tar` | Decorative (Token Already Aligned) |
| 543 | `border-teal-600/30` | `<Input value={artAuthor} onChange={(e) => setArtAuthor(e.tar` | Decorative (Token Already Aligned) |
| 543 | `text-white` | `<Input value={artAuthor} onChange={(e) => setArtAuthor(e.tar` | Decorative (Brand/Neutral) |
| 547 | `text-white` | `<Label className="text-white">Excerpt</Label>` | Decorative (Brand/Neutral) |
| 548 | `bg-background-dark` | `<Textarea value={artExcerpt} onChange={(e) => setArtExcerpt(` | Decorative (Token Already Aligned) |
| 548 | `border-teal-600/30` | `<Textarea value={artExcerpt} onChange={(e) => setArtExcerpt(` | Decorative (Token Already Aligned) |
| 548 | `text-white` | `<Textarea value={artExcerpt} onChange={(e) => setArtExcerpt(` | Decorative (Brand/Neutral) |
| 552 | `text-white` | `<Label className="text-white">Read Time</Label>` | Decorative (Brand/Neutral) |
| 553 | `bg-background-dark` | `<Input value={artReadTime} onChange={(e) => setArtReadTime(e` | Decorative (Token Already Aligned) |
| 553 | `border-teal-600/30` | `<Input value={artReadTime} onChange={(e) => setArtReadTime(e` | Decorative (Token Already Aligned) |
| 553 | `text-white` | `<Input value={artReadTime} onChange={(e) => setArtReadTime(e` | Decorative (Brand/Neutral) |
| 556 | `text-white` | `<Label className="text-white">Display Order</Label>` | Decorative (Brand/Neutral) |
| 557 | `bg-background-dark` | `<Input type="number" value={artOrder} onChange={(e) => setAr` | Decorative (Token Already Aligned) |
| 557 | `border-teal-600/30` | `<Input type="number" value={artOrder} onChange={(e) => setAr` | Decorative (Token Already Aligned) |
| 557 | `text-white` | `<Input type="number" value={artOrder} onChange={(e) => setAr` | Decorative (Brand/Neutral) |
| 562 | `text-white` | `<Label className="text-white">Featured</Label>` | Decorative (Brand/Neutral) |
| 566 | `text-white` | `<Label className="text-white">Published</Label>` | Decorative (Brand/Neutral) |
| 576 | `text-white` | `<Label className="text-white flex items-center gap-2"><Image` | Decorative (Brand/Neutral) |
| 577 | `bg-background-dark` | `<div className="flex gap-1 bg-background-dark rounded-lg p-1` | Decorative (Token Already Aligned) |
| 577 | `border-teal-600/30` | `<div className="flex gap-1 bg-background-dark rounded-lg p-1` | Decorative (Token Already Aligned) |
| 603 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 603 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 603 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 608 | `bg-background-dark` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 608 | `border-teal-600/30` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 608 | `hover:border-teal-600/30` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 610 | `text-text-muted` | `<span className="text-text-muted text-sm">{isUploading ? 'Up` | Decorative (Token Already Aligned) |
| 623 | `border-teal-600/30` | `<div className="w-full max-w-md aspect-video rounded-lg over` | Decorative (Token Already Aligned) |
| 632 | `text-white` | `<Label className="text-white flex items-center gap-2"><Video` | Decorative (Brand/Neutral) |
| 633 | `bg-background-dark` | `<div className="flex gap-1 bg-background-dark rounded-lg p-1` | Decorative (Token Already Aligned) |
| 633 | `border-teal-600/30` | `<div className="flex gap-1 bg-background-dark rounded-lg p-1` | Decorative (Token Already Aligned) |
| 660 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 660 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 660 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 663 | `text-text-muted` | `<p className="text-xs text-text-muted mt-1">Supports YouTube` | Decorative (Token Already Aligned) |
| 667 | `bg-background-dark` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 667 | `border-teal-600/30` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 667 | `hover:border-teal-600/30` | `<label className="flex-1 flex items-center justify-center ga` | Decorative (Token Already Aligned) |
| 669 | `text-text-muted` | `<span className="text-text-muted text-sm">{isUploading ? 'Up` | Decorative (Token Already Aligned) |
| 688 | `text-white` | `<Label className="text-white">Additional Images (one URL per` | Decorative (Brand/Neutral) |
| 692 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 692 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 692 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 701 | `text-white` | `<Label className="text-white">Article Content</Label>` | Decorative (Brand/Neutral) |
| 702 | `bg-background-dark` | `<Textarea value={artContent} onChange={(e) => setArtContent(` | Decorative (Token Already Aligned) |
| 702 | `border-teal-600/30` | `<Textarea value={artContent} onChange={(e) => setArtContent(` | Decorative (Token Already Aligned) |
| 702 | `text-white` | `<Textarea value={artContent} onChange={(e) => setArtContent(` | Decorative (Brand/Neutral) |
| 703 | `text-text-muted` | `<p className="text-xs text-text-muted">Use line breaks for p` | Decorative (Token Already Aligned) |
| 707 | `border-teal-600/30` | `<div className="flex gap-2 justify-end pt-4 border-t border-` | Decorative (Token Already Aligned) |
| 708 | `border-teal-600/30` | `<Button type="button" variant="outline" onClick={() => { set` | Decorative (Token Already Aligned) |
| 709 | `text-background-dark` | `<Button type="submit" disabled={isSubmitting} className="bg-` | Decorative (Token Already Aligned) |
| 722 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 722 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 722 | `text-text-muted` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 725 | `border-teal-600/30` | `<Card key={article.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 725 | `bg-teal-800` | `<Card key={article.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 730 | `border-teal-600/30` | `<img src={article.featured_image} alt="" className="w-20 h-1` | Decorative (Token Already Aligned) |
| 735 | `text-white` | `<CardTitle className="text-white flex items-center gap-2">` | Decorative (Brand/Neutral) |
| 737 | `text-yellow-500` | `{article.is_featured && <Star className="w-4 h-4 text-yellow` | Decorative (Brand/Neutral) |
| 738 | `text-yellow-500` | `{!article.is_published && <Badge variant="outline" className` | Semantic (State Indicator - Keep) |
| 738 | `border-yellow-500/50` | `{!article.is_published && <Badge variant="outline" className` | Semantic (State Indicator - Keep) |
| 740 | `text-text-muted` | `<p className="text-sm text-text-muted line-clamp-1">{article` | Decorative (Token Already Aligned) |
| 741 | `text-text-muted` | `<div className="flex items-center gap-3 text-xs text-text-mu` | Decorative (Token Already Aligned) |
| 758 | `border-teal-600/30` | `<Button size="sm" variant="outline" onClick={() => handleEdi` | Decorative (Token Already Aligned) |
| 774 | `text-background-dark` | `<Button onClick={resetCategoryForm} className="bg-primary ho` | Decorative (Token Already Aligned) |
| 778 | `bg-teal-900` | `<DialogContent className="max-w-lg bg-teal-900 border-teal-6` | Decorative (Token Already Aligned) |
| 778 | `border-teal-600/30` | `<DialogContent className="max-w-lg bg-teal-900 border-teal-6` | Decorative (Token Already Aligned) |
| 780 | `text-white` | `<DialogTitle className="text-white">{editingCategory ? 'Edit` | Decorative (Brand/Neutral) |
| 785 | `text-white` | `<Label className="text-white">Name *</Label>` | Decorative (Brand/Neutral) |
| 786 | `bg-background-dark` | `<Input value={catName} onChange={(e) => { setCatName(e.targe` | Decorative (Token Already Aligned) |
| 786 | `border-teal-600/30` | `<Input value={catName} onChange={(e) => { setCatName(e.targe` | Decorative (Token Already Aligned) |
| 786 | `text-white` | `<Input value={catName} onChange={(e) => { setCatName(e.targe` | Decorative (Brand/Neutral) |
| 789 | `text-white` | `<Label className="text-white">Slug</Label>` | Decorative (Brand/Neutral) |
| 790 | `bg-background-dark` | `<Input value={catSlug} onChange={(e) => setCatSlug(e.target.` | Decorative (Token Already Aligned) |
| 790 | `border-teal-600/30` | `<Input value={catSlug} onChange={(e) => setCatSlug(e.target.` | Decorative (Token Already Aligned) |
| 790 | `text-white` | `<Input value={catSlug} onChange={(e) => setCatSlug(e.target.` | Decorative (Brand/Neutral) |
| 794 | `text-white` | `<Label className="text-white">Description</Label>` | Decorative (Brand/Neutral) |
| 795 | `bg-background-dark` | `<Textarea value={catDescription} onChange={(e) => setCatDesc` | Decorative (Token Already Aligned) |
| 795 | `border-teal-600/30` | `<Textarea value={catDescription} onChange={(e) => setCatDesc` | Decorative (Token Already Aligned) |
| 795 | `text-white` | `<Textarea value={catDescription} onChange={(e) => setCatDesc` | Decorative (Brand/Neutral) |
| 799 | `text-white` | `<Label className="text-white">Icon</Label>` | Decorative (Brand/Neutral) |
| 801 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 801 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 801 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 802 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 802 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 812 | `text-white` | `<Label className="text-white">Display Order</Label>` | Decorative (Brand/Neutral) |
| 813 | `bg-background-dark` | `<Input type="number" value={catOrder} onChange={(e) => setCa` | Decorative (Token Already Aligned) |
| 813 | `border-teal-600/30` | `<Input type="number" value={catOrder} onChange={(e) => setCa` | Decorative (Token Already Aligned) |
| 813 | `text-white` | `<Input type="number" value={catOrder} onChange={(e) => setCa` | Decorative (Brand/Neutral) |
| 818 | `text-white` | `<Label className="text-white">Active</Label>` | Decorative (Brand/Neutral) |
| 820 | `border-teal-600/30` | `<div className="flex gap-2 justify-end pt-4 border-t border-` | Decorative (Token Already Aligned) |
| 821 | `border-teal-600/30` | `<Button type="button" variant="outline" onClick={() => { set` | Decorative (Token Already Aligned) |
| 822 | `text-background-dark` | `<Button type="submit" disabled={isSubmitting} className="bg-` | Decorative (Token Already Aligned) |
| 835 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 835 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 835 | `text-text-muted` | `<Card className="border-teal-600/30 bg-teal-800"><CardConten` | Decorative (Token Already Aligned) |
| 838 | `border-teal-600/30` | `<Card key={cat.id} className="border-teal-600/30 bg-teal-800` | Decorative (Token Already Aligned) |
| 838 | `bg-teal-800` | `<Card key={cat.id} className="border-teal-600/30 bg-teal-800` | Decorative (Token Already Aligned) |
| 844 | `text-white` | `<CardTitle className="text-white flex items-center gap-2">` | Decorative (Brand/Neutral) |
| 846 | `text-yellow-500` | `{!cat.is_active && <Badge variant="outline" className="text-` | Semantic (State Indicator - Keep) |
| 846 | `border-yellow-500/50` | `{!cat.is_active && <Badge variant="outline" className="text-` | Semantic (State Indicator - Keep) |
| 848 | `text-text-muted` | `<p className="text-sm text-text-muted">{cat.description}</p>` | Decorative (Token Already Aligned) |
| 852 | `border-teal-600/30` | `<Button size="sm" variant="outline" onClick={() => handleEdi` | Decorative (Token Already Aligned) |
| 900 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 900 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 902 | `text-text-muted` | `<MessageCircle className="w-12 h-12 mx-auto mb-4 text-text-m` | Decorative (Token Already Aligned) |
| 903 | `text-text-muted` | `<p className="text-text-muted">` | Decorative (Token Already Aligned) |
| 918 | `text-white` | `<span className="font-semibold text-white">{comment.author_n` | Decorative (Brand/Neutral) |
| 920 | `text-text-muted` | `<span className="text-sm text-text-muted">({comment.author_e` | Decorative (Token Already Aligned) |
| 923 | `text-yellow-500` | `<Badge variant="outline" className="text-yellow-500 border-y` | Semantic (State Indicator - Keep) |
| 923 | `border-yellow-500/50` | `<Badge variant="outline" className="text-yellow-500 border-y` | Semantic (State Indicator - Keep) |
| 926 | `text-green-500` | `<Badge variant="outline" className="text-green-500 border-gr` | Semantic (State Indicator - Keep) |
| 926 | `border-green-500/50` | `<Badge variant="outline" className="text-green-500 border-gr` | Semantic (State Indicator - Keep) |
| 929 | `text-white` | `<p className="text-white mb-3">{comment.content}</p>` | Decorative (Brand/Neutral) |
| 930 | `text-text-muted` | `<div className="flex items-center gap-4 text-sm text-text-mu` | Decorative (Token Already Aligned) |
| 943 | `bg-green-600` | `className="bg-green-600 hover:bg-green-700"` | Decorative (Brand/Neutral) |

### `src/pages/AdminNewsletter.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 161 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 161 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 163 | `text-white` | `<CardTitle className="flex items-center gap-2 text-white">` | Decorative (Brand/Neutral) |
| 167 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 178 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 178 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 185 | `text-white` | `<span className="text-sm font-medium text-white">` | Decorative (Brand/Neutral) |
| 206 | `text-text-muted` | `<Mail className="h-12 w-12 mx-auto text-text-muted mb-4" />` | Decorative (Token Already Aligned) |
| 207 | `text-text-muted` | `<p className="text-text-muted">` | Decorative (Token Already Aligned) |
| 212 | `border-teal-600/30` | `<div className="overflow-x-auto rounded-lg border border-tea` | Decorative (Token Already Aligned) |
| 215 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 222 | `text-text-muted` | `<TableHead className="text-text-muted">Email</TableHead>` | Decorative (Token Already Aligned) |
| 223 | `text-text-muted` | `<TableHead className="text-text-muted">Date</TableHead>` | Decorative (Token Already Aligned) |
| 224 | `text-text-muted` | `<TableHead className="text-text-muted">Time</TableHead>` | Decorative (Token Already Aligned) |
| 231 | `border-teal-600/30` | `<TableRow key={subscriber.id} className="border-teal-600/30 ` | Decorative (Token Already Aligned) |
| 248 | `text-text-muted` | `<div className="flex items-center gap-2 text-sm text-text-mu` | Decorative (Token Already Aligned) |
| 254 | `text-text-muted` | `<div className="flex items-center gap-2 text-sm text-text-mu` | Decorative (Token Already Aligned) |

### `src/pages/AdminOverview.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 108 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 108 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 111 | `text-text-muted` | `<p className="text-sm text-text-muted mb-1">Total Users</p>` | Decorative (Token Already Aligned) |
| 115 | `text-white` | `<h3 className="text-3xl font-bold text-white font-display">{` | Decorative (Brand/Neutral) |
| 120 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 120 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 122 | `text-green-400` | `<CreditCard className="h-8 w-8 text-green-400 mb-2" />` | Decorative (Brand/Neutral) |
| 123 | `text-text-muted` | `<p className="text-sm text-text-muted mb-1">Active Subscript` | Decorative (Token Already Aligned) |
| 127 | `text-white` | `<h3 className="text-3xl font-bold text-white font-display">{` | Decorative (Brand/Neutral) |
| 132 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 132 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 134 | `text-blue-400` | `<Activity className="h-8 w-8 text-blue-400 mb-2" />` | Decorative (Brand/Neutral) |
| 135 | `text-text-muted` | `<p className="text-sm text-text-muted mb-1">Manual Grants</p` | Decorative (Token Already Aligned) |
| 139 | `text-white` | `<h3 className="text-3xl font-bold text-white font-display">{` | Decorative (Brand/Neutral) |
| 144 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 144 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 146 | `text-yellow-500` | `<Wrench className="h-8 w-8 text-yellow-500 mb-2" />` | Decorative (Brand/Neutral) |
| 147 | `text-text-muted` | `<p className="text-sm text-text-muted mb-1">Tools in Mainten` | Decorative (Token Already Aligned) |
| 151 | `text-white` | `<h3 className="text-3xl font-bold text-white font-display">{` | Decorative (Brand/Neutral) |
| 158 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 158 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 160 | `text-white` | `<CardTitle className="text-white">Recent Activity</CardTitle` | Decorative (Brand/Neutral) |
| 169 | `text-text-muted` | `<Activity className="h-12 w-12 mx-auto text-text-muted mb-4"` | Decorative (Token Already Aligned) |
| 170 | `text-text-muted` | `<p className="text-text-muted">No recent activity logged.</p` | Decorative (Token Already Aligned) |
| 173 | `border-teal-600/30` | `<div className="overflow-x-auto rounded-lg border border-tea` | Decorative (Token Already Aligned) |
| 176 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 177 | `text-text-muted` | `<TableHead className="text-text-muted">Action</TableHead>` | Decorative (Token Already Aligned) |
| 178 | `text-text-muted` | `<TableHead className="text-text-muted">Target</TableHead>` | Decorative (Token Already Aligned) |
| 179 | `text-text-muted` | `<TableHead className="text-text-muted">Admin</TableHead>` | Decorative (Token Already Aligned) |
| 180 | `text-text-muted` | `<TableHead className="text-text-muted">Date</TableHead>` | Decorative (Token Already Aligned) |
| 185 | `border-teal-600/30` | `<TableRow key={log.id} className="border-teal-600/30 hover:b` | Decorative (Token Already Aligned) |
| 191 | `text-white` | `<TableCell className="text-white">` | Decorative (Brand/Neutral) |
| 194 | `text-text-muted` | `<TableCell className="text-text-muted">` | Decorative (Token Already Aligned) |
| 198 | `text-text-muted` | `<div className="flex items-center gap-2 text-sm text-text-mu` | Decorative (Token Already Aligned) |

### `src/pages/AdminPricing.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 247 | `text-background-dark` | `<Button onClick={resetForm} className="bg-primary hover:bg-p` | Decorative (Token Already Aligned) |
| 252 | `bg-teal-900` | `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 252 | `border-teal-600/30` | `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 254 | `text-white` | `<DialogTitle className="text-white">` | Decorative (Brand/Neutral) |
| 261 | `text-white` | `<Label htmlFor="name" className="text-white">Package Name *<` | Decorative (Brand/Neutral) |
| 268 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 268 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 268 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 272 | `text-white` | `<Label htmlFor="price" className="text-white">Price *</Label` | Decorative (Brand/Neutral) |
| 279 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 279 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 279 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 285 | `text-white` | `<Label htmlFor="description" className="text-white">Full Des` | Decorative (Brand/Neutral) |
| 293 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 293 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 293 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 298 | `text-white` | `<Label htmlFor="shortDescription" className="text-white">Sho` | Decorative (Brand/Neutral) |
| 304 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 304 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 304 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 309 | `text-white` | `<Label htmlFor="features" className="text-white">Features (o` | Decorative (Brand/Neutral) |
| 316 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 316 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 316 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 322 | `text-white` | `<Label htmlFor="icon" className="text-white">Icon</Label>` | Decorative (Brand/Neutral) |
| 324 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 324 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 324 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 327 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 327 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 340 | `text-white` | `<Label htmlFor="ctaText" className="text-white">CTA Button T` | Decorative (Brand/Neutral) |
| 346 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 346 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 346 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 353 | `text-white` | `<Label htmlFor="badge" className="text-white">Badge Text</La` | Decorative (Brand/Neutral) |
| 359 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 359 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 359 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 363 | `text-white` | `<Label htmlFor="badgeColor" className="text-white">Badge Col` | Decorative (Brand/Neutral) |
| 365 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 365 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 365 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 368 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 368 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 381 | `text-white` | `<Label htmlFor="discountPercent" className="text-white flex ` | Decorative (Brand/Neutral) |
| 392 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 392 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 392 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 394 | `text-text-muted` | `<p className="text-xs text-text-muted">Set to 0 for no disco` | Decorative (Token Already Aligned) |
| 397 | `text-white` | `<Label htmlFor="displayOrder" className="text-white">Display` | Decorative (Brand/Neutral) |
| 403 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 403 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 403 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 405 | `text-text-muted` | `<p className="text-xs text-text-muted">Lower numbers appear ` | Decorative (Token Already Aligned) |
| 416 | `text-white` | `<Label htmlFor="isPopular" className="text-white">Mark as Po` | Decorative (Brand/Neutral) |
| 424 | `text-white` | `<Label htmlFor="isActive" className="text-white">Active</Lab` | Decorative (Brand/Neutral) |
| 436 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 436 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 440 | `text-background-dark` | `<Button type="submit" disabled={isSubmitting} className="bg-` | Decorative (Token Already Aligned) |
| 462 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 462 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 464 | `text-text-muted` | `<p className="text-text-muted">No pricing packages yet. Crea` | Decorative (Token Already Aligned) |
| 478 | `text-white` | `<CardTitle className="text-white">{pkg.name}</CardTitle>` | Decorative (Brand/Neutral) |
| 481 | `bg-red-500/20` | `<Badge className="bg-red-500/20 text-red-400 border-red-500/` | Semantic (State Indicator - Keep) |
| 481 | `text-red-400` | `<Badge className="bg-red-500/20 text-red-400 border-red-500/` | Semantic (State Indicator - Keep) |
| 481 | `border-red-500/30` | `<Badge className="bg-red-500/20 text-red-400 border-red-500/` | Semantic (State Indicator - Keep) |
| 486 | `bg-purple-500/20` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 486 | `text-purple-400` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 486 | `border-purple-500/30` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 491 | `border-yellow-500/30` | `<Badge variant="outline" className="border-yellow-500/30 tex` | Semantic (State Indicator - Keep) |
| 491 | `text-yellow-500` | `<Badge variant="outline" className="border-yellow-500/30 tex` | Semantic (State Indicator - Keep) |
| 501 | `text-text-muted` | `<p className="text-sm text-text-muted">{pkg.short_descriptio` | Decorative (Token Already Aligned) |
| 502 | `text-text-muted` | `<p className="text-xs text-text-muted">Order: {pkg.display_o` | Decorative (Token Already Aligned) |
| 510 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 510 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |

### `src/pages/AdminServices.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 273 | `text-background-dark` | `<Button onClick={resetForm} className="bg-primary hover:bg-p` | Decorative (Token Already Aligned) |
| 278 | `bg-teal-900` | `<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 278 | `border-teal-600/30` | `<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-` | Decorative (Token Already Aligned) |
| 280 | `text-white` | `<DialogTitle className="text-white">` | Decorative (Brand/Neutral) |
| 286 | `bg-background-dark` | `<TabsList className="grid w-full grid-cols-3 bg-background-d` | Decorative (Token Already Aligned) |
| 296 | `text-white` | `<Label htmlFor="title" className="text-white">Service Title ` | Decorative (Brand/Neutral) |
| 303 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 303 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 303 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 307 | `text-white` | `<Label htmlFor="slug" className="text-white">URL Slug</Label` | Decorative (Brand/Neutral) |
| 313 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 315 | `text-text-muted` | `<p className="text-xs text-text-muted">Auto-generated from t` | Decorative (Token Already Aligned) |
| 320 | `text-white` | `<Label htmlFor="shortDescription" className="text-white">Sho` | Decorative (Brand/Neutral) |
| 326 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 326 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 326 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 331 | `text-white` | `<Label htmlFor="description" className="text-white">Main Des` | Decorative (Brand/Neutral) |
| 339 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 339 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 339 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 344 | `text-white` | `<Label htmlFor="features" className="text-white">Features (o` | Decorative (Brand/Neutral) |
| 351 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 351 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 351 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 356 | `text-white` | `<Label htmlFor="quote" className="text-white">Quote (for sec` | Decorative (Brand/Neutral) |
| 362 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 362 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 362 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 364 | `text-text-muted` | `<p className="text-xs text-text-muted">Inspirational quote d` | Decorative (Token Already Aligned) |
| 368 | `text-white` | `<Label htmlFor="visualTags" className="text-white">Visual Ta` | Decorative (Brand/Neutral) |
| 375 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 375 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 375 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 377 | `text-text-muted` | `<p className="text-xs text-text-muted">Tags shown in the vis` | Decorative (Token Already Aligned) |
| 382 | `text-white` | `<Label htmlFor="icon" className="text-white">Icon</Label>` | Decorative (Brand/Neutral) |
| 384 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 384 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 384 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 387 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 387 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 400 | `text-white` | `<Label htmlFor="gradient" className="text-white">Color Theme` | Decorative (Brand/Neutral) |
| 402 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 402 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 402 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 405 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 405 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 418 | `text-white` | `<Label htmlFor="displayOrder" className="text-white">Display` | Decorative (Brand/Neutral) |
| 424 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 424 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 424 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 428 | `text-white` | `<Label htmlFor="isActive" className="text-white">Status</Lab` | Decorative (Brand/Neutral) |
| 430 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 430 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 430 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 433 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 433 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 445 | `text-white` | `<Label htmlFor="videoUrl" className="text-white flex items-c` | Decorative (Brand/Neutral) |
| 454 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 454 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 454 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 456 | `text-text-muted` | `<p className="text-xs text-text-muted">Supports YouTube and ` | Decorative (Token Already Aligned) |
| 460 | `text-white` | `<Label htmlFor="images" className="text-white flex items-cen` | Decorative (Brand/Neutral) |
| 470 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 470 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 470 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 472 | `text-text-muted` | `<p className="text-xs text-text-muted">Add image URLs to dis` | Decorative (Token Already Aligned) |
| 477 | `text-white` | `<Label className="text-white">Image Preview</Label>` | Decorative (Brand/Neutral) |
| 480 | `border-teal-600/30` | `<div key={idx} className="aspect-video rounded-lg overflow-h` | Decorative (Token Already Aligned) |
| 480 | `bg-background-dark` | `<div key={idx} className="aspect-video rounded-lg overflow-h` | Decorative (Token Already Aligned) |
| 494 | `text-white` | `<Label htmlFor="detailedContent" className="text-white">Deta` | Decorative (Brand/Neutral) |
| 501 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Token Already Aligned) |
| 501 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Token Already Aligned) |
| 501 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Brand/Neutral) |
| 503 | `text-text-muted` | `<p className="text-xs text-text-muted">This content appears ` | Decorative (Token Already Aligned) |
| 508 | `border-teal-600/30` | `<div className="flex gap-2 justify-end pt-4 border-t border-` | Decorative (Token Already Aligned) |
| 516 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 516 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 520 | `text-background-dark` | `<Button type="submit" disabled={isSubmitting} className="bg-` | Decorative (Token Already Aligned) |
| 542 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 542 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 544 | `text-text-muted` | `<p className="text-text-muted">No services yet. Create your ` | Decorative (Token Already Aligned) |
| 549 | `border-teal-600/30` | `<Card key={service.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 549 | `bg-teal-800` | `<Card key={service.id} className="border-teal-600/30 bg-teal` | Decorative (Token Already Aligned) |
| 557 | `text-white` | `<CardTitle className="text-white flex items-center gap-2">` | Decorative (Brand/Neutral) |
| 560 | `bg-yellow-500/20` | `<span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-y` | Decorative (Brand/Neutral) |
| 560 | `text-yellow-500` | `<span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-y` | Decorative (Brand/Neutral) |
| 563 | `text-text-muted` | `<p className="text-sm text-text-muted line-clamp-2">{service` | Decorative (Token Already Aligned) |
| 564 | `text-text-muted` | `<div className="flex items-center gap-4 text-xs text-text-mu` | Decorative (Token Already Aligned) |
| 581 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 581 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |

### `src/pages/AdminSubscriptions.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 305 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 305 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 308 | `text-white` | `<CardTitle className="text-2xl flex items-center gap-2 text-` | Decorative (Brand/Neutral) |
| 312 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 314 | `border-teal-600/30` | `<Badge variant="outline" className="mt-2 border-teal-600/30 ` | Decorative (Token Already Aligned) |
| 324 | `bg-background-dark` | `<SelectTrigger className="w-[180px] bg-background-dark borde` | Decorative (Token Already Aligned) |
| 324 | `border-teal-600/30` | `<SelectTrigger className="w-[180px] bg-background-dark borde` | Decorative (Token Already Aligned) |
| 327 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 327 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 337 | `text-background-dark` | `<Button onClick={() => setIsGrantModalOpen(true)} className=` | Decorative (Token Already Aligned) |
| 349 | `border-teal-600/30` | `<div className="rounded-lg border border-teal-600/30 overflo` | Decorative (Token Already Aligned) |
| 352 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 353 | `text-text-muted` | `<TableHead className="text-text-muted">User Email</TableHead` | Decorative (Token Already Aligned) |
| 354 | `text-text-muted` | `<TableHead className="text-text-muted">Tool</TableHead>` | Decorative (Token Already Aligned) |
| 355 | `text-text-muted` | `<TableHead className="text-text-muted">Status</TableHead>` | Decorative (Token Already Aligned) |
| 356 | `text-text-muted` | `<TableHead className="text-text-muted">Expires</TableHead>` | Decorative (Token Already Aligned) |
| 357 | `text-text-muted` | `<TableHead className="text-text-muted">Type</TableHead>` | Decorative (Token Already Aligned) |
| 358 | `text-text-muted` | `<TableHead className="text-text-muted text-right">Actions</T` | Decorative (Token Already Aligned) |
| 364 | `text-text-muted` | `<TableCell colSpan={6} className="text-center py-8 text-text` | Decorative (Token Already Aligned) |
| 370 | `border-teal-600/30` | `<TableRow key={sub.id} className="border-teal-600/30 hover:b` | Decorative (Token Already Aligned) |
| 371 | `text-white` | `<TableCell className="font-medium text-white">` | Decorative (Brand/Neutral) |
| 374 | `text-white` | `<TableCell className="text-white">` | Decorative (Brand/Neutral) |
| 382 | `border-orange-500/30` | `<Badge variant="outline" className="ml-2 border-orange-500/3` | Semantic (State Indicator - Keep) |
| 382 | `text-orange-400` | `<Badge variant="outline" className="ml-2 border-orange-500/3` | Semantic (State Indicator - Keep) |
| 385 | `text-text-muted` | `<TableCell className="text-text-muted">` | Decorative (Token Already Aligned) |
| 391 | `bg-purple-500/20` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 391 | `text-purple-400` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 391 | `border-purple-500/30` | `<Badge className="bg-purple-500/20 text-purple-400 border-pu` | Semantic (State Indicator - Keep) |
| 392 | `text-text-muted` | `<span className="text-xs text-text-muted mt-1 truncate max-w` | Decorative (Token Already Aligned) |
| 397 | `border-teal-600/30` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 397 | `text-text-muted` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 404 | `text-text-muted` | `<MoreVertical className="h-4 w-4 text-text-muted" />` | Decorative (Token Already Aligned) |
| 407 | `bg-teal-900` | `<DropdownMenuContent align="end" className="bg-teal-900 bord` | Decorative (Token Already Aligned) |
| 407 | `border-teal-600/30` | `<DropdownMenuContent align="end" className="bg-teal-900 bord` | Decorative (Token Already Aligned) |
| 415 | `text-yellow-500` | `<DropdownMenuItem onClick={() => handleRevoke(sub)} classNam` | Decorative (Brand/Neutral) |
| 420 | `text-red-500` | `<DropdownMenuItem onClick={() => setDeleteSub(sub)} classNam` | Semantic (State Indicator - Keep) |
| 439 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 439 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 439 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 453 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 453 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 453 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 458 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setEditDateSub(null` | Decorative (Token Already Aligned) |
| 458 | `text-white` | `<Button variant="outline" onClick={() => setEditDateSub(null` | Decorative (Brand/Neutral) |
| 459 | `text-background-dark` | `<Button onClick={handleDateEditSubmit} disabled={isActionLoa` | Decorative (Token Already Aligned) |
| 469 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Token Already Aligned) |
| 469 | `border-red-500/50` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Brand/Neutral) |
| 469 | `text-white` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Brand/Neutral) |
| 471 | `text-red-500` | `<DialogTitle className="text-red-500 flex items-center gap-2` | Decorative (Brand/Neutral) |
| 475 | `text-text-muted` | `<DialogDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 482 | `text-red-400` | `<Label className="text-red-400">Type "DELETE" to confirm</La` | Decorative (Brand/Neutral) |
| 486 | `bg-background-dark` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Token Already Aligned) |
| 486 | `border-red-500/50` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Brand/Neutral) |
| 486 | `text-white` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Brand/Neutral) |
| 492 | `border-teal-600/30` | `<Button variant="outline" onClick={() => { setDeleteSub(null` | Decorative (Token Already Aligned) |
| 492 | `text-white` | `<Button variant="outline" onClick={() => { setDeleteSub(null` | Decorative (Brand/Neutral) |
| 497 | `bg-red-500` | `className="bg-red-500 hover:bg-red-600 text-white"` | Decorative (Brand/Neutral) |
| 497 | `text-white` | `className="bg-red-500 hover:bg-red-600 text-white"` | Decorative (Brand/Neutral) |
| 508 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 508 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 508 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 530 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 530 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 530 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 534 | `bg-teal-950` | `<div className="absolute z-50 left-0 right-0 top-full mt-1 m` | Decorative (Brand/Neutral) |
| 534 | `border-teal-600/50` | `<div className="absolute z-50 left-0 right-0 top-full mt-1 m` | Decorative (Token Already Aligned) |
| 536 | `text-text-muted` | `<div className="px-3 py-2 text-xs text-text-muted italic">` | Decorative (Token Already Aligned) |
| 543 | `border-teal-600/10` | `className="px-3 py-2 text-sm cursor-pointer hover:bg-primary` | Decorative (Token Already Aligned) |
| 550 | `text-white` | `<span className="font-medium text-white">{u.email}</span>` | Decorative (Brand/Neutral) |
| 552 | `text-text-muted` | `<span className="text-xs text-text-muted">{u.full_name}</spa` | Decorative (Token Already Aligned) |
| 563 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 563 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 566 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 566 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 582 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 582 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 582 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 584 | `text-text-muted` | `<p className="text-xs text-text-muted">Required. A store_id ` | Decorative (Token Already Aligned) |
| 593 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Token Already Aligned) |
| 593 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Token Already Aligned) |
| 593 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Brand/Neutral) |
| 593 | `text-muted-foreground` | `className="bg-background-dark border-teal-600/30 text-white ` | Decorative (Token Already Aligned) |
| 595 | `text-text-muted` | `<p className="text-xs text-text-muted">Leave empty for lifet` | Decorative (Token Already Aligned) |
| 603 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 603 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 603 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 608 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setIsGrantModalOpen` | Decorative (Token Already Aligned) |
| 608 | `text-white` | `<Button variant="outline" onClick={() => setIsGrantModalOpen` | Decorative (Brand/Neutral) |
| 609 | `text-background-dark` | `<Button onClick={handleGrantSubmit} disabled={isActionLoadin` | Decorative (Token Already Aligned) |

### `src/pages/AdminTools.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 162 | `bg-green-500/20` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 162 | `text-green-400` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 162 | `border-green-500/30` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 164 | `bg-yellow-500/20` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 164 | `text-yellow-400` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 164 | `border-yellow-500/30` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 166 | `bg-blue-500/20` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 166 | `text-blue-400` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 166 | `border-blue-500/30` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 168 | `bg-gray-500/20` | `return <Badge className="bg-gray-500/20 text-gray-400 border` | Decorative (Needs Token Migration) |
| 168 | `text-gray-400` | `return <Badge className="bg-gray-500/20 text-gray-400 border` | Decorative (Needs Token Migration) |
| 168 | `border-gray-500/30` | `return <Badge className="bg-gray-500/20 text-gray-400 border` | Decorative (Needs Token Migration) |
| 181 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 181 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 183 | `text-white` | `<CardTitle className="text-2xl flex items-center gap-2 text-` | Decorative (Brand/Neutral) |
| 187 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 199 | `border-teal-600/30` | `<Card key={tool.id} className="border-teal-600/30 bg-backgro` | Decorative (Token Already Aligned) |
| 199 | `bg-background-dark` | `<Card key={tool.id} className="border-teal-600/30 bg-backgro` | Decorative (Token Already Aligned) |
| 203 | `text-white` | `<h3 className="text-lg font-bold text-white font-display mb-` | Decorative (Brand/Neutral) |
| 204 | `text-text-muted` | `<p className="text-sm text-text-muted">{tool.short_descripti` | Decorative (Token Already Aligned) |
| 215 | `border-teal-600/30` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Token Already Aligned) |
| 215 | `text-white` | `className="border-teal-600/30 text-white hover:bg-primary/10` | Decorative (Brand/Neutral) |
| 222 | `#888` | `<div className="flex items-center gap-1.5 text-sm text-[#888` | Decorative (Needs Token Migration) |
| 230 | `text-text-muted` | `<span className="text-sm text-text-muted">Status:</span>` | Decorative (Token Already Aligned) |
| 235 | `text-text-muted` | `<span className="text-sm text-text-muted">Monthly Price:</sp` | Decorative (Token Already Aligned) |
| 236 | `text-white` | `<span className="text-sm font-medium text-white">AUD ${tool.` | Decorative (Brand/Neutral) |
| 240 | `bg-yellow-500/10` | `<div className="mt-2 p-3 bg-yellow-500/10 border border-yell` | Decorative (Brand/Neutral) |
| 240 | `border-yellow-500/20` | `<div className="mt-2 p-3 bg-yellow-500/10 border border-yell` | Decorative (Brand/Neutral) |
| 241 | `text-yellow-500` | `<span className="text-xs font-semibold text-yellow-500 block` | Decorative (Brand/Neutral) |
| 242 | `text-yellow-400/90` | `<span className="text-sm text-yellow-400/90">{tool.maintenan` | Decorative (Brand/Neutral) |
| 247 | `border-teal-600/30` | `<div className="mt-4 pt-4 border-t border-teal-600/30">` | Decorative (Token Already Aligned) |
| 270 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 270 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 270 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 274 | `text-white` | `Configure settings for <strong className="text-white">{editT` | Decorative (Brand/Neutral) |
| 281 | `bg-background-dark` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 281 | `border-teal-600/30` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Token Already Aligned) |
| 281 | `text-white` | `<SelectTrigger className="bg-background-dark border-teal-600` | Decorative (Brand/Neutral) |
| 284 | `bg-teal-900` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 284 | `border-teal-600/30` | `<SelectContent className="bg-teal-900 border-teal-600/30">` | Decorative (Token Already Aligned) |
| 300 | `bg-background-dark` | `className="bg-background-dark border-yellow-500/50 text-whit` | Decorative (Token Already Aligned) |
| 300 | `border-yellow-500/50` | `className="bg-background-dark border-yellow-500/50 text-whit` | Decorative (Brand/Neutral) |
| 300 | `text-white` | `className="bg-background-dark border-yellow-500/50 text-whit` | Decorative (Brand/Neutral) |
| 313 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 313 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 318 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setEditTool(null)} ` | Decorative (Token Already Aligned) |
| 318 | `text-white` | `<Button variant="outline" onClick={() => setEditTool(null)} ` | Decorative (Brand/Neutral) |
| 319 | `text-background-dark` | `<Button onClick={handleEditSubmit} disabled={isActionLoading` | Decorative (Token Already Aligned) |
| 329 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 329 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 329 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 333 | `text-white` | `<strong className="text-white">{notifyTool?.name}</strong> i` | Decorative (Brand/Neutral) |
| 337 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setNotifyTool(null)` | Decorative (Token Already Aligned) |
| 337 | `text-white` | `<Button variant="outline" onClick={() => setNotifyTool(null)` | Decorative (Brand/Neutral) |
| 338 | `text-background-dark` | `<Button onClick={handleNotifyAll} disabled={isNotifying} cla` | Decorative (Token Already Aligned) |

### `src/pages/AdminUsers.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 222 | `bg-green-500/20` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 222 | `text-green-400` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 222 | `border-green-500/30` | `return <Badge className="bg-green-500/20 text-green-400 bord` | Semantic (State Indicator - Keep) |
| 224 | `bg-blue-500/20` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 224 | `text-blue-400` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 224 | `border-blue-500/30` | `return <Badge className="bg-blue-500/20 text-blue-400 border` | Semantic (State Indicator - Keep) |
| 226 | `bg-red-500/20` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 226 | `text-red-400` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 226 | `border-red-500/30` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 228 | `bg-red-500/20` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 228 | `text-red-400` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 228 | `border-red-500/30` | `return <Badge className="bg-red-500/20 text-red-400 border-r` | Semantic (State Indicator - Keep) |
| 230 | `bg-yellow-500/20` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 230 | `text-yellow-400` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 230 | `border-yellow-500/30` | `return <Badge className="bg-yellow-500/20 text-yellow-400 bo` | Semantic (State Indicator - Keep) |
| 241 | `border-teal-600/30` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 241 | `bg-teal-800` | `<Card className="border-teal-600/30 bg-teal-800">` | Decorative (Token Already Aligned) |
| 244 | `text-white` | `<CardTitle className="text-2xl flex items-center gap-2 text-` | Decorative (Brand/Neutral) |
| 248 | `text-text-muted` | `<CardDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 254 | `text-text-muted` | `<Search className="absolute left-3 top-1/2 -translate-y-1/2 ` | Decorative (Token Already Aligned) |
| 259 | `bg-background-dark` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Token Already Aligned) |
| 259 | `border-teal-600/30` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Token Already Aligned) |
| 259 | `text-white` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Brand/Neutral) |
| 259 | `placeholder:text-text-muted` | `className="pl-9 bg-background-dark border-teal-600/30 text-w` | Decorative (Token Already Aligned) |
| 269 | `border-teal-600/30` | `<div className="rounded-lg border border-teal-600/30 overflo` | Decorative (Token Already Aligned) |
| 272 | `border-teal-600/30` | `<TableRow className="border-teal-600/30 hover:bg-primary/5">` | Decorative (Token Already Aligned) |
| 273 | `text-text-muted` | `<TableHead className="text-text-muted">User</TableHead>` | Decorative (Token Already Aligned) |
| 274 | `text-text-muted` | `<TableHead className="text-text-muted">Role</TableHead>` | Decorative (Token Already Aligned) |
| 275 | `text-text-muted` | `<TableHead className="text-text-muted">Phone</TableHead>` | Decorative (Token Already Aligned) |
| 276 | `text-text-muted` | `<TableHead className="text-text-muted">Registered</TableHead` | Decorative (Token Already Aligned) |
| 277 | `text-text-muted` | `<TableHead className="text-text-muted text-right">Actions</T` | Decorative (Token Already Aligned) |
| 283 | `text-text-muted` | `<TableCell colSpan={5} className="text-center py-8 text-text` | Decorative (Token Already Aligned) |
| 289 | `border-teal-600/30` | `<TableRow key={userItem.id} className="border-teal-600/30 ho` | Decorative (Token Already Aligned) |
| 292 | `text-white` | `<span className="font-medium text-white flex items-center ga` | Decorative (Brand/Neutral) |
| 295 | `text-text-muted` | `<span className="text-xs text-text-muted flex items-center g` | Decorative (Token Already Aligned) |
| 307 | `border-teal-600/30` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 307 | `text-text-muted` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 312 | `text-text-muted` | `<TableCell className="text-text-muted text-sm">` | Decorative (Token Already Aligned) |
| 315 | `text-text-muted` | `<TableCell className="text-text-muted text-sm">` | Decorative (Token Already Aligned) |
| 321 | `text-text-muted` | `<Button variant="ghost" size="icon" className="text-text-mut` | Decorative (Token Already Aligned) |
| 325 | `bg-teal-900` | `<DropdownMenuContent align="end" className="bg-teal-900 bord` | Decorative (Token Already Aligned) |
| 325 | `border-teal-600/30` | `<DropdownMenuContent align="end" className="bg-teal-900 bord` | Decorative (Token Already Aligned) |
| 325 | `text-white` | `<DropdownMenuContent align="end" className="bg-teal-900 bord` | Decorative (Brand/Neutral) |
| 344 | `text-red-500` | `<DropdownMenuItem onClick={() => setDeleteUser(userItem)} cl` | Semantic (State Indicator - Keep) |
| 363 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 363 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 363 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 369 | `text-text-muted` | `<DialogDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 370 | `text-white` | `Audit log of all entitlement and access events for <strong c` | Decorative (Brand/Neutral) |
| 380 | `border-teal-600/30` | `<div className="text-center py-10 border border-dashed borde` | Decorative (Token Already Aligned) |
| 380 | `text-text-muted` | `<div className="text-center py-10 border border-dashed borde` | Decorative (Token Already Aligned) |
| 384 | `before:bg-teal-600/40` | `<div className="relative pl-6 space-y-6 before:absolute befo` | Decorative (Token Already Aligned) |
| 388 | `border-teal-900` | `<div className="absolute -left-[27px] top-1 h-3.5 w-3.5 roun` | Decorative (Token Already Aligned) |
| 390 | `bg-background-dark/70` | `<div className="bg-background-dark/70 border border-teal-600` | Decorative (Token Already Aligned) |
| 390 | `border-teal-600/30` | `<div className="bg-background-dark/70 border border-teal-600` | Decorative (Token Already Aligned) |
| 393 | `text-white` | `<span className="font-semibold text-white uppercase tracking` | Decorative (Brand/Neutral) |
| 398 | `text-text-muted` | `<span className="text-xs text-text-muted flex items-center g` | Decorative (Token Already Aligned) |
| 406 | `text-text-muted` | `<span className="text-text-muted">Status:</span>` | Decorative (Token Already Aligned) |
| 407 | `border-teal-600/30` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 407 | `text-text-muted` | `<Badge variant="outline" className="border-teal-600/30 text-` | Decorative (Token Already Aligned) |
| 410 | `text-text-muted` | `<ArrowRight className="h-3 w-3 text-text-muted" />` | Decorative (Token Already Aligned) |
| 421 | `text-text-muted` | `<div className="text-xs text-text-muted">` | Decorative (Token Already Aligned) |
| 423 | `text-white` | `<strong className="text-white">` | Decorative (Brand/Neutral) |
| 429 | `border-teal-600/20` | `<div className="pt-2 border-t border-teal-600/20 flex flex-w` | Decorative (Token Already Aligned) |
| 430 | `text-text-muted` | `<div className="flex items-center gap-1.5 text-text-muted">` | Decorative (Token Already Aligned) |
| 434 | `text-white` | `<span>Admin: <span className="text-white">{event.changed_by_` | Decorative (Brand/Neutral) |
| 438 | `text-purple-400` | `<Bot className="h-3.5 w-3.5 text-purple-400" />` | Decorative (Brand/Neutral) |
| 439 | `text-purple-300` | `<span className="text-purple-300 font-medium">System / Autom` | Decorative (Brand/Neutral) |
| 444 | `text-text-muted` | `<span className="text-text-muted italic">` | Decorative (Token Already Aligned) |
| 457 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setTimelineUser(nul` | Decorative (Token Already Aligned) |
| 457 | `text-white` | `<Button variant="outline" onClick={() => setTimelineUser(nul` | Decorative (Brand/Neutral) |
| 466 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 466 | `border-teal-600/30` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Token Already Aligned) |
| 466 | `text-white` | `<DialogContent className="bg-teal-900 border-teal-600/30 tex` | Decorative (Brand/Neutral) |
| 477 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 477 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 477 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 485 | `bg-background-dark` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 485 | `border-teal-600/30` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Token Already Aligned) |
| 485 | `text-white` | `className="bg-background-dark border-teal-600/30 text-white"` | Decorative (Brand/Neutral) |
| 490 | `border-teal-600/30` | `<Button variant="outline" onClick={() => setEditUser(null)} ` | Decorative (Token Already Aligned) |
| 490 | `text-white` | `<Button variant="outline" onClick={() => setEditUser(null)} ` | Decorative (Brand/Neutral) |
| 491 | `text-background-dark` | `<Button onClick={handleEditSubmit} disabled={isActionLoading` | Decorative (Token Already Aligned) |
| 501 | `bg-teal-900` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Token Already Aligned) |
| 501 | `border-red-500/50` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Brand/Neutral) |
| 501 | `text-white` | `<DialogContent className="bg-teal-900 border-red-500/50 text` | Decorative (Brand/Neutral) |
| 503 | `text-red-500` | `<DialogTitle className="text-red-500 flex items-center gap-2` | Decorative (Brand/Neutral) |
| 507 | `text-text-muted` | `<DialogDescription className="text-text-muted">` | Decorative (Token Already Aligned) |
| 509 | `text-white` | `<strong className="text-white mx-1">{deleteUser?.email}</str` | Decorative (Brand/Neutral) |
| 515 | `text-red-400` | `<Label className="text-red-400">Type "DELETE" to confirm</La` | Decorative (Brand/Neutral) |
| 519 | `bg-background-dark` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Token Already Aligned) |
| 519 | `border-red-500/50` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Brand/Neutral) |
| 519 | `text-white` | `className="bg-background-dark border-red-500/50 text-white"` | Decorative (Brand/Neutral) |
| 525 | `border-teal-600/30` | `<Button variant="outline" onClick={() => { setDeleteUser(nul` | Decorative (Token Already Aligned) |
| 525 | `text-white` | `<Button variant="outline" onClick={() => { setDeleteUser(nul` | Decorative (Brand/Neutral) |
| 530 | `bg-red-500` | `className="bg-red-500 hover:bg-red-600 text-white"` | Decorative (Brand/Neutral) |
| 530 | `text-white` | `className="bg-red-500 hover:bg-red-600 text-white"` | Decorative (Brand/Neutral) |

### `src/components/AdminLayout.tsx`

| Line | Value | Where Used / Context | Category |
|:---:|:---|:---|:---|
| 100 | `bg-background-dark` | `<div className="min-h-screen bg-background-dark flex items-c` | Decorative (Token Already Aligned) |
| 145 | `text-text-muted/70` | `<span className="text-xs text-text-muted/70">{item.descripti` | Decorative (Token Already Aligned) |
| 157 | `text-text-muted` | `className="flex items-center gap-3 px-3 py-2 rounded-lg text` | Decorative (Token Already Aligned) |
| 166 | `text-text-muted` | `className="w-full justify-start gap-3 text-text-muted hover:` | Decorative (Token Already Aligned) |
| 178 | `bg-background-dark` | `<div className="min-h-screen bg-background-dark flex">` | Decorative (Token Already Aligned) |
| 209 | `text-text-muted` | `className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-` | Decorative (Token Already Aligned) |
| 228 | `bg-background-dark/80` | `<header className="sticky top-0 z-40 bg-background-dark/80 b` | Decorative (Token Already Aligned) |
| 233 | `text-text-muted` | `className="md:hidden p-2 text-text-muted hover:text-text-mai` | Decorative (Token Already Aligned) |
| 240 | `text-text-muted` | `<p className="text-text-muted mt-1 text-sm md:text-base">{de` | Decorative (Token Already Aligned) |
| 244 | `#888` | `<div className="flex items-center gap-4 text-sm text-[#888]"` | Decorative (Needs Token Migration) |

