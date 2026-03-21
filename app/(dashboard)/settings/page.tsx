export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-10">
            {/* Page header */}
            <div className="mb-10">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                    Account
                </p>
                <h1 className="font-serif text-3xl text-foreground tracking-tight mb-1.5">
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground font-light">
                    Manage your account preferences and workspace configuration.
                </p>
            </div>

            {/* Placeholder */}
            <div className="bg-card border border-border rounded-xl px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground font-light">
                    Settings are coming soon.
                </p>
            </div>
        </div>
    )
}
