interface HeaderProps {
    title?: string
}

export function Header({ title }: HeaderProps) {
    return (
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background">
            {title && (
                <h1 className="text-sm font-medium text-foreground">{title}</h1>
            )}
        </header>
    )
}
